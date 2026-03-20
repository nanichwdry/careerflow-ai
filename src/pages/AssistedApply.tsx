import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Target, FileText, Mail, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeJobFit, generateCoverLetter } from '@/services/ai';
import { checkDuplicate, buildApplicationPacket, createActivityLog, createNotification } from '@/services/automation';
import type { CoverLetterStyle } from '@/types/jobs';
import type { Application } from '@/types';

const STEPS = ['Review Job', 'Analysis', 'Resume & Cover Letter', 'Review Packet', 'Confirm'];

export default function AssistedApply() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, jobAnalyses, masterResume, tailoredResumes, applications, coverLetters,
    addJobAnalysis, addCoverLetter, addPacket, addApplication, addActivityLog, addNotification } = useApp();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [genCL, setGenCL] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [clStyle, setClStyle] = useState<CoverLetterStyle>('standard');
  const [notes, setNotes] = useState('');

  const job = jobs.find(j => j.id === id);
  const analysis = jobAnalyses.find(a => a.jobId === id);
  const dupCheck = job ? checkDuplicate(job, applications) : { isDuplicate: false };
  const jobCoverLetter = coverLetters.find(c => c.jobId === id);

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Job not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/jobs')}>Back</Button>
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
      toast.success('Analysis complete');
    } catch { toast.error('Analysis failed'); }
    setAnalyzing(false);
  };

  const handleGenCoverLetter = async () => {
    if (!masterResume) return;
    setGenCL(true);
    try {
      const cl = await generateCoverLetter(job, masterResume.parsedData, clStyle, user?.id || '', selectedResumeId || undefined);
      addCoverLetter(cl);
      if (user) addActivityLog(createActivityLog(user.id, 'cover_letter', cl.id, 'cover_letter_generated', 'success', 'ai', `Cover letter for ${job.title} at ${job.company}`));
      toast.success('Cover letter generated');
    } catch { toast.error('Generation failed'); }
    setGenCL(false);
  };

  const handleConfirm = () => {
    const packet = buildApplicationPacket(job, user?.id || '', {
      fullName: profile?.fullName || '', email: profile?.email || '',
      phone: profile?.phone || '', location: profile?.location || '',
      linkedIn: profile?.linkedIn, website: profile?.website,
    }, {
      tailoredResumeId: selectedResumeId || undefined,
      coverLetterId: jobCoverLetter?.id,
      notes,
      duplicateCheck: dupCheck.isDuplicate ? 'warning' : 'passed',
      sourceSupported: false, // Manual flow — not auto-submitted
    });
    packet.status = 'ready';
    packet.complianceFlags.userApproved = true;
    addPacket(packet);

    const app: Application = {
      id: crypto.randomUUID(), userId: user?.id || '', company: job.company, jobTitle: job.title,
      location: job.location, source: job.sourceId, jobDescription: job.description,
      applicationDate: new Date().toISOString().split('T')[0], status: 'applied',
      tailoredResumeId: selectedResumeId || undefined, notes,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addApplication(app);

    if (user) {
      addActivityLog(createActivityLog(user.id, 'packet', packet.id, 'packet_ready', 'success', 'assisted_apply', `Application packet ready for ${job.title}`));
      addActivityLog(createActivityLog(user.id, 'application', app.id, 'application_created', 'success', 'assisted_apply', `Marked as applied: ${job.title} at ${job.company}`));
      addNotification(createNotification(user.id, 'app_submitted', 'Application Ready', `Your application for ${job.title} at ${job.company} is ready.`, 'application', app.id));
    }

    toast.success('Application marked as ready!');
    navigate(`/applications/${app.id}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/jobs/${job.id}`)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assisted Apply</h1>
            <p className="text-muted-foreground">{job.title} at {job.company}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center">
              <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
              <span className={`text-xs mt-1 ${i <= step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{s}</span>
            </div>
          ))}
        </div>

        {dupCheck.isDuplicate && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-400">Duplicate Detected</p>
                <p className="text-sm text-amber-700 dark:text-amber-500">You already have an application for {dupCheck.existingApp?.jobTitle} at {dupCheck.existingApp?.company}.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 0: Review Job */}
        {step === 0 && (
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base">Job Overview</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><span className="font-medium">Title:</span> {job.title}</p>
              <p className="text-sm"><span className="font-medium">Company:</span> {job.company}</p>
              <p className="text-sm"><span className="font-medium">Location:</span> {job.location || 'Not specified'}</p>
              <p className="text-sm"><span className="font-medium">Type:</span> {job.employmentType} • {job.workArrangement}</p>
              {job.description && <p className="text-sm text-muted-foreground line-clamp-6">{job.description}</p>}
            </CardContent>
          </Card>
        )}

        {/* Step 1: Analysis */}
        {step === 1 && (
          analysis ? (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Analysis Results</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold ${analysis.fitScore >= 75 ? 'bg-emerald-100 text-emerald-700' : analysis.fitScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{analysis.fitScore}%</div>
                  <div>
                    <p className="font-medium">{analysis.recommendation.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">{analysis.shouldApply === 'yes' ? 'Recommended' : analysis.shouldApply === 'maybe' ? 'Consider' : 'May skip'}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.matchingSkills.map(s => <Badge key={s} className="bg-emerald-100 text-emerald-700 border-0 text-xs">{s}</Badge>)}
                  {analysis.missingSkills.map(s => <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>)}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-8 text-center">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Run analysis to see fit score</p>
                <Button className="mt-3" onClick={handleAnalyze} disabled={analyzing || !masterResume}>
                  {analyzing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" /> Analyze</>}
                </Button>
              </CardContent>
            </Card>
          )
        )}

        {/* Step 2: Resume & Cover Letter */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Select Resume</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {tailoredResumes.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No tailored resumes yet.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate(`/tailored-resumes/new?jobId=${job.id}`)}>Generate One</Button>
                  </div>
                ) : (
                  <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                    <SelectTrigger><SelectValue placeholder="Select a tailored resume" /></SelectTrigger>
                    <SelectContent>
                      {tailoredResumes.map(r => <SelectItem key={r.id} value={r.id}>{r.targetJobTitle} (ATS {r.atsScore}%)</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Cover Letter</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {jobCoverLetter ? (
                  <div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 mb-2">Generated</Badge>
                    <p className="text-sm text-muted-foreground line-clamp-4">{jobCoverLetter.content}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Select value={clStyle} onValueChange={v => setClStyle(v as CoverLetterStyle)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="confident">Confident</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleGenCoverLetter} disabled={genCL || !masterResume}>
                      {genCL ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Cover Letter</>}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Review Packet */}
        {step === 3 && (
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base">Application Packet Review</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Job:</span> {job.title}</div>
                <div><span className="font-medium">Company:</span> {job.company}</div>
                <div><span className="font-medium">Resume:</span> {selectedResumeId ? tailoredResumes.find(r => r.id === selectedResumeId)?.targetJobTitle || 'Selected' : 'None'}</div>
                <div><span className="font-medium">Cover Letter:</span> {jobCoverLetter ? 'Generated' : 'None'}</div>
                <div><span className="font-medium">Duplicate:</span> {dupCheck.isDuplicate ? '⚠️ Warning' : '✓ Clear'}</div>
                <div><span className="font-medium">Fit Score:</span> {analysis ? `${analysis.fitScore}%` : 'Not analyzed'}</div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any notes for this application..." />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">Ready to Mark as Applied</h3>
              <p className="text-sm text-muted-foreground">Your application packet is prepared. Click confirm to save everything and mark this application.</p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" /> Compliant workflow — no automated portal submission
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleConfirm}>
              <Check className="h-4 w-4 mr-1" /> Confirm & Save
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
