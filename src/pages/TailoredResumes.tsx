import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilePlus, Search, Eye, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TailoredResumes() {
  const { tailoredResumes, templates, masterResume } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = tailoredResumes.filter(r =>
    r.targetJobTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tailored Resumes</h1>
            <p className="text-muted-foreground mt-1">ATS-optimized versions derived from your master resume</p>
          </div>
          <Button onClick={() => navigate('/tailored-resumes/new')} disabled={!masterResume}>
            <FilePlus className="h-4 w-4 mr-2" /> Create Tailored Resume
          </Button>
        </div>

        {!masterResume && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="pt-6 text-center">
              <p className="text-amber-700 dark:text-amber-400">Upload a master resume first before creating tailored versions.</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate('/master-resume')}>Go to Master Resume</Button>
            </CardContent>
          </Card>
        )}

        {masterResume && (
          <>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by job title..." className="pl-10" />
            </div>

            {filtered.length === 0 ? (
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="flex flex-col items-center py-16">
                  <FilePlus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No tailored resumes yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    Create your first tailored resume by selecting a template, entering a job description, and letting AI optimize it.
                  </p>
                  <Button onClick={() => navigate('/tailored-resumes/new')}>
                    <FilePlus className="h-4 w-4 mr-2" /> Create Your First
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(r => {
                  const template = templates.find(t => t.id === r.templateId);
                  return (
                    <Card key={r.id} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/resume-preview/${r.id}`)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base leading-tight">{r.targetJobTitle}</CardTitle>
                          <Badge className={`border-0 font-medium shrink-0 ${r.atsScore >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : r.atsScore >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            <Target className="h-3 w-3 mr-1" /> {r.atsScore}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">{r.jdSummary}</p>
                        <div className="flex flex-wrap gap-1">
                          {r.jdKeywords.slice(0, 4).map(k => (
                            <Badge key={k} variant="outline" className="text-xs font-normal">{k}</Badge>
                          ))}
                          {r.jdKeywords.length > 4 && <Badge variant="outline" className="text-xs font-normal">+{r.jdKeywords.length - 4}</Badge>}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                          <span>{template?.name || 'Template'} • v{r.version}</span>
                          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4 mr-1" /> Preview
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
