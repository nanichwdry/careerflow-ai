import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Globe, Calendar, FileText, Download, Trash2 } from 'lucide-react';
import { StatusBadge } from './Dashboard';
import { STATUS_LABELS } from '@/types';
import type { ApplicationStatus } from '@/types';
import { toast } from 'sonner';
import { useState } from 'react';

const ALL_STATUSES: ApplicationStatus[] = ['draft', 'saved', 'applied', 'interview', 'rejected', 'offer', 'archived'];

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { applications, tailoredResumes, updateApplication, deleteApplication, updateApplicationStatus } = useApp();
  const navigate = useNavigate();

  const app = applications.find(a => a.id === id);
  const [notes, setNotes] = useState(app?.notes || '');

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

  const handleStatusChange = (status: string) => {
    updateApplicationStatus(app.id, status as ApplicationStatus);
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{app.jobTitle}</h1>
            <p className="text-muted-foreground">{app.company}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Application Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {app.location || 'No location'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> {app.source || 'No source'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Applied: {app.applicationDate || 'Not yet'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Updated: {new Date(app.updatedAt).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            {app.jobDescription && (
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{app.jobDescription}</p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Add notes about this application..." />
                <Button size="sm" onClick={handleSaveNotes}>Save Notes</Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
              <CardContent>
                <Select value={app.status} onValueChange={handleStatusChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Linked Resume */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Linked Resume</CardTitle></CardHeader>
              <CardContent>
                {linkedResume ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">{linkedResume.targetJobTitle}</p>
                      <p className="text-xs text-muted-foreground">ATS Score: {linkedResume.atsScore}% • v{linkedResume.version}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/resume-preview/${linkedResume.id}`)}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toast.success('PDF export started')}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No resume linked</p>
                )}
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card className="border-border/50">
              <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
                <p>Created: {new Date(app.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(app.updatedAt).toLocaleString()}</p>
              </CardContent>
            </Card>

            {/* Danger zone */}
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
