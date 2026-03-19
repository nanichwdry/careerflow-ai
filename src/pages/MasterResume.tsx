import React, { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, Lock, Shield, Briefcase, GraduationCap, Award, FolderOpen, Loader2, MapPin, Mail, Phone, Globe, Linkedin } from 'lucide-react';
import { parseResumeFile, formatFileSize } from '@/services/resume-parser';
import type { MasterResume } from '@/types';
import { toast } from 'sonner';

export default function MasterResumePage() {
  const { masterResume, setMasterResume } = useApp();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or DOCX file');
      return;
    }

    setIsUploading(true);
    try {
      const parsedData = await parseResumeFile(file);
      const resume: MasterResume = {
        id: crypto.randomUUID(),
        userId: user!.id,
        fileName: file.name,
        fileType: file.type.includes('pdf') ? 'pdf' : 'docx',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        parsedData,
        rawText: '',
        isReadOnly: true,
      };
      setMasterResume(resume);
      toast.success('Resume uploaded and parsed successfully');
    } catch {
      toast.error('Failed to parse resume');
    } finally {
      setIsUploading(false);
    }
  };

  const data = masterResume?.parsedData;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Master Resume</h1>
            <p className="text-muted-foreground mt-1">Your source of truth — all tailored resumes are derived from this</p>
          </div>
          {masterResume && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0 gap-1 text-sm py-1 px-3">
              <Lock className="h-3.5 w-3.5" /> Read-Only
            </Badge>
          )}
        </div>

        {!masterResume ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Upload Your Master Resume</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Upload a PDF or DOCX file. We'll parse it into structured sections. This master copy will remain read-only — all tailored versions are created separately.
              </p>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleUpload} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} size="lg">
                {isUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Parsing...</> : <><Upload className="h-4 w-4 mr-2" /> Upload Resume</>}
              </Button>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>Your resume data is stored securely and never shared</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* File info */}
            <Card className="border-border/50">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{masterResume.fileName}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(masterResume.fileSize)} • Uploaded {new Date(masterResume.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" /> Replace
                </Button>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleUpload} className="hidden" />
              </CardContent>
            </Card>

            {data && (
              <div className="space-y-6">
                {/* Contact */}
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> {data.fullName}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {data.contact.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {data.contact.phone}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {data.contact.location}</span>
                      {data.contact.linkedIn && <span className="flex items-center gap-1"><Linkedin className="h-3.5 w-3.5" /> {data.contact.linkedIn}</span>}
                      {data.contact.website && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {data.contact.website}</span>}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base">Professional Summary</CardTitle></CardHeader>
                  <CardContent><p className="text-foreground leading-relaxed">{data.summary}</p></CardContent>
                </Card>

                {/* Skills */}
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="font-normal">{skill}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Experience */}
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Briefcase className="h-4 w-4 text-primary" /> Work Experience</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {data.experience.map((exp, i) => (
                      <div key={exp.id}>
                        {i > 0 && <Separator className="mb-6" />}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{exp.title}</h4>
                            <p className="text-sm text-muted-foreground">{exp.company} • {exp.location}</p>
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        <ul className="space-y-1.5 mt-3">
                          {exp.bullets.map((b, j) => (
                            <li key={j} className="text-sm text-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground">{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Education */}
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4 text-primary" /> Education</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {data.education.map(edu => (
                      <div key={edu.id} className="flex justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{edu.degree} in {edu.field}</h4>
                          <p className="text-sm text-muted-foreground">{edu.institution}{edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{edu.graduationDate}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Certifications */}
                {data.certifications.length > 0 && (
                  <Card className="border-border/50">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-primary" /> Certifications</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {data.certifications.map(c => (
                        <div key={c.id} className="flex justify-between">
                          <div>
                            <p className="font-medium text-foreground">{c.name}</p>
                            <p className="text-sm text-muted-foreground">{c.issuer}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">{c.date}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Projects */}
                {data.projects.length > 0 && (
                  <Card className="border-border/50">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FolderOpen className="h-4 w-4 text-primary" /> Projects</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {data.projects.map(p => (
                        <div key={p.id}>
                          <h4 className="font-semibold text-foreground">{p.name}</h4>
                          <p className="text-sm text-foreground mt-1">{p.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {p.technologies.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
