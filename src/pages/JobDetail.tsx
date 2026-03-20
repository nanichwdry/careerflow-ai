import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Bookmark, SkipForward, FilePlus, Briefcase, ClipboardList, Loader2, MapPin, Building2, Calendar, DollarSign, ExternalLink, Sparkles, Target, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeJobFit, askAIAssistant } from '@/services/ai';
import { createActivityLog, createNotification } from '@/services/automation';
import type { Application } from '@/types';

const RECOMMENDATION_STYLES = {
  strong_match: { label: 'Strong Match', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  moderate_match: { label: 'Moderate Match', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
  weak_match: { label: 'Weak Match', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, savedJobs, jobAnalyses, masterResume, saveJob, addJobAnalysis, addApplication, addReviewItem, addActivityLog, addNotification } = useApp();
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const job = jobs.find(j => j.id === id);
  const analysis = jobAnalyses.find(a => a.jobId === id);
  const saved = savedJobs.find(s => s.jobId === id && s.status === 'saved');

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Job not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/jobs')}>Back to Jobs</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleAnalyze = async () => {
    if (!masterResume) { toast.error('Upload a master resume first'); return; }
    setAnalyzing(true);
    try {
      const result = await analyzeJobFit(job, masterResume.parsedData, user?.id || '');
      addJobAnalysis(result);
      if (user) addActivityLog(createActivityLog(user.id, 'job', job.id, 'jd_analyzed', 'success', 'ai', `Analyzed: ${job.title} — Fit: ${result.fitScore}%`));
      toast.success('Analysis complete');
    } catch { toast.error('Analysis failed'); }
    setAnalyzing(false);
  };

  const handleSave = () => {
    if (saved) { toast.info('Already saved'); return; }
    saveJob({ id: crypto.randomUUID(), jobId: job.id, userId: user?.id || '', savedAt: new Date().toISOString(), status: 'saved' });
    toast.success('Job saved');
  };

  const handleAddToApplications = () => {
    const app: Application = {
      id: crypto.randomUUID(), userId: user?.id || '', company: job.company, jobTitle: job.title,
      location: job.location, source: job.sourceId, jobDescription: job.description,
      applicationDate: '', status: 'draft', notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addApplication(app);
    if (user) addActivityLog(createActivityLog(user.id, 'application', app.id, 'application_created', 'success', 'user', `Created application for ${job.title} at ${job.company}`));
    toast.success('Added to applications');
    navigate(`/applications/${app.id}`);
  };

  const handleSendToReview = () => {
    addReviewItem({
      id: crypto.randomUUID(), userId: user?.id || '', jobId: job.id,
      reason: 'revisit_later', suggestedAction: 'Review job details and decide whether to apply',
      addedAt: new Date().toISOString(), status: 'pending',
    });
    if (user) {
      addActivityLog(createActivityLog(user.id, 'review', job.id, 'sent_to_review', 'info', 'user', `Sent to review: ${job.title}`));
      addNotification(createNotification(user.id, 'review_needed', 'Job sent to review', `${job.title} at ${job.company} needs your review`, 'job', job.id));
    }
    toast.success('Sent to review queue');
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const res = await askAIAssistant('job_detail', aiQuestion, { job, analysis });
      setAiResponse(res.message + (res.suggestions ? '\n\nSuggestions:\n' + res.suggestions.map(s => `• ${s}`).join('\n') : ''));
    } catch { setAiResponse('Unable to get response. Try again.'); }
    setAiLoading(false);
  };

  const recStyle = analysis ? RECOMMENDATION_STYLES[analysis.recommendation] : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
            <p className="text-muted-foreground">{job.company}</p>
          </div>
          {recStyle && (
            <Badge className={`${recStyle.class} border-0 gap-1`}>
              <recStyle.icon className="h-3.5 w-3.5" /> {recStyle.label}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Job Info */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" /> {job.company}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {job.location || 'Not specified'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> {new Date(job.postedDate).toLocaleDateString()}</div>
                  {job.salary?.min && <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4" /> ${(job.salary.min / 1000).toFixed(0)}k{job.salary.max ? `–$${(job.salary.max / 1000).toFixed(0)}k` : '+'}</div>}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="capitalize">{job.workArrangement}</Badge>
                  <Badge variant="outline" className="capitalize">{job.employmentType}</Badge>
                  <Badge variant="outline" className="capitalize">{job.experienceLevel}</Badge>
                  {job.easyApply && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">Easy Apply</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{job.description || 'No description provided.'}</p>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            {analysis ? (
              <div className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Analysis</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-foreground">{analysis.summary}</p>
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold ${analysis.fitScore >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : analysis.fitScore >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {analysis.fitScore}%
                      </div>
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-1"><Target className="h-4 w-4" /> Fit Score</p>
                        <p className="text-xs text-muted-foreground">{analysis.shouldApply === 'yes' ? 'Recommended to apply' : analysis.shouldApply === 'maybe' ? 'Consider applying' : 'May not be the best fit'}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Matching Skills</p>
                        <div className="flex flex-wrap gap-1">{analysis.matchingSkills.map(s => <Badge key={s} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-xs">{s}</Badge>)}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Missing Skills</p>
                        <div className="flex flex-wrap gap-1">{analysis.missingSkills.map(s => <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>)}</div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">ATS Keywords</p>
                      <div className="flex flex-wrap gap-1">{analysis.atsKeywords.map(k => <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>)}</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Cover Letter Angle</p>
                      <p className="text-sm text-muted-foreground">{analysis.suggestedCoverLetterAngle}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-border/50">
                <CardContent className="py-8 text-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">Run AI Analysis</p>
                  <p className="text-sm text-muted-foreground mt-1">Get fit score, skill matching, and recommendations</p>
                  <Button className="mt-4" onClick={handleAnalyze} disabled={analyzing || !masterResume}>
                    {analyzing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" /> Analyze Job</>}
                  </Button>
                  {!masterResume && <p className="text-xs text-muted-foreground mt-2">Upload a master resume first</p>}
                </CardContent>
              </Card>
            )}

            {/* AI Assistant */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Assistant</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Textarea value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} placeholder="Ask about fit score, next steps, interview prep..." rows={2} className="flex-1" />
                  <Button onClick={handleAskAI} disabled={aiLoading || !aiQuestion.trim()} className="self-end">
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
                  </Button>
                </div>
                {aiResponse && <div className="p-3 rounded-lg bg-muted text-sm text-foreground whitespace-pre-wrap">{aiResponse}</div>}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSave} disabled={!!saved}>
                  <Bookmark className={`h-4 w-4 ${saved ? 'fill-primary text-primary' : ''}`} /> {saved ? 'Saved' : 'Save Job'}
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate(`/tailored-resumes/new?jobId=${job.id}`)}>
                  <FilePlus className="h-4 w-4" /> Generate Tailored Resume
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleAddToApplications}>
                  <Briefcase className="h-4 w-4" /> Add to Applications
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSendToReview}>
                  <ClipboardList className="h-4 w-4" /> Send to Review Queue
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate(`/assisted-apply/${job.id}`)}>
                  <SkipForward className="h-4 w-4" /> Assisted Apply
                </Button>
                {job.sourceUrl && (
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => window.open(job.sourceUrl, '_blank')}>
                    <ExternalLink className="h-4 w-4" /> View Original
                  </Button>
                )}
              </CardContent>
            </Card>

            {job.skills && job.skills.length > 0 && (
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">{job.skills.map(s => <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>)}</div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50">
              <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
                <p>Source: {job.sourceId}</p>
                <p>Fetched: {new Date(job.fetchedAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
