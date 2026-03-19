import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Target, Lightbulb, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { analyzeJobDescription, generateTailoredResume } from '@/services/ai';
import type { TailoredResume } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function TailoredResumeBuilder() {
  const { masterResume, templates, addTailoredResume } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<'input' | 'analyzing' | 'result'>('input');
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<TailoredResume | null>(null);

  const handleGenerate = async () => {
    if (!masterResume || !targetJobTitle.trim() || !jobDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setStep('analyzing');
    try {
      const analysis = await analyzeJobDescription(jobDescription);
      const { tailoredData, atsScore, suggestions } = await generateTailoredResume(masterResume.parsedData, jobDescription, analysis);
      const resume: TailoredResume = {
        id: crypto.randomUUID(),
        userId: masterResume.userId,
        masterResumeId: masterResume.id,
        templateId,
        targetJobTitle: targetJobTitle.trim(),
        jobDescription,
        jdSummary: analysis.summary,
        jdKeywords: analysis.keywords,
        atsScore,
        suggestions,
        parsedData: tailoredData,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setResult(resume);
      setStep('result');
    } catch {
      toast.error('Generation failed. Please try again.');
      setStep('input');
    }
  };

  const handleSave = () => {
    if (result) {
      addTailoredResume(result);
      toast.success('Tailored resume saved!');
      navigate(`/resume-preview/${result.id}`);
    }
  };

  if (!masterResume) {
    return (
      <DashboardLayout>
        <Card className="max-w-lg mx-auto mt-20 border-border/50">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">Master resume required</p>
            <p className="text-muted-foreground mt-1">Upload your master resume before creating tailored versions.</p>
            <Button className="mt-4" onClick={() => navigate('/master-resume')}>Upload Master Resume</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Tailored Resume</h1>
          <p className="text-muted-foreground mt-1">Generate an ATS-optimized resume for a specific role</p>
        </div>

        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
          <CardContent className="pt-6 flex items-start gap-3 text-sm">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">AI-Powered, Truthful Tailoring</p>
              <p className="text-muted-foreground mt-1">
                Content is derived exclusively from your master resume. No experience is fabricated and no false claims are added. The AI reorders, refines, and optimizes phrasing for ATS compatibility.
              </p>
            </div>
          </CardContent>
        </Card>

        {step === 'input' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Provide the role details and job description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Resume Template</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name} — {t.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Job Title</Label>
                <Input value={targetJobTitle} onChange={e => setTargetJobTitle(e.target.value)} placeholder="e.g., Senior Software Engineer" />
              </div>
              <div className="space-y-2">
                <Label>Job Description</Label>
                <Textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." rows={10} />
              </div>
              <Button onClick={handleGenerate} size="lg" className="w-full" disabled={!targetJobTitle.trim() || !jobDescription.trim()}>
                <Sparkles className="h-4 w-4 mr-2" /> Generate Tailored Resume
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'analyzing' && (
          <Card className="border-border/50">
            <CardContent className="py-16 flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Analyzing & Generating</h3>
              <p className="text-muted-foreground mt-1">Extracting keywords, matching skills, optimizing content...</p>
            </CardContent>
          </Card>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            {/* Score & Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold ${result.atsScore >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : result.atsScore >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {result.atsScore}%
                  </div>
                  <div>
                    <p className="font-semibold text-foreground flex items-center gap-1"><Target className="h-4 w-4" /> ATS Match Score</p>
                    <p className="text-sm text-muted-foreground">Based on keyword matching and content relevance</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="font-semibold text-foreground mb-2">Matched Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.jdKeywords.map(k => <Badge key={k} variant="secondary" className="font-normal">{k}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* JD Summary */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="font-semibold text-foreground mb-2">Job Description Summary</p>
                <p className="text-sm text-muted-foreground">{result.jdSummary}</p>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="font-semibold text-foreground mb-2 flex items-center gap-1"><Lightbulb className="h-4 w-4 text-amber-500" /> Improvement Suggestions</p>
                <ul className="space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-['→'] before:absolute before:left-0">{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Tailored Summary Preview */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="font-semibold text-foreground mb-2">Tailored Summary</p>
                <p className="text-sm text-foreground leading-relaxed">{result.parsedData.summary}</p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('input'); setResult(null); }}>
                <ArrowRight className="h-4 w-4 mr-1 rotate-180" /> Back to Edit
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <Check className="h-4 w-4 mr-1" /> Save Tailored Resume
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
