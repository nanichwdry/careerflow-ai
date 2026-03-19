import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Target, FileText, Briefcase, GraduationCap, Award, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function ResumePreview() {
  const { id } = useParams<{ id: string }>();
  const { tailoredResumes, templates } = useApp();
  const navigate = useNavigate();

  const resume = tailoredResumes.find(r => r.id === id);
  if (!resume) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Resume not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/tailored-resumes')}>Back to Resumes</Button>
        </div>
      </DashboardLayout>
    );
  }

  const template = templates.find(t => t.id === resume.templateId);
  const data = resume.parsedData;

  const handleExport = (format: 'pdf' | 'docx') => {
    toast.success(`${format.toUpperCase()} export started — download will begin shortly`);
    // In production, generate real PDF/DOCX here
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tailored-resumes')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{resume.targetJobTitle}</h1>
              <p className="text-sm text-muted-foreground">{template?.name} • Version {resume.version} • {new Date(resume.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`border-0 font-medium ${resume.atsScore >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
              <Target className="h-3 w-3 mr-1" /> ATS {resume.atsScore}%
            </Badge>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('docx')}>
              <Download className="h-4 w-4 mr-1" /> DOCX
            </Button>
          </div>
        </div>

        {/* Resume Document Preview */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-8 md:p-12 max-w-[800px] mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">{data.fullName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {data.contact.email} • {data.contact.phone} • {data.contact.location}
              </p>
              {(data.contact.linkedIn || data.contact.website) && (
                <p className="text-sm text-muted-foreground">
                  {data.contact.linkedIn}{data.contact.linkedIn && data.contact.website ? ' • ' : ''}{data.contact.website}
                </p>
              )}
            </div>

            <Separator className="mb-6" />

            {/* Summary */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Professional Summary</h3>
              <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Skills</h3>
              <p className="text-sm text-foreground">{data.skills.join(' • ')}</p>
            </div>

            {/* Experience */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Experience</h3>
              {data.experience.map((exp, i) => (
                <div key={exp.id} className={i > 0 ? 'mt-4' : ''}>
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{exp.title}</p>
                      <p className="text-sm text-muted-foreground">{exp.company}, {exp.location}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</p>
                  </div>
                  <ul className="mt-1.5 space-y-1">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="text-sm text-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground">{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Education</h3>
              {data.education.map(edu => (
                <div key={edu.id} className="flex justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{edu.degree} in {edu.field}</p>
                    <p className="text-sm text-muted-foreground">{edu.institution}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{edu.graduationDate}</p>
                </div>
              ))}
            </div>

            {/* Certifications */}
            {data.certifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Certifications</h3>
                {data.certifications.map(c => (
                  <p key={c.id} className="text-sm text-foreground">{c.name} — {c.issuer} ({c.date})</p>
                ))}
              </div>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Projects</h3>
                {data.projects.map(p => (
                  <div key={p.id} className="mb-2">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suggestions */}
        {resume.suggestions.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {resume.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-['→'] before:absolute before:left-0">{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
