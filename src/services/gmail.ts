/**
 * Gmail service — OAuth2 via Google Identity Services (GIS) + Gmail REST API.
 * Fetches job-related emails from the Promotions inbox and returns raw email data
 * for AI parsing.
 *
 * Requires VITE_GOOGLE_CLIENT_ID in .env and the GIS script loaded in index.html.
 */

const GMAIL_API = 'https://www.googleapis.com/gmail/v1/users/me';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
const TOKEN_EXPIRY_KEY = 'cf_gmail_token_expiry';

// Job-related Gmail search — inbox + promotions + updates, last 60 days
// Covers: Indeed, Monster, Jobat, LinkedIn, Glassdoor, recruiters, job alerts
const JOB_QUERY =
  'newer_than:60d ' +
  '(' +
    // Known job-board senders
    'from:indeed.com OR from:jobalerts.indeed.com OR ' +
    'from:monster.com OR from:jobat.be OR from:jobat.com OR ' +
    'from:linkedin.com OR from:glassdoor.com OR from:ziprecruiter.com OR ' +
    'from:dice.com OR from:careerbuilder.com OR from:simplyhired.com OR ' +
    'from:talent.com OR from:jooble.org OR from:snagajob.com OR ' +
    // Subject-based fallback for recruiter emails
    'subject:"job alert" OR subject:"jobs alert" OR ' +
    'subject:"new jobs" OR subject:"jobs matching" OR ' +
    'subject:"job opportunity" OR subject:"job opening" OR ' +
    'subject:"hiring" OR subject:"we\'re hiring" OR ' +
    'subject:"recruiter" OR subject:"job recommendation" OR ' +
    'subject:"career opportunity" OR subject:"position available" OR ' +
    'subject:"apply now" OR subject:"job match"' +
  ')';

// In-memory token (never persisted to localStorage for security)
let _accessToken: string | null = null;
let _gisLoaded = false;
let _tokenClient: TokenClient | null = null;

// Minimal typings for GIS
interface TokenResponse { access_token: string; expires_in: number; error?: string }
interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
  callback: (resp: TokenResponse) => void;
}

function getClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';
}

/** Dynamically load the Google Identity Services script */
async function loadGIS(): Promise<void> {
  if (_gisLoaded) return;
  return new Promise((resolve, reject) => {
    if (document.getElementById('gis-script')) { _gisLoaded = true; resolve(); return; }
    const script = document.createElement('script');
    script.id = 'gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => { _gisLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

async function ensureTokenClient(): Promise<TokenClient> {
  if (_tokenClient) return _tokenClient;
  await loadGIS();
  _tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: getClientId(),
    scope: SCOPES,
    callback: () => {}, // overridden per-request below
  }) as TokenClient;
  return _tokenClient;
}

/** Open Google OAuth popup and return access token */
export async function connectGmail(): Promise<string> {
  if (!getClientId()) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not set. Add it to your .env file.');
  }
  const client = await ensureTokenClient();
  return new Promise<string>((resolve, reject) => {
    client.callback = (resp: TokenResponse) => {
      if (resp.error) { reject(new Error(resp.error)); return; }
      _accessToken = resp.access_token;
      const expiry = Date.now() + resp.expires_in * 1000;
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
      resolve(resp.access_token);
    };
    client.requestAccessToken({ prompt: 'consent' });
  });
}

/** Return stored token if still valid */
export function getToken(): string | null {
  if (!_accessToken) return null;
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry || Date.now() >= parseInt(expiry, 10)) {
    _accessToken = null;
    return null;
  }
  return _accessToken;
}

export function isGmailTokenValid(): boolean {
  return !!getToken();
}

export function disconnectGmail(): void {
  _accessToken = null;
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

// ---------------------------------------------------------------------------
// Gmail REST helpers
// ---------------------------------------------------------------------------

async function gmailGet(path: string, token: string): Promise<any> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error('GMAIL_UNAUTHORIZED');
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return res.json();
}

function decodeBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  } catch {
    return atob(base64);
  }
}

function extractTextFromPayload(payload: any): string {
  if (payload?.body?.data) return decodeBase64Url(payload.body.data);
  if (payload?.parts) {
    // Prefer plain text
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    // Fall back to HTML (strip tags)
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64Url(part.body.data)
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
    // Recurse into multipart
    for (const part of payload.parts) {
      const text = extractTextFromPayload(part);
      if (text) return text;
    }
  }
  return '';
}

export interface RawEmail {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  receivedAt: string;
  body: string; // truncated to 2000 chars for AI
}

/**
 * Fetch job-related emails from Gmail Promotions.
 * @param token  Valid OAuth2 access token
 * @param max    Max messages to fetch (default 15)
 */
export async function fetchJobEmails(token: string, max = 30): Promise<RawEmail[]> {
  const q = encodeURIComponent(JOB_QUERY);
  const listData = await gmailGet(`/messages?q=${q}&maxResults=${max}`, token);
  if (!listData.messages?.length) return [];

  const results: RawEmail[] = [];

  await Promise.allSettled(
    (listData.messages as { id: string }[]).map(async ({ id }) => {
      try {
        const detail = await gmailGet(`/messages/${id}?format=full`, token);
        const headers: { name: string; value: string }[] = detail.payload?.headers ?? [];
        const get = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
        const dateStr = get('Date');

        results.push({
          id,
          subject: get('Subject'),
          from: get('From'),
          snippet: detail.snippet ?? '',
          receivedAt: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
          body: extractTextFromPayload(detail.payload).slice(0, 2000),
        });
      } catch {
        // skip individual message errors
      }
    }),
  );

  return results;
}
