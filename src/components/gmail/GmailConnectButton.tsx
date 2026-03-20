import { Mail, RefreshCw, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useGmailSync } from '@/hooks/useGmailSync';
import { toast } from 'sonner';

interface Props {
  onSynced?: (count: number) => void;
}

export function GmailConnectButton({ onSynced }: Props) {
  const { gmail } = useApp();
  const { syncing, tokenValid, connectAndSync, syncNow, disconnect } = useGmailSync();

  const handleConnect = async () => {
    try {
      const count = await connectAndSync();
      toast.success(`Gmail connected! Found ${count} job email${count !== 1 ? 's' : ''}.`);
      onSynced?.(count);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect Gmail');
    }
  };

  const handleSync = async () => {
    try {
      const count = await syncNow();
      toast.success(`Synced! Found ${count} new job email${count !== 1 ? 's' : ''}.`);
      onSynced?.(count);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success('Gmail disconnected');
  };

  if (!gmail.connected) {
    return (
      <Button onClick={handleConnect} disabled={syncing} className="gap-2">
        {syncing
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Mail className="h-4 w-4" />}
        {syncing ? 'Connecting…' : 'Connect Gmail'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!tokenValid && (
        <span className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" /> Session expired
        </span>
      )}
      {gmail.lastSync && (
        <span className="text-xs text-muted-foreground">
          Synced {new Date(gmail.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-1.5">
        {syncing
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <RefreshCw className="h-3.5 w-3.5" />}
        {syncing ? 'Syncing…' : tokenValid ? 'Sync Now' : 'Re-authenticate'}
      </Button>
      <Button
        variant="ghost" size="sm" onClick={handleDisconnect} disabled={syncing}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" /> Disconnect
      </Button>
    </div>
  );
}
