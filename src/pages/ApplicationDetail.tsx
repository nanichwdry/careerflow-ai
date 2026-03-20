import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Globe, Calendar, FileText, Download, Trash2, Clock, Sparkles, Loader2, Plus } from 'lucide-react';
import { StatusBadge } from './Dashboard';
import { STATUS_LABELS } from '@/types';
import type { ApplicationStatus } from '@/types';
import { toast } from 'sonner';
import { useState } from 'react';
import { askAIAssistant } from '@/services/ai';
import { createActivityLog } from '@/services/automation';

const ALL_STATUSES: ApplicationStatus[] = ['draft', 'saved', 'applied', 'interview', 'rejected', 'offer', 'archived'];

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { applications, tailoredResumes, activityLogs, packets, reminders,
    updateApplication, deleteApplication, updateApplicationStatus, addReminder, updateReminder, addActivityLog } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const app = applications.find(a => a.id === id);
  const [notes, setNotes] = useState(app?.notes || '');
  const [aiQ, setAiQ] = useState('');
  const [aiRes, setAiRes] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderMsg, setReminderMsg] = useState('');

  if (!app) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Application not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/applications')}>Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const linkedResume = tailoredResumes.find(r => r.id === app.tailoredResumeId);
  const appLogs = activityLogs.filter(l => l.entityId === app.id || (l.entityType === 'application' && l.message.includes(app.company)));
  const appPackets = packets.filter(p => p.jobSnapshot.company === app.company && p.jobSnapshot.title === app.jobTitle);
  const appReminders = reminders.filter(r => r.applicationId === app.id);

  const handleStatusChange = (status: string) => {
    updateApplicationStatus(app.id, status as ApplicationStatus);
    if (user) addActivityLog(createActivityLog(user.id, 'application', app.id, 'status_changed', 'success', 'user', `Status → ${STATUS_LABELS[status as ApplicationStatus]}`));
    toast.success(`Status updated to ${STATUS_LABELS[status as ApplicationStatus]}`);
  };

  const handleSaveNotes = () => {
    updateApplication(app.id, { notes });
    toast.success('Notes saved');
  };

  const handleDelete = () => {
    deleteApplication(app.id);
    toast.success('Application deleted');
    navigate('/applications');
  };

  const handleAskAI = async () => {
    if (!aiQ.trim()) return;
    setAiLoading(true);
    try {
      const res = await askAIAssistant('application', aiQ, { app });
      setAiRes(res.message + (res.suggestions ? '\n\n' + res.suggestions.map(s => `• ${s}`).join('\n') : ''));
    } catch { setAiRes('Unable to respond.'); }
    setAiLoading(false);
  };

  const handleAddReminder = () => {
    if (!reminderDate || !reminderMsg.trim()) { toast.error('Date and message required'); return; }
    addReminder({
      id: crypto.randomUUID(), userId: user?.id || '', applicationId: app.id,
      dueDate: reminderDate, message: reminderMsg.trim(), completed: false, createdAt: new Date().toISOString(),
    });
    toast.success('Reminder added');
    setReminderDate('');
    setReminderMsg('');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{app.jobTitle}</h1>
            <p className="text-muted-foreground">{app.company}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {app.location || 'No location'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> {app.source || 'No source'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Applied: {app.applicationDate || 'Not yet'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Updated: {new Date(app.updatedAt).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>

            {app.jobDescription && (
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{app.jobDescription}</p></CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Timeline</CardTitle></CardHeader>
              <CardContent>
                {appLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity logged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {appLogs.slice(0, 15).map(log => (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${log.result === 'success' ? 'bg-emerald-500' : log.result === 'failure' ? 'bg-red-500' : log.result === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <div className="w-px flex-1 bg-border" />
                        </div>
                        <div className="pb-3">
                          <p className="text-sm font-medium text-foreground">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.message}</p>
                          <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Add notes..." />
                <Button size="sm" onClick={handleSaveNotes}>Save Notes</Button>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Assistant</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Textarea value={aiQ} onChange={e => setAiQ(e.target.value)} placeholder="Ask about next steps, follow-up, interview prep..." rows={2} className="flex-1" />
                  <Button onClick={handleAskAI} disabled={aiLoading} className="self-end">
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
                  </Button>
                </div>
                {aiRes && <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">{aiRes}</div>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
              <CardContent>
                <Select value={app.status} onValueChange={handleStatusChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Linked Resume</CardTitle></CardHeader>
              <CardContent>
                {linkedResume ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">{linkedResume.targetJobTitle}</p>
                      <p className="text-xs text-muted-foreground">ATS {linkedResume.atsScore}% • v{linkedResume.version}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/resume-preview/${linkedResume.id}`)}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toast.success('Export started')}><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No resume linked</p>
                )}
              </CardContent>
            </Card>

            {/* Packets */}
            {appPackets.length > 0 && (
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-base">Packets</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {appPackets.map(p => (
                    <div key={p.id} className="text-sm">
                      <Badge variant="outline" className="text-xs capitalize">{p.status}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(p.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Reminders */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Follow-Up Reminders</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {appReminders.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className={r.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>{r.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.dueDate).toLocaleDateString()}</p>
                    </div>
                    {!r.completed && <Button variant="ghost" size="sm" onClick={() => { updateReminder(r.id, { completed: true }); toast.success('Done'); }}>✓</Button>}
                  </div>
                ))}
                <Separator />
                <div className="space-y-2">
                  <Input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
                  <Input value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} placeholder="Reminder message..." />
                  <Button size="sm" className="w-full" onClick={handleAddReminder}><Plus className="h-3.5 w-3.5 mr-1" /> Add Reminder</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
                <p>Created: {new Date(app.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(app.updatedAt).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardContent className="pt-6">
                <Button variant="destructive" size="sm" className="w-full" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Application
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
