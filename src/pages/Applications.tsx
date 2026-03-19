import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Briefcase, Plus, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './Dashboard';
import type { Application, ApplicationStatus } from '@/types';
import { STATUS_LABELS } from '@/types';
import { toast } from 'sonner';

const ALL_STATUSES: ApplicationStatus[] = ['draft', 'saved', 'applied', 'interview', 'rejected', 'offer', 'archived'];

export default function Applications() {
  const { applications, addApplication, tailoredResumes } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);

  // New application form state
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('draft');
  const [tailoredResumeId, setTailoredResumeId] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = applications.filter(a => {
    const matchesSearch = a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    if (!company.trim() || !jobTitle.trim()) {
      toast.error('Company and job title are required');
      return;
    }
    const app: Application = {
      id: crypto.randomUUID(),
      userId: 'current',
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      location: location.trim(),
      source: source.trim(),
      jobDescription,
      applicationDate: status === 'applied' ? new Date().toISOString().split('T')[0] : '',
      status,
      tailoredResumeId: tailoredResumeId || undefined,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addApplication(app);
    toast.success('Application created');
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCompany(''); setJobTitle(''); setLocation(''); setSource(''); setJobDescription(''); setStatus('draft'); setTailoredResumeId(''); setNotes('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground mt-1">Track and manage your job applications</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Application</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Application</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Company *</Label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Google" /></div>
                  <div className="space-y-2"><Label>Job Title *</Label><Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Senior SWE" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="San Francisco" /></div>
                  <div className="space-y-2"><Label>Source</Label><Input value={source} onChange={e => setSource(e.target.value)} placeholder="LinkedIn" /></div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={v => setStatus(v as ApplicationStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Linked Resume</Label>
                  <Select value={tailoredResumeId} onValueChange={setTailoredResumeId}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {tailoredResumes.map(r => <SelectItem key={r.id} value={r.id}>{r.targetJobTitle}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Job Description</Label><Textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={4} placeholder="Paste JD..." /></div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any notes..." /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create Application</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or title..." className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center py-16">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {applications.length === 0 ? 'No applications yet' : 'No matching applications'}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {applications.length === 0 ? 'Start tracking your job applications to stay organized.' : 'Try adjusting your search or filter criteria.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => (
              <Card key={app.id} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/applications/${app.id}`)}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{app.jobTitle}</p>
                      <p className="text-sm text-muted-foreground">{app.company} • {app.location || 'No location'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">{app.source || '—'}</span>
                    <StatusBadge status={app.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
