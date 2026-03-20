import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkX, Trash2, FilePlus, Briefcase, ExternalLink, MapPin, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Application } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function SavedJobs() {
  const { jobs, savedJobs, updateSavedJob, removeSavedJob, addApplication } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const activeSaved = savedJobs.filter(s => s.status === 'saved');
  const notInterested = savedJobs.filter(s => s.status === 'not_interested');

  const getJob = (jobId: string) => jobs.find(j => j.id === jobId);

  const handleNotInterested = (id: string) => {
    updateSavedJob(id, { status: 'not_interested' });
    toast.success('Marked as not interested');
  };

  const handleRestore = (id: string) => {
    updateSavedJob(id, { status: 'saved' });
    toast.success('Restored to saved');
  };

  const handleCreateApp = (savedJob: typeof savedJobs[0]) => {
    const job = getJob(savedJob.jobId);
    if (!job) return;
    const app: Application = {
      id: crypto.randomUUID(), userId: user?.id || '', company: job.company, jobTitle: job.title,
      location: job.location, source: job.sourceId, jobDescription: job.description,
      applicationDate: '', status: 'draft', notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addApplication(app);
    updateSavedJob(savedJob.id, { applicationId: app.id });
    toast.success('Application created');
    navigate(`/applications/${app.id}`);
  };

  const renderJobCard = (s: typeof savedJobs[0], showRestore = false) => {
    const job = getJob(s.jobId);
    if (!job) return null;
    return (
      <Card key={s.id} className="border-border/50 hover:shadow-sm transition-shadow">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
              <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {job.company}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location || 'N/A'}</span>
                <Badge variant="outline" className="text-xs capitalize">{job.workArrangement}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Saved {new Date(s.savedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {showRestore ? (
                <Button variant="ghost" size="sm" onClick={() => handleRestore(s.id)}><Bookmark className="h-4 w-4 mr-1" /> Restore</Button>
              ) : (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/tailored-resumes/new?jobId=${job.id}`)} title="Generate Resume">
                    <FilePlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCreateApp(s)} title="Create Application">
                    <Briefcase className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleNotInterested(s.id)} title="Not Interested">
                    <BookmarkX className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { removeSavedJob(s.id); toast.success('Removed'); }} title="Remove">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Saved Jobs</h1>
          <p className="text-muted-foreground mt-1">{activeSaved.length} saved • {notInterested.length} dismissed</p>
        </div>

        {activeSaved.length === 0 && notInterested.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center py-16">
              <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No saved jobs</h3>
              <p className="text-muted-foreground text-center max-w-md">Save jobs from the Job Search page to track them here.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/jobs')}>Browse Jobs</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeSaved.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Saved ({activeSaved.length})</h2>
                {activeSaved.map(s => renderJobCard(s))}
              </div>
            )}
            {notInterested.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-muted-foreground">Not Interested ({notInterested.length})</h2>
                {notInterested.map(s => renderJobCard(s, true))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
