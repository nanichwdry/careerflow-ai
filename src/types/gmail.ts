export interface EmailJob {
  id: string;          // unique id (same as emailId)
  emailId: string;     // Gmail message ID
  subject: string;     // raw email subject
  from: string;        // sender string
  receivedAt: string;  // ISO date
  title: string;       // parsed job title
  company: string;     // parsed company name
  location: string;    // parsed location
  workArrangement: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  salary?: string;     // salary text if mentioned
  applyUrl?: string;   // direct apply URL from email
  snippet: string;     // Gmail email snippet
  dismissed: boolean;
  savedToTracker: boolean;
}

export interface GmailSyncState {
  connected: boolean;
  lastSync: string | null;  // ISO date
}
