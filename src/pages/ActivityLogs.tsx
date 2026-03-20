import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Activity } from 'lucide-react';

const RESULT_STYLES: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failure: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function ActivityLogs() {
  const { activityLogs } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');

  const filtered = activityLogs.filter(l => {
    if (search && !`${l.action} ${l.message} ${l.source}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && l.entityType !== typeFilter) return false;
    if (resultFilter !== 'all' && l.result !== resultFilter) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">{activityLogs.length} total events</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {['job', 'application', 'resume', 'cover_letter', 'packet', 'automation', 'notification', 'review'].map(t => (
                <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              {['success', 'failure', 'warning', 'info'].map(r => (
                <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center py-16">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No activity logs</h3>
              <p className="text-muted-foreground text-center max-w-md">Actions you take will be logged here for full transparency.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-sm font-medium">{log.action}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{log.entityType.replace('_', ' ')}</Badge></TableCell>
                      <TableCell><Badge className={`${RESULT_STYLES[log.result]} border-0 text-xs`}>{log.result}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.source}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">{log.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
