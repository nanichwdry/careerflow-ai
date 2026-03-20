import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Plus, Filter, MapPin, Building2, Bookmark, ExternalLink, Briefcase, DollarSign, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Job, JobSearchFilters, ExperienceLevel } from '@/types/jobs';
import { createActivityLog } from '@/services/automation';
import { searchAdzunaJobs } from '@/services/adzuna';
import { useAuth } from '@/contexts/AuthContext';

const EXP_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'entry', label: 'Entry' }, { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' }, { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

export default function JobSearch() {
  const { jobs, savedJobs, addJobs, addJob, saveJob, addActivityLog } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<JobSearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const [form, setForm] = useState({
    title: '', company: '', location: '', description: '', sourceUrl: '',
    workArrangement: 'onsite' as Job['workArrangement'],
    employmentType: 'full-time' as Job['employmentType'],
    experienceLevel: 'mid' as Job['experienceLevel'],
    easyApply: false, salaryMin: '', salaryMax: '', industry: '', skills: '',
  });

  // Client-side filter over already-fetched jobs
  const filtered = jobs.filter(j => {
    if (filters.keyword && !`${j.title} ${j.company} ${j.description}`.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.jobTitle && !j.title.toLowerCase().includes(filters.jobTitle.toLowerCase())) return false;
    if (filters.location && !j.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.remoteOnly && j.workArrangement !== 'remote') return false;
    if (filters.easyApplyOnly && !j.easyApply) return false;
    if (filters.company && !j.company.toLowerCase().includes(filters.company.toLowerCase())) return false;
    if (filters.industry && j.industry && !j.industry.toLowerCase().includes(filters.industry.toLowerCase())) return false;
    if (filters.experienceLevel?.length && !filters.experienceLevel.includes(j.experienceLevel)) return false;
    if (filters.salaryMin && j.salary?.min && j.salary.min < filters.salaryMin) return false;
    if (filters.excludeCompanies?.some(c => j.company.toLowerCase().includes(c.toLowerCase()))) return false;
    if (filters.excludeKeywords?.some(k => j.description.toLowerCase().includes(k.toLowerCase()))) return false;
    return true;
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) { toast.error('Enter a search query'); return; }
    setSearching(true);
    setHasSearched(true);
    try {
      const { jobs: results, total } = await searchAdzunaJobs(searchQuery.trim(), {
        location: filters.location,
        remoteOnly: filters.remoteOnly,
        salaryMin: filters.salaryMin,
      });
      addJobs(results);
      if (user) addActivityLog(createActivityLog(user.id, 'job', '', 'job_search', 'success', 'adzuna', `Searched "${searchQuery}" — ${results.length} of ${total} results`));
      toast.success(`Found ${results.length} jobs`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    }
    setSearching(false);
  };

  const handleAddJob = () => {
    if (!form.title.trim() || !form.company.trim()) { toast.error('Title and company are required'); return; }
    const job: Job = {
      id: crypto.randomUUID(), sourceId: 'manual-entry', sourceJobId: crypto.randomUUID(),
      sourceUrl: form.sourceUrl.trim(), title: form.title.trim(), company: form.company.trim(),
      location: form.location.trim(), workArrangement: form.workArrangement,
      salary: form.salaryMin || form.salaryMax ? { min: form.salaryMin ? parseInt(form.salaryMin) : undefined, max: form.salaryMax ? parseInt(form.salaryMax) : undefined, currency: 'USD', period: 'yearly' } : undefined,
      postedDate: new Date().toISOString(), employmentType: form.employmentType,
      experienceLevel: form.experienceLevel, description: form.description.trim(),
      applyMethod: 'external', easyApply: form.easyApply,
      industry: form.industry.trim() || undefined,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      fetchedAt: new Date().toISOString(),
    };
    addJob(job);
    if (user) addActivityLog(createActivityLog(user.id, 'job', job.id, 'job_added', 'success', 'manual', `Added: ${job.title} at ${job.company}`));
    toast.success('Job added');
    setAddOpen(false);
    setForm({ title: '', company: '', location: '', description: '', sourceUrl: '', workArrangement: 'onsite', employmentType: 'full-time', experienceLevel: 'mid', easyApply: false, salaryMin: '', salaryMax: '', industry: '', skills: '' });
  };

  const handleSave = (job: Job) => {
    if (savedJobs.find(s => s.jobId === job.id)) { toast.info('Already saved'); return; }
    saveJob({ id: crypto.randomUUID(), jobId: job.id, userId: user?.id || '', savedAt: new Date().toISOString(), status: 'saved' });
    if (user) addActivityLog(createActivityLog(user.id, 'job', job.id, 'job_saved', 'success', 'user', `Saved: ${job.title}`));
    toast.success('Job saved');
  };

  const isSaved = (jobId: string) => savedJobs.some(s => s.jobId === jobId && s.status === 'saved');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Search</h1>
            <p className="text-muted-foreground mt-1">Search real jobs via Adzuna or add manually</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Add Manually</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Job Manually</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Senior SWE" /></div>
                  <div className="space-y-2"><Label>Company *</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Inc" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="San Francisco, CA" /></div>
                  <div className="space-y-2">
                    <Label>Work Type</Label>
                    <Select value={form.workArrangement} onValueChange={v => setForm(f => ({ ...f, workArrangement: v as Job['workArrangement'] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="remote">Remote</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem><SelectItem value="onsite">Onsite</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employment</Label>
                    <Select value={form.employmentType} onValueChange={v => setForm(f => ({ ...f, employmentType: v as Job['employmentType'] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="full-time">Full-time</SelectItem><SelectItem value="part-time">Part-time</SelectItem><SelectItem value="contract">Contract</SelectItem><SelectItem value="internship">Internship</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <Select value={form.experienceLevel} onValueChange={v => setForm(f => ({ ...f, experienceLevel: v as Job['experienceLevel'] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EXP_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Min Salary</Label><Input type="number" value={form.salaryMin} onChange={e => setForm(f => ({ ...f, salaryMin: e.target.value }))} placeholder="120000" /></div>
                  <div className="space-y-2"><Label>Max Salary</Label><Input type="number" value={form.salaryMax} onChange={e => setForm(f => ({ ...f, salaryMax: e.target.value }))} placeholder="180000" /></div>
                </div>
                <div className="space-y-2"><Label>Source URL</Label><Input value={form.sourceUrl} onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))} placeholder="https://..." /></div>
                <div className="space-y-2"><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="FinTech" /></div>
                <div className="space-y-2"><Label>Skills (comma-separated)</Label><Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, TypeScript, AWS" /></div>
                <div className="space-y-2"><Label>Job Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={6} placeholder="Paste the full JD..." /></div>
                <div className="flex items-center gap-2"><Checkbox checked={form.easyApply} onCheckedChange={c => setForm(f => ({ ...f, easyApply: !!c }))} /><Label>Easy Apply</Label></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAddJob}>Add Job</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search jobs... e.g. React developer, backend engineer, data scientist"
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {searching ? 'Searching...' : 'Search'}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filters</Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2"><Label>Filter by keyword</Label><Input value={filters.keyword || ''} onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))} placeholder="Filter results..." /></div>
                <div className="space-y-2"><Label>Job Title</Label><Input value={filters.jobTitle || ''} onChange={e => setFilters(f => ({ ...f, jobTitle: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={filters.location || ''} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Company</Label><Input value={filters.company || ''} onChange={e => setFilters(f => ({ ...f, company: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Industry</Label><Input value={filters.industry || ''} onChange={e => setFilters(f => ({ ...f, industry: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Min Salary</Label><Input type="number" value={filters.salaryMin || ''} onChange={e => setFilters(f => ({ ...f, salaryMin: e.target.value ? parseInt(e.target.value) : undefined }))} /></div>
                <div className="flex items-center gap-2"><Checkbox checked={filters.remoteOnly || false} onCheckedChange={c => setFilters(f => ({ ...f, remoteOnly: !!c }))} /><Label>Remote only</Label></div>
                <div className="flex items-center gap-2"><Checkbox checked={filters.easyApplyOnly || false} onCheckedChange={c => setFilters(f => ({ ...f, easyApplyOnly: !!c }))} /><Label>Easy Apply only</Label></div>
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <div className="space-y-1">
                    {EXP_LEVELS.map(l => (
                      <div key={l.value} className="flex items-center gap-2">
                        <Checkbox checked={filters.experienceLevel?.includes(l.value) || false} onCheckedChange={c => {
                          setFilters(f => {
                            const current = f.experienceLevel || [];
                            return { ...f, experienceLevel: c ? [...current, l.value] : current.filter(v => v !== l.value) };
                          });
                        }} />
                        <Label className="font-normal">{l.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setFilters({})}>Clear Filters</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Results */}
        {searching ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center py-16">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Searching for jobs...</h3>
              <p className="text-muted-foreground mt-1">Finding real jobs for "{searchQuery}"</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center py-16">
              {!hasSearched ? (
                <>
                  <Sparkles className="h-12 w-12 text-primary/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Search for jobs</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Type a role, skill, or keyword above and hit Search to find real job listings.
                  </p>
                </>
              ) : (
                <>
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {jobs.length === 0 ? 'No results found' : 'No matching jobs'}
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {jobs.length === 0 ? 'Try a different search query.' : 'Try adjusting your filters.'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{filtered.length} job{filtered.length !== 1 ? 's' : ''} found</p>
            {filtered.map(job => (
              <Card key={job.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                        {job.easyApply && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-xs">Easy Apply</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location || 'Not specified'}</span>
                        <Badge variant="outline" className="text-xs capitalize">{job.workArrangement}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{job.experienceLevel}</Badge>
                        {job.salary?.min && <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {(job.salary.min / 1000).toFixed(0)}k{job.salary.max ? `–${(job.salary.max / 1000).toFixed(0)}k` : '+'}</span>}
                      </div>
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills.slice(0, 5).map(s => <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>)}
                          {job.skills.length > 5 && <Badge variant="secondary" className="text-xs font-normal">+{job.skills.length - 5}</Badge>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSave(job)} disabled={isSaved(job.id)}>
                        <Bookmark className={`h-4 w-4 ${isSaved(job.id) ? 'fill-primary text-primary' : ''}`} />
                      </Button>
                      {job.sourceUrl && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(job.sourceUrl, '_blank')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
