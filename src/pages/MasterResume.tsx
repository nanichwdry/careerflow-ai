import React, { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload, FileText, Shield, Briefcase, GraduationCap, Award,
  FolderOpen, Loader2, MapPin, Mail, Phone, Globe, Linkedin,
  AlertTriangle, ClipboardPaste, Plus, Trash2, Pencil, Check, X,
} from 'lucide-react';
import { parseResumeFile, parseResumeText, formatFileSize } from '@/services/resume-parser';
import type {
  MasterResume, ParsedResume, ContactInfo,
  WorkExperience, Education, Certification, Project,
} from '@/types';
import { toast } from 'sonner';

// ─── helpers ────────────────────────────────────────────────────────────────

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100" onClick={onClick}>
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  );
}

function SaveCancel({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-2 mt-3">
      <Button size="sm" className="h-7 text-xs" onClick={onSave}><Check className="h-3 w-3 mr-1" /> Save</Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}><X className="h-3 w-3 mr-1" /> Cancel</Button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MasterResumePage() {
  const { masterResume, setMasterResume } = useApp();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // which section is in edit mode
  const [editing, setEditing] = useState<string | null>(null);

  // draft state for each section
  const [draftContact, setDraftContact] = useState<ContactInfo & { fullName: string } | null>(null);
  const [draftSummary, setDraftSummary] = useState('');
  const [draftSkills, setDraftSkills] = useState<string[]>([]);
  const [draftSkillInput, setDraftSkillInput] = useState('');
  const [draftExp, setDraftExp] = useState<WorkExperience | null>(null);
  const [draftEdu, setDraftEdu] = useState<Education | null>(null);
  const [draftCert, setDraftCert] = useState<Certification | null>(null);
  const [draftProj, setDraftProj] = useState<Project | null>(null);
  const [draftProjTechInput, setDraftProjTechInput] = useState('');
  const [addingExpBullet, setAddingExpBullet] = useState('');

  const patch = useCallback((update: Partial<ParsedResume>) => {
    if (!masterResume) return;
    setMasterResume({ ...masterResume, parsedData: { ...masterResume.parsedData, ...update } });
  }, [masterResume, setMasterResume]);

  // ── Upload/paste ────────────────────────────────────────────────────────

  const saveParsed = (parsedData: ParsedResume, fileName: string, fileSize = 0) => {
    const resume: MasterResume = {
      id: crypto.randomUUID(),
      userId: user!.id,
      fileName,
      fileType: 'pdf',
      fileSize,
      uploadedAt: new Date().toISOString(),
      parsedData,
      rawText: '',
      isReadOnly: true,
    };
    setMasterResume(resume);
    setShowReplace(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) { toast.error('Please upload a PDF or DOCX file'); return; }
    setIsUploading(true);
    try {
      const parsedData = await parseResumeFile(file);
      saveParsed(parsedData, file.name, file.size);
      toast.success('Resume uploaded and parsed successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse resume');
    } finally { setIsUploading(false); }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) { toast.error('Please paste your resume text first'); return; }
    setIsUploading(true);
    try {
      const parsedData = await parseResumeText(pasteText);
      saveParsed(parsedData, 'pasted-resume.txt');
      setPasteText('');
      toast.success('Resume parsed successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse resume text');
    } finally { setIsUploading(false); }
  };

  const data = masterResume?.parsedData;

  if (!masterResume) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Master Resume</h1>
            <p className="text-muted-foreground mt-1">Your source of truth — all tailored resumes are derived from this</p>
          </div>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <Tabs defaultValue="upload">
                <TabsList className="mb-6">
                  <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-1.5" /> Upload File</TabsTrigger>
                  <TabsTrigger value="paste"><ClipboardPaste className="h-4 w-4 mr-1.5" /> Paste Text</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <div className="flex flex-col items-center py-10 border-2 border-dashed border-border/50 rounded-lg">
                    <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-base font-semibold text-foreground mb-1">Upload PDF or DOCX</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">
                      Works best with text-based PDFs. If your PDF was created from a scan, use Paste Text instead.
                    </p>
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleUpload} className="hidden" />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} size="lg">
                      {isUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Parsing...</> : <><Upload className="h-4 w-4 mr-2" /> Choose File</>}
                    </Button>
                    <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3" /> Stored locally, never shared
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="paste">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Open your resume, select all (<kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl+A</kbd> then <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl+C</kbd>), paste below.
                    </p>
                    <Textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste your full resume text here..." rows={14} className="font-mono text-sm" />
                    <Button onClick={handlePasteSubmit} disabled={isUploading || !pasteText.trim()} className="w-full">
                      {isUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Parsing...</> : <><ClipboardPaste className="h-4 w-4 mr-2" /> Parse Resume</>}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ── Section editors ────────────────────────────────────────────────────

  // Contact + Name
  const startContact = () => {
    setDraftContact({ fullName: data!.fullName, ...data!.contact });
    setEditing('contact');
  };
  const saveContact = () => {
    if (!draftContact) return;
    const { fullName, ...contact } = draftContact;
    patch({ fullName, contact });
    setEditing(null);
    toast.success('Contact info updated');
  };

  // Summary
  const startSummary = () => { setDraftSummary(data!.summary); setEditing('summary'); };
  const saveSummary = () => { patch({ summary: draftSummary }); setEditing(null); toast.success('Summary updated'); };

  // Skills
  const startSkills = () => { setDraftSkills([...data!.skills]); setDraftSkillInput(''); setEditing('skills'); };
  const addSkill = () => {
    const s = draftSkillInput.trim();
    if (!s || draftSkills.includes(s)) return;
    setDraftSkills(p => [...p, s]);
    setDraftSkillInput('');
  };
  const removeSkill = (s: string) => setDraftSkills(p => p.filter(x => x !== s));
  const saveSkills = () => { patch({ skills: draftSkills }); setEditing(null); toast.success('Skills updated'); };

  // Experience
  const startExp = (exp: WorkExperience) => { setDraftExp({ ...exp, bullets: [...exp.bullets] }); setAddingExpBullet(''); setEditing(`exp-${exp.id}`); };
  const saveExp = () => {
    if (!draftExp) return;
    patch({ experience: data!.experience.map(e => e.id === draftExp.id ? draftExp : e) });
    setEditing(null); toast.success('Experience updated');
  };
  const addExpEntry = () => {
    const blank: WorkExperience = { id: crypto.randomUUID(), company: '', title: '', location: '', startDate: '', endDate: '', current: false, bullets: [] };
    patch({ experience: [...data!.experience, blank] });
    startExp(blank);
  };
  const deleteExp = (id: string) => { patch({ experience: data!.experience.filter(e => e.id !== id) }); toast.success('Experience removed'); };

  // Education
  const startEdu = (edu: Education) => { setDraftEdu({ ...edu }); setEditing(`edu-${edu.id}`); };
  const saveEdu = () => {
    if (!draftEdu) return;
    patch({ education: data!.education.map(e => e.id === draftEdu.id ? draftEdu : e) });
    setEditing(null); toast.success('Education updated');
  };
  const addEduEntry = () => {
    const blank: Education = { id: crypto.randomUUID(), institution: '', degree: '', field: '', graduationDate: '', gpa: '' };
    patch({ education: [...data!.education, blank] });
    startEdu(blank);
  };
  const deleteEdu = (id: string) => { patch({ education: data!.education.filter(e => e.id !== id) }); toast.success('Education removed'); };

  // Certifications
  const startCert = (c: Certification) => { setDraftCert({ ...c }); setEditing(`cert-${c.id}`); };
  const saveCert = () => {
    if (!draftCert) return;
    patch({ certifications: data!.certifications.map(c => c.id === draftCert.id ? draftCert : c) });
    setEditing(null); toast.success('Certification updated');
  };
  const addCertEntry = () => {
    const blank: Certification = { id: crypto.randomUUID(), name: '', issuer: '', date: '' };
    patch({ certifications: [...data!.certifications, blank] });
    startCert(blank);
  };
  const deleteCert = (id: string) => { patch({ certifications: data!.certifications.filter(c => c.id !== id) }); toast.success('Certification removed'); };

  // Projects
  const startProj = (p: Project) => { setDraftProj({ ...p, technologies: [...p.technologies] }); setDraftProjTechInput(''); setEditing(`proj-${p.id}`); };
  const saveProj = () => {
    if (!draftProj) return;
    patch({ projects: data!.projects.map(p => p.id === draftProj.id ? draftProj : p) });
    setEditing(null); toast.success('Project updated');
  };
  const addProjEntry = () => {
    const blank: Project = { id: crypto.randomUUID(), name: '', description: '', technologies: [] };
    patch({ projects: [...data!.projects, blank] });
    startProj(blank);
  };
  const deleteProj = (id: string) => { patch({ projects: data!.projects.filter(p => p.id !== id) }); toast.success('Project removed'); };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Master Resume</h1>
            <p className="text-muted-foreground mt-1">Your source of truth — click the pencil icon on any section to edit</p>
          </div>
        </div>

        {/* File info */}
        <Card className="border-border/50">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{masterResume.fileName}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(masterResume.fileSize)} • Uploaded {new Date(masterResume.uploadedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowReplace(r => !r)}>
                <Upload className="h-4 w-4 mr-1" /> {showReplace ? 'Cancel' : 'Replace'}
              </Button>
            </div>
            {showReplace && (
              <Tabs defaultValue="upload">
                <TabsList>
                  <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-1.5" /> Upload File</TabsTrigger>
                  <TabsTrigger value="paste"><ClipboardPaste className="h-4 w-4 mr-1.5" /> Paste Text</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="pt-3">
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleUpload} className="hidden" />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="outline">
                    {isUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Parsing...</> : <><Upload className="h-4 w-4 mr-2" /> Choose File</>}
                  </Button>
                </TabsContent>
                <TabsContent value="paste" className="pt-3 space-y-3">
                  <Textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste resume text here..." rows={8} className="font-mono text-sm" />
                  <Button onClick={handlePasteSubmit} disabled={isUploading || !pasteText.trim()}>
                    {isUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Parsing...</> : <><ClipboardPaste className="h-4 w-4 mr-2" /> Parse Resume</>}
                  </Button>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {data && (
          <div className="space-y-6">

            {/* ── Contact ──────────────────────────────────────────────── */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Contact</CardTitle>
                  {editing !== 'contact' && <EditBtn onClick={startContact} />}
                </div>
              </CardHeader>
              <CardContent>
                {editing === 'contact' && draftContact ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Full Name</Label>
                        <Input value={draftContact.fullName} onChange={e => setDraftContact(p => p && ({ ...p, fullName: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input value={draftContact.email} onChange={e => setDraftContact(p => p && ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone</Label>
                        <Input value={draftContact.phone} onChange={e => setDraftContact(p => p && ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Location</Label>
                        <Input value={draftContact.location} onChange={e => setDraftContact(p => p && ({ ...p, location: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">LinkedIn URL</Label>
                        <Input value={draftContact.linkedIn ?? ''} onChange={e => setDraftContact(p => p && ({ ...p, linkedIn: e.target.value }))} placeholder="linkedin.com/in/…" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Website</Label>
                        <Input value={draftContact.website ?? ''} onChange={e => setDraftContact(p => p && ({ ...p, website: e.target.value }))} placeholder="yoursite.com" />
                      </div>
                    </div>
                    <SaveCancel onSave={saveContact} onCancel={() => setEditing(null)} />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground text-lg">{data.fullName}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                      {data.contact.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {data.contact.email}</span>}
                      {data.contact.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {data.contact.phone}</span>}
                      {data.contact.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {data.contact.location}</span>}
                      {data.contact.linkedIn && <span className="flex items-center gap-1"><Linkedin className="h-3.5 w-3.5" /> {data.contact.linkedIn}</span>}
                      {data.contact.website && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {data.contact.website}</span>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Summary ──────────────────────────────────────────────── */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Professional Summary</CardTitle>
                  {editing !== 'summary' && <EditBtn onClick={startSummary} />}
                </div>
              </CardHeader>
              <CardContent>
                {editing === 'summary' ? (
                  <>
                    <Textarea value={draftSummary} onChange={e => setDraftSummary(e.target.value)} rows={5} className="text-sm" />
                    <SaveCancel onSave={saveSummary} onCancel={() => setEditing(null)} />
                  </>
                ) : (
                  <p className="text-foreground leading-relaxed">{data.summary || <span className="text-muted-foreground italic">No summary — click edit to add one.</span>}</p>
                )}
              </CardContent>
            </Card>

            {/* ── Skills ───────────────────────────────────────────────── */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Skills</CardTitle>
                  {editing !== 'skills' && <EditBtn onClick={startSkills} />}
                </div>
              </CardHeader>
              <CardContent>
                {editing === 'skills' ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {draftSkills.map(s => (
                        <Badge key={s} variant="secondary" className="gap-1 pr-1">
                          {s}
                          <button onClick={() => removeSkill(s)} className="ml-1 rounded hover:text-destructive"><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={draftSkillInput}
                        onChange={e => setDraftSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                        placeholder="Type a skill and press Enter"
                        className="h-8 text-sm"
                      />
                      <Button size="sm" variant="outline" className="h-8" onClick={addSkill}><Plus className="h-3.5 w-3.5" /></Button>
                    </div>
                    <SaveCancel onSave={saveSkills} onCancel={() => setEditing(null)} />
                  </>
                ) : (
                  data.skills.length === 0 ? (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-700 dark:text-amber-400">No skills extracted. Click edit to add skills manually.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map(skill => <Badge key={skill} variant="secondary" className="font-normal">{skill}</Badge>)}
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* ── Experience ───────────────────────────────────────────── */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base"><Briefcase className="h-4 w-4 text-primary" /> Work Experience</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addExpEntry}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {data.experience.map((exp, i) => (
                  <div key={exp.id}>
                    {i > 0 && <Separator className="mb-6" />}
                    {editing === `exp-${exp.id}` && draftExp ? (
                      <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Job Title</Label>
                            <Input value={draftExp.title} onChange={e => setDraftExp(p => p && ({ ...p, title: e.target.value }))} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Company</Label>
                            <Input value={draftExp.company} onChange={e => setDraftExp(p => p && ({ ...p, company: e.target.value }))} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Location</Label>
                            <Input value={draftExp.location} onChange={e => setDraftExp(p => p && ({ ...p, location: e.target.value }))} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Start Date</Label>
                            <Input value={draftExp.startDate} onChange={e => setDraftExp(p => p && ({ ...p, startDate: e.target.value }))} placeholder="e.g. Jan 2022" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">End Date</Label>
                            <Input value={draftExp.endDate} disabled={draftExp.current} onChange={e => setDraftExp(p => p && ({ ...p, endDate: e.target.value }))} placeholder="e.g. Dec 2023" />
                          </div>
                          <div className="flex items-center gap-2 pt-5">
                            <input
                              type="checkbox"
                              id={`current-${draftExp.id}`}
                              checked={draftExp.current}
                              onChange={e => setDraftExp(p => p && ({ ...p, current: e.target.checked, endDate: e.target.checked ? '' : p.endDate }))}
                              className="rounded"
                            />
                            <Label htmlFor={`current-${draftExp.id}`} className="text-xs cursor-pointer">Currently working here</Label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Bullets</Label>
                          {draftExp.bullets.map((b, bi) => (
                            <div key={bi} className="flex gap-2 items-start">
                              <Textarea
                                value={b}
                                rows={2}
                                className="text-sm flex-1"
                                onChange={e => setDraftExp(p => {
                                  if (!p) return p;
                                  const bullets = [...p.bullets];
                                  bullets[bi] = e.target.value;
                                  return { ...p, bullets };
                                })}
                              />
                              <Button size="icon" variant="ghost" className="h-7 w-7 mt-0.5 text-destructive hover:text-destructive shrink-0"
                                onClick={() => setDraftExp(p => p && ({ ...p, bullets: p.bullets.filter((_, idx) => idx !== bi) }))}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-1">
                            <Input
                              value={addingExpBullet}
                              onChange={e => setAddingExpBullet(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (addingExpBullet.trim()) {
                                    setDraftExp(p => p && ({ ...p, bullets: [...p.bullets, addingExpBullet.trim()] }));
                                    setAddingExpBullet('');
                                  }
                                }
                              }}
                              placeholder="Add bullet point (Enter to add)"
                              className="h-8 text-sm"
                            />
                            <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => {
                              if (addingExpBullet.trim()) {
                                setDraftExp(p => p && ({ ...p, bullets: [...p.bullets, addingExpBullet.trim()] }));
                                setAddingExpBullet('');
                              }
                            }}><Plus className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                        <SaveCancel onSave={saveExp} onCancel={() => setEditing(null)} />
                      </div>
                    ) : (
                      <div className="group">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{exp.title || <span className="text-muted-foreground italic">Untitled role</span>}</h4>
                            <p className="text-sm text-muted-foreground">{exp.company}{exp.location ? ` • ${exp.location}` : ''}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground whitespace-nowrap mr-1">
                              {exp.startDate}{exp.startDate ? ' — ' : ''}{exp.current ? 'Present' : exp.endDate}
                            </span>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <EditBtn onClick={() => startExp(exp)} />
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteExp(exp.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <ul className="space-y-1.5 mt-2">
                          {exp.bullets.map((b, j) => (
                            <li key={j} className="text-sm text-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground">{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                {data.experience.length === 0 && <p className="text-sm text-muted-foreground">No experience entries yet.</p>}
              </CardContent>
            </Card>

            {/* ── Education ────────────────────────────────────────────── */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4 text-primary" /> Education</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addEduEntry}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.education.map(edu => (
                  <div key={edu.id} className="group">
                    {editing === `edu-${edu.id}` && draftEdu ? (
                      <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Degree</Label>
                            <Input value={draftEdu.degree} onChange={e => setDraftEdu(p => p && ({ ...p, degree: e.target.value }))} placeholder="e.g. Bachelor of Science" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Field of Study</Label>
                            <Input value={draftEdu.field} onChange={e => setDraftEdu(p => p && ({ ...p, field: e.target.value }))} placeholder="e.g. Computer Science" />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs">Institution</Label>
                            <Input value={draftEdu.institution} onChange={e => setDraftEdu(p => p && ({ ...p, institution: e.target.value }))} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Graduation Date</Label>
                            <Input value={draftEdu.graduationDate} onChange={e => setDraftEdu(p => p && ({ ...p, graduationDate: e.target.value }))} placeholder="e.g. May 2021" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">GPA (optional)</Label>
                            <Input value={draftEdu.gpa ?? ''} onChange={e => setDraftEdu(p => p && ({ ...p, gpa: e.target.value }))} placeholder="e.g. 3.8" />
                          </div>
                        </div>
                        <SaveCancel onSave={saveEdu} onCancel={() => setEditing(null)} />
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-foreground">{edu.degree} in {edu.field}</h4>
                          <p className="text-sm text-muted-foreground">{edu.institution}{edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground mr-1">{edu.graduationDate}</span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <EditBtn onClick={() => startEdu(edu)} />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteEdu(edu.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {data.education.length === 0 && <p className="text-sm text-muted-foreground">No education entries yet.</p>}
              </CardContent>
            </Card>

            {/* ── Certifications ───────────────────────────────────────── */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-primary" /> Certifications</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addCertEntry}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.certifications.map(c => (
                  <div key={c.id} className="group">
                    {editing === `cert-${c.id}` && draftCert ? (
                      <div className="space-y-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="grid grid-cols-1 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Name</Label>
                            <Input value={draftCert.name} onChange={e => setDraftCert(p => p && ({ ...p, name: e.target.value }))} placeholder="e.g. Generative AI for Developers" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Issuer</Label>
                              <Input value={draftCert.issuer} onChange={e => setDraftCert(p => p && ({ ...p, issuer: e.target.value }))} placeholder="e.g. Google" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Date</Label>
                              <Input value={draftCert.date} onChange={e => setDraftCert(p => p && ({ ...p, date: e.target.value }))} placeholder="e.g. 2024" />
                            </div>
                          </div>
                        </div>
                        <SaveCancel onSave={saveCert} onCancel={() => setEditing(null)} />
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground">{c.name || <span className="text-muted-foreground italic">Untitled</span>}</p>
                          <p className="text-sm text-muted-foreground">{c.issuer}{c.date ? ` · ${c.date}` : ''}</p>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <EditBtn onClick={() => startCert(c)} />
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteCert(c.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {data.certifications.length === 0 && <p className="text-sm text-muted-foreground">No certifications yet.</p>}
              </CardContent>
            </Card>

            {/* ── Projects ─────────────────────────────────────────────── */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base"><FolderOpen className="h-4 w-4 text-primary" /> Projects</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addProjEntry}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.projects.map(p => (
                  <div key={p.id} className="group">
                    {editing === `proj-${p.id}` && draftProj ? (
                      <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="space-y-1">
                          <Label className="text-xs">Project Name</Label>
                          <Input value={draftProj.name} onChange={e => setDraftProj(p => p && ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Textarea value={draftProj.description} rows={3} className="text-sm" onChange={e => setDraftProj(p => p && ({ ...p, description: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">URL (optional)</Label>
                          <Input value={draftProj.url ?? ''} onChange={e => setDraftProj(p => p && ({ ...p, url: e.target.value }))} placeholder="https://…" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Technologies</Label>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {draftProj.technologies.map(t => (
                              <Badge key={t} variant="outline" className="gap-1 pr-1 text-xs">
                                {t}
                                <button onClick={() => setDraftProj(p => p && ({ ...p, technologies: p.technologies.filter(x => x !== t) }))} className="ml-1 rounded hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={draftProjTechInput}
                              onChange={e => setDraftProjTechInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const t = draftProjTechInput.trim();
                                  if (t && !draftProj.technologies.includes(t)) {
                                    setDraftProj(p => p && ({ ...p, technologies: [...p.technologies, t] }));
                                    setDraftProjTechInput('');
                                  }
                                }
                              }}
                              placeholder="Add technology (Enter)"
                              className="h-8 text-sm"
                            />
                            <Button size="sm" variant="outline" className="h-8" onClick={() => {
                              const t = draftProjTechInput.trim();
                              if (t && !draftProj.technologies.includes(t)) {
                                setDraftProj(p => p && ({ ...p, technologies: [...p.technologies, t] }));
                                setDraftProjTechInput('');
                              }
                            }}><Plus className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                        <SaveCancel onSave={saveProj} onCancel={() => setEditing(null)} />
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-4">
                          <h4 className="font-semibold text-foreground">{p.name || <span className="text-muted-foreground italic">Untitled project</span>}</h4>
                          <p className="text-sm text-foreground mt-1">{p.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {p.technologies.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                          </div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <EditBtn onClick={() => startProj(p)} />
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteProj(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {data.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
