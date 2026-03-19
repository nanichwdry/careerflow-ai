import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, Search, Download, Eye, FileText, Filter } from 'lucide-react';
import { formatFileSize } from '@/services/resume-parser';
import type { DocumentType } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  master_resume: 'Master Resume',
  tailored_resume: 'Tailored Resume',
  exported_pdf: 'PDF Export',
  exported_docx: 'DOCX Export',
  uploaded_source: 'Upload',
};

const DOC_TYPE_COLORS: Record<DocumentType, string> = {
  master_resume: 'bg-primary/10 text-primary',
  tailored_resume: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  exported_pdf: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  exported_docx: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  uploaded_source: 'bg-muted text-muted-foreground',
};

export default function Documents() {
  const { documents, applications, tailoredResumes } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = documents.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getLinkedInfo = (doc: typeof documents[0]) => {
    const parts: string[] = [];
    if (doc.linkedApplicationId) {
      const app = applications.find(a => a.id === doc.linkedApplicationId);
      if (app) parts.push(`${app.company} — ${app.jobTitle}`);
    }
    if (doc.linkedResumeId) {
      const resume = tailoredResumes.find(r => r.id === doc.linkedResumeId);
      if (resume) parts.push(resume.targetJobTitle);
    }
    return parts.join(' • ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">All your resumes, exports, and uploaded files in one place</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center py-16">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
              <p className="text-muted-foreground">Documents will appear here as you upload resumes and generate exports.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(doc => {
              const linkedInfo = getLinkedInfo(doc);
              return (
                <Card key={doc.id} className="border-border/50 hover:shadow-sm transition-shadow">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          {linkedInfo && <><span>•</span><span className="truncate">{linkedInfo}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`${DOC_TYPE_COLORS[doc.type]} border-0 text-xs`}>{DOC_TYPE_LABELS[doc.type]}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success('Download started')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
