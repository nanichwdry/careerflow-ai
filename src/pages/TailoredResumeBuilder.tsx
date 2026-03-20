import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Target, Lightbulb, ArrowRight, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { analyzeJobDescription, generateTailoredResume } from '@/services/ai';
import { ResumeTemplateRenderer } from '@/components/resume/ResumeTemplateRenderer';
import type { TailoredResume, TemplateStyle } from '@/types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function TailoredResumeBuilder() {
  const { masterResume, templates, jobs, addTailoredResume } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<'input' | 'analyzing' | 'result'>('input');
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>('minimal');
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<TailoredResume | null>(null);

  // Pre-fill from job if jobId param is present, then auto-generate
  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (!jobId) return;
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    setTargetJobTitle(job.title);
    setJobDescription(job.description);
  }, [searchParams, jobs]);

  const handleGenerate = async (title = targetJobTitle, jd = jobDescription) => {
    if (!masterResume || !title.trim() || !jd.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setStep('analyzing');
    try {
      const analysis = await analyzeJobDescription(jd);
      const { tailoredData, atsScore, suggestions } = await generateTailoredResume(
        masterResume.parsedData, jd, analysis,
      );
      const resume: TailoredResume = {
        id: crypto.randomUUID(),
        userId: masterResume.userId,
        masterResumeId: masterResume.id,
        templateId: templates.find(t => t.style === templateStyle)?.id || templates[0]?.id || 'minimal',
        targetJobTitle: title.trim(),
        jobDescription: jd,
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
                Content is derived exclusively from your master resume. No experience is fabricated. The AI reorders, refines, and optimizes phrasing for ATS compatibility.
              </p>
            </div>
          </CardContent>
        </Card>

        {step === 'input' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Provide the role title and full job description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Template Picker */}
              <div className="space-y-2">
                <Label>Resume Template</Label>
                <div className="grid grid-cols-3 gap-3">
                  {templates.map(tpl => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplateStyle(tpl.style)}
                      className={`relative rounded-lg border-2 p-0 overflow-hidden transition-all text-left focus:outline-none ${
                        templateStyle === tpl.style
                          ? 'border-primary shadow-md'
                          : 'border-border/50 hover:border-border'
                      }`}
                    >
                      {/* Mini live preview */}
                      <div className="bg-white overflow-hidden" style={{ height: 130, padding: '14px 14px 0', pointerEvents: 'none' }}>
                        <div style={{ transform: 'scale(0.38)', transformOrigin: 'top left', width: '245%' }}>
                          {masterResume ? (
                            <ResumeTemplateRenderer data={masterResume.parsedData} style={tpl.style} />
                          ) : (
                            <div className="space-y-1 p-1">
                              <div className="h-3 bg-gray-200 rounded w-2/3" />
                              <div className="h-2 bg-gray-100 rounded w-full" />
                              <div className="h-2 bg-gray-100 rounded w-5/6" />
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Label */}
                      <div className="px-2 py-1.5 border-t border-border/50 bg-muted/30">
                        <p className="text-xs font-medium text-foreground truncate">{tpl.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{tpl.description}</p>
                      </div>
                      {templateStyle === tpl.style && (
                        <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Job Title</Label>
                <Input
                  value={targetJobTitle}
                  onChange={e => setTargetJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Description</Label>
                <Textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={12}
                />
                {jobDescription && (
                  <p className="text-xs text-muted-foreground">{jobDescription.length} characters</p>
                )}
              </div>
              <Button
                onClick={() => handleGenerate()}
                size="lg"
                className="w-full"
                disabled={!targetJobTitle.trim() || !jobDescription.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" /> Generate Tailored Resume
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'analyzing' && (
          <Card className="border-border/50">
            <CardContent className="py-16 flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Analyzing & Tailoring</h3>
              <p className="text-muted-foreground mt-1">Extracting keywords, matching skills, optimizing content...</p>
            </CardContent>
          </Card>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold ${
                    result.atsScore >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : result.atsScore >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {result.atsScore}%
                  </div>
                  <div>
                    <p className="font-semibold text-foreground flex items-center gap-1"><Target className="h-4 w-4" /> ATS Match Score</p>
                    <p className="text-sm text-muted-foreground">Based on keyword matching</p>
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

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="font-semibold text-foreground mb-2">JD Summary</p>
                <p className="text-sm text-muted-foreground">{result.jdSummary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="font-semibold text-foreground mb-2 flex items-center gap-1">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> Improvement Suggestions
                </p>
                <ul className="space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-['→'] before:absolute before:left-0">{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Resume Preview</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-b-lg">
                <div className="bg-white p-8 md:p-12 max-w-[800px] mx-auto">
                  <ResumeTemplateRenderer data={result.parsedData} style={templateStyle} />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('input'); setResult(null); }}>
                <ArrowRight className="h-4 w-4 mr-1 rotate-180" /> Back to Edit
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <Check className="h-4 w-4 mr-1" /> Save & Download Resume
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
