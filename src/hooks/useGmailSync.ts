import { useState, useCallback } from 'react';
import {
  connectGmail, getToken, isGmailTokenValid,
  disconnectGmail, fetchJobEmails,
} from '@/services/gmail';
import { parseEmailJob } from '@/services/ai';
import { useApp } from '@/contexts/AppContext';
import type { EmailJob } from '@/types/gmail';

export function useGmailSync() {
  const { addEmailJobs, setGmailState } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Core sync: fetch emails → AI parse → store */
  const runSync = useCallback(async (token: string): Promise<number> => {
    const rawEmails = await fetchJobEmails(token, 20);
    if (!rawEmails.length) return 0;

    const results = await Promise.allSettled(
      rawEmails.map(e => parseEmailJob(e.subject, e.from, e.body)),
    );

    const emailJobs: EmailJob[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.isJobRelated) {
        const p = r.value;
        const raw = rawEmails[i];
        emailJobs.push({
          id: raw.id,
          emailId: raw.id,
          subject: raw.subject,
          from: raw.from,
          receivedAt: raw.receivedAt,
          snippet: raw.snippet,
          title: p.title || raw.subject,
          company: p.company,
          location: p.location,
          workArrangement: p.workArrangement,
          salary: p.salary ?? undefined,
          applyUrl: p.applyUrl ?? undefined,
          dismissed: false,
          savedToTracker: false,
        });
      }
    });

    addEmailJobs(emailJobs);
    setGmailState({ lastSync: new Date().toISOString() });
    return emailJobs.length;
  }, [addEmailJobs, setGmailState]);

  /** Open Google popup, authenticate, then sync */
  const connectAndSync = useCallback(async (): Promise<number> => {
    setError(null);
    setSyncing(true);
    try {
      const token = await connectGmail();
      setGmailState({ connected: true });
      return await runSync(token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Gmail';
      setError(msg);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [runSync, setGmailState]);

  /** Sync using existing token; re-authenticates if expired */
  const syncNow = useCallback(async (): Promise<number> => {
    setError(null);
    const token = getToken();
    if (!token) return connectAndSync();

    setSyncing(true);
    try {
      return await runSync(token);
    } catch (err) {
      if (err instanceof Error && err.message === 'GMAIL_UNAUTHORIZED') {
        setSyncing(false);
        return connectAndSync();
      }
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setError(msg);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [runSync, connectAndSync]);

  const disconnect = useCallback(() => {
    disconnectGmail();
    setGmailState({ connected: false, lastSync: null });
  }, [setGmailState]);

  return {
    syncing,
    error,
    tokenValid: isGmailTokenValid(),
    connectAndSync,
    syncNow,
    disconnect,
  };
}
