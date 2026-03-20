import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Check, X, ExternalLink, FilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const REASON_LABELS: Record<string, string> = {
  revisit_later: 'Revisit Later',
  unsupported_source: 'Unsupported Source',
  manual_portal: 'Manual Portal Required',
  needs_research: 'Needs Research',
  custom: 'Custom',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  dismissed: 'bg-muted text-muted-foreground',
};

export default function ReviewQueue() {
  const { reviewQueue, jobs, tailoredResumes, updateReviewItem } = useApp();
  const navigate = useNavigate();

  const pending = reviewQueue.filter(r => r.status === 'pending');
  const resolved = reviewQueue.filter(r => r.status !== 'pending');

  const getJob = (jobId: string) => jobs.find(j => j.id === jobId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Review Queue</h1>
          <p className="text-muted-foreground mt-1">{pending.length} pending review{pending.length !== 1 ? 's' : ''}</p>
        </div>

        {reviewQueue.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center py-16">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Review queue is empty</h3>
              <p className="text-muted-foreground text-center max-w-md">Jobs that need manual review will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-3">
                {pending.map(item => {
                  const job = getJob(item.jobId);
                  const resume = item.tailoredResumeId ? tailoredResumes.find(r => r.id === item.tailoredResumeId) : null;
                  return (
                    <Card key={item.id} className="border-border/50">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">{job?.title || 'Unknown Job'}</h3>
                              <Badge className={`${STATUS_STYLES[item.status]} border-0 text-xs`}>{item.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{job?.company || 'Unknown'} • {job?.location || 'N/A'}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm"><span className="font-medium text-foreground">Reason:</span> <span className="text-muted-foreground">{REASON_LABELS[item.reason] || item.reason}</span></p>
                              {item.customReason && <p className="text-sm text-muted-foreground">{item.customReason}</p>}
                              <p className="text-sm"><span className="font-medium text-foreground">Suggested:</span> <span className="text-muted-foreground">{item.suggestedAction}</span></p>
                              {resume && <p className="text-sm text-muted-foreground">Resume: {resume.targetJobTitle} (ATS {resume.atsScore}%)</p>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Added {new Date(item.addedAt).toLocaleString()}</p>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            {job && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${job.id}`)}>
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Job
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => navigate(`/tailored-resumes/new?jobId=${job.id}`)}>
                                  <FilePlus className="h-3.5 w-3.5 mr-1" /> Gen Resume
                                </Button>
                              </>
                            )}
                            <Button size="sm" onClick={() => { updateReviewItem(item.id, { status: 'completed' }); toast.success('Marked complete'); }}>
                              <Check className="h-3.5 w-3.5 mr-1" /> Complete
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { updateReviewItem(item.id, { status: 'dismissed' }); toast.success('Dismissed'); }}>
                              <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {resolved.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-muted-foreground">Resolved ({resolved.length})</h2>
                {resolved.slice(0, 10).map(item => {
                  const job = getJob(item.jobId);
                  return (
                    <Card key={item.id} className="border-border/50 opacity-60">
                      <CardContent className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{job?.title || 'Unknown'} — {job?.company || ''}</p>
                          <p className="text-xs text-muted-foreground">{REASON_LABELS[item.reason]} • {item.status}</p>
                        </div>
                        <Badge className={`${STATUS_STYLES[item.status]} border-0 text-xs`}>{item.status}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
