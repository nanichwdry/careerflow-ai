import { Mail, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { GmailConnectButton } from './GmailConnectButton';
import { EmailJobCard } from './EmailJobCard';

const MAX_VISIBLE = 6;

export function EmailJobsSection() {
  const { emailJobs, gmail } = useApp();

  const visible = emailJobs.filter(j => !j.dismissed);
  const shown = visible.slice(0, MAX_VISIBLE);
  const hiddenCount = Math.max(0, visible.length - MAX_VISIBLE);

  // Not connected — show connect prompt
  if (!gmail.connected) {
    return (
      <Card className="border-border/50 border-dashed">
        <CardContent className="pt-6 pb-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold text-foreground">Import jobs from Gmail</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Connect your Gmail to automatically pull job postings from your Promotions inbox.
            </p>
          </div>
          <GmailConnectButton />
        </CardContent>
      </Card>
    );
  }

  // Connected — show jobs or empty state
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            Jobs from Gmail
            {visible.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({visible.length})
              </span>
            )}
          </CardTitle>
          <GmailConnectButton />
        </div>
      </CardHeader>
      <CardContent>
        {shown.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No job emails found in the last 30 days.</p>
            <p className="text-xs mt-1 opacity-70">
              Try syncing again or check your Gmail Promotions tab.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shown.map(job => (
                <EmailJobCard key={job.id} job={job} />
              ))}
            </div>
            {hiddenCount > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                +{hiddenCount} more dismissed or saved
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
