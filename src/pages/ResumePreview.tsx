import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ResumeTemplateRenderer } from '@/components/resume/ResumeTemplateRenderer';
import type { TemplateStyle } from '@/types';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ParsedResume } from '@/types';

// ─── DOCX generator ────────────────────────────────────────────────────────

function hr() {
  return new Paragraph({
    border: { bottom: { color: 'AAAAAA', size: 6, style: BorderStyle.SINGLE } },
    spacing: { before: 80, after: 80 },
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    text: text.toUpperCase(),
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
  });
}

function buildDocx(data: ParsedResume, jobTitle: string): Document {
  const children: any[] = [];

  // Name
  children.push(new Paragraph({
    children: [new TextRun({ text: data.fullName, bold: true, size: 36 })],
    alignment: AlignmentType.CENTER,
  }));

  // Contact line
  const contactParts = [data.contact.email, data.contact.phone, data.contact.location]
    .filter(Boolean)
    .join('  •  ');
  if (contactParts) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contactParts, size: 20, color: '555555' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }));
  }
  const links = [data.contact.linkedIn, data.contact.website].filter(Boolean).join('  •  ');
  if (links) {
    children.push(new Paragraph({
      children: [new TextRun({ text: links, size: 20, color: '555555' })],
      alignment: AlignmentType.CENTER,
    }));
  }

  children.push(hr());

  // Summary
  if (data.summary) {
    children.push(sectionHeading('Professional Summary'));
    children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: 22 })], spacing: { after: 120 } }));
  }

  // Skills
  if (data.skills.length > 0) {
    children.push(sectionHeading('Skills'));
    children.push(new Paragraph({
      children: [new TextRun({ text: data.skills.join(' • '), size: 22 })],
      spacing: { after: 120 },
    }));
  }

  // Experience
  if (data.experience.length > 0) {
    children.push(sectionHeading('Work Experience'));
    data.experience.forEach(exp => {
      children.push(new Paragraph({
        children: [new TextRun({ text: exp.title, bold: true, size: 24 })],
        spacing: { before: 120 },
      }));
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${exp.company}${exp.location ? `, ${exp.location}` : ''}`, size: 22, color: '555555' }),
          new TextRun({ text: `   ${exp.startDate} — ${exp.current ? 'Present' : exp.endDate}`, size: 20, color: '888888' }),
        ],
        spacing: { after: 60 },
      }));
      exp.bullets.forEach(bullet => {
        children.push(new Paragraph({
          children: [new TextRun({ text: bullet, size: 22 })],
          bullet: { level: 0 },
        }));
      });
    });
  }

  // Education
  if (data.education.length > 0) {
    children.push(sectionHeading('Education'));
    data.education.forEach(edu => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${edu.degree} in ${edu.field}`, bold: true, size: 22 })],
        spacing: { before: 80 },
      }));
      children.push(new Paragraph({
        children: [
          new TextRun({ text: edu.institution, size: 22, color: '555555' }),
          edu.gpa ? new TextRun({ text: `   GPA: ${edu.gpa}`, size: 20, color: '888888' }) : new TextRun(''),
          new TextRun({ text: `   ${edu.graduationDate}`, size: 20, color: '888888' }),
        ],
      }));
    });
  }

  // Certifications
  if (data.certifications.length > 0) {
    children.push(sectionHeading('Certifications'));
    data.certifications.forEach(c => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: c.name, bold: true, size: 22 }),
          new TextRun({ text: `  —  ${c.issuer}  (${c.date})`, size: 22, color: '555555' }),
        ],
      }));
    });
  }

  // Projects
  if (data.projects.length > 0) {
    children.push(sectionHeading('Projects'));
    data.projects.forEach(p => {
      children.push(new Paragraph({
        children: [new TextRun({ text: p.name, bold: true, size: 22 })],
        spacing: { before: 80 },
      }));
      children.push(new Paragraph({ children: [new TextRun({ text: p.description, size: 22 })], spacing: { after: 40 } }));
      if (p.technologies.length > 0) {
        children.push(new Paragraph({
          children: [new TextRun({ text: p.technologies.join(', '), size: 20, color: '555555' })],
        }));
      }
    });
  }

  return new Document({
    creator: 'CareerFlow AI',
    title: `${data.fullName} — ${jobTitle}`,
    sections: [{ properties: {}, children }],
  });
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function ResumePreview() {
  const { id } = useParams<{ id: string }>();
  const { tailoredResumes, templates } = useApp();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

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
  const templateStyle: TemplateStyle = (template?.style as TemplateStyle) || 'minimal';
  const data = resume.parsedData;
  const fileName = `${data.fullName.replace(/\s+/g, '_')}_${resume.targetJobTitle.replace(/\s+/g, '_')}`;

  const handlePdfExport = () => {
    setExporting('pdf');
    // Small delay so the spinner renders before print dialog opens
    setTimeout(() => {
      window.print();
      setExporting(null);
    }, 100);
  };

  const handleDocxExport = async () => {
    setExporting('docx');
    try {
      const doc = buildDocx(data, resume.targetJobTitle);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileName}.docx`);
      toast.success('DOCX downloaded');
    } catch {
      toast.error('Failed to generate DOCX');
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      {/* Print stylesheet — hides everything except #resume-print-area */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #resume-print-area,
          #resume-print-area * { visibility: visible; }
          #resume-print-area {
            position: absolute;
            top: 0; left: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none;
            border: none;
          }
        }
        @page { margin: 0.6in; size: letter; }
      `}</style>

      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/tailored-resumes')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{resume.targetJobTitle}</h1>
                <p className="text-sm text-muted-foreground">
                  {template?.name} • Version {resume.version} • {new Date(resume.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`border-0 font-medium ${resume.atsScore >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                <Target className="h-3 w-3 mr-1" /> ATS {resume.atsScore}%
              </Badge>
              <Button variant="outline" size="sm" onClick={handlePdfExport} disabled={!!exporting}>
                {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleDocxExport} disabled={!!exporting}>
                {exporting === 'docx' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                DOCX
              </Button>
            </div>
          </div>

          {/* Resume preview — also used as print target */}
          <div id="resume-print-area" ref={printRef}>
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-8 md:p-12 max-w-[800px] mx-auto">
                <ResumeTemplateRenderer data={data} style={templateStyle} />
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
          {resume.suggestions.length > 0 && (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Improvement Suggestions</CardTitle></CardHeader>
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
    </>
  );
}
