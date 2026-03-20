import { MapPin, ExternalLink, Bookmark, X, DollarSign, Building2, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import type { EmailJob } from '@/types/gmail';
import type { Job } from '@/types/jobs';
import { toast } from 'sonner';

const arrangementColors: Record<EmailJob['workArrangement'], string> = {
  remote: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  hybrid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  onsite: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  unknown: 'bg-muted text-muted-foreground',
};

const arrangementLabel: Record<EmailJob['workArrangement'], string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  unknown: 'On-site',
};

interface Props {
  job: EmailJob;
}

export function EmailJobCard({ job }: Props) {
  const { addJob, markEmailJobSaved, dismissEmailJob } = useApp();

  const handleSave = () => {
    const trackerJob: Job = {
      id: crypto.randomUUID(),
      sourceId: 'gmail',
      sourceJobId: job.emailId,
      sourceUrl: job.applyUrl ?? '',
      title: job.title || job.subject,
      company: job.company || 'Unknown',
      location: job.location || 'Not specified',
      workArrangement: job.workArrangement === 'unknown' ? 'onsite' : job.workArrangement,
      postedDate: job.receivedAt,
      employmentType: 'full-time',
      experienceLevel: 'mid',
      description: job.snippet,
      applyMethod: job.applyUrl ? 'external' : 'portal',
      easyApply: false,
      fetchedAt: new Date().toISOString(),
    };
    addJob(trackerJob);
    markEmailJobSaved(job.id);
    toast.success('Saved to Job Tracker');
  };

  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate text-sm leading-snug">
              {job.title || job.subject}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{job.company || 'Unknown Company'}</span>
            </div>
          </div>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground -mt-0.5"
            onClick={() => dismissEmailJob(job.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <Badge className={`${arrangementColors[job.workArrangement]} border-0 text-xs font-medium`}>
            {arrangementLabel[job.workArrangement]}
          </Badge>
          {job.location && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {job.location}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" /> {job.salary}
            </span>
          )}
        </div>

        {/* Snippet */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{job.snippet}</p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {job.savedToTracker ? (
            <Badge variant="secondary" className="text-xs gap-1 font-normal">
              <Check className="h-3 w-3" /> Saved
            </Badge>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleSave}>
              <Bookmark className="h-3 w-3" /> Save
            </Button>
          )}
          {job.applyUrl && (
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                <ExternalLink className="h-3 w-3" /> Apply
              </Button>
            </a>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(job.receivedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
