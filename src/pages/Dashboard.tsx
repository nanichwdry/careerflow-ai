import { useApp } from '@/contexts/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmailJobsSection } from '@/components/gmail/EmailJobsSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, FilePlus, Briefcase, FolderOpen, Target, Clock, Award, Search, Bookmark, ClipboardList, Zap, Bell, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ApplicationStatus } from '@/types';
import { STATUS_LABELS } from '@/types';

const statusColors: Record<ApplicationStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  saved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  applied: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  interview: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  archived: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge className={`${statusColors[status]} border-0 font-medium`}>{STATUS_LABELS[status]}</Badge>;
}

export default function Dashboard() {
  const { masterResume, tailoredResumes, applications, documents, jobs, savedJobs, reviewQueue, notifications, packets, applyRuns, coverLetters, activityLogs } = useApp();
  const navigate = useNavigate();

  const activeApps = applications.filter(a => ['applied', 'interview'].includes(a.status));
  const offerCount = applications.filter(a => a.status === 'offer').length;
  const avgATS = tailoredResumes.length > 0 ? Math.round(tailoredResumes.reduce((s, r) => s + r.atsScore, 0) / tailoredResumes.length) : 0;
  const pendingReviews = reviewQueue.filter(r => r.status === 'pending').length;
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const submittedToday = applyRuns.filter(r => r.status === 'submitted' && r.completedAt && new Date(r.completedAt).toDateString() === new Date().toDateString()).length;

  const stats = [
    { label: 'Jobs Tracked', value: jobs.length, icon: Search, color: 'text-primary', link: '/jobs' },
    { label: 'Saved Jobs', value: savedJobs.filter(s => s.status === 'saved').length, icon: Bookmark, color: 'text-blue-500', link: '/saved-jobs' },
    { label: 'Applications', value: applications.length, icon: Briefcase, color: 'text-amber-500', link: '/applications' },
    { label: 'Tailored Resumes', value: tailoredResumes.length, icon: FilePlus, color: 'text-emerald-500', link: '/tailored-resumes' },
    { label: 'Cover Letters', value: coverLetters.length, icon: FileText, color: 'text-indigo-500', link: '/documents' },
    { label: 'Documents', value: documents.length, icon: FolderOpen, color: 'text-purple-500', link: '/documents' },
    { label: 'Review Queue', value: pendingReviews, icon: ClipboardList, color: 'text-orange-500', link: '/review-queue' },
    { label: 'Packets Ready', value: packets.filter(p => p.status === 'ready').length, icon: Zap, color: 'text-cyan-500', link: '/activity-logs' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your career search at a glance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <Card key={s.label} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(s.link)}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{s.value}</p>
                  </div>
                  <s.icon className={`h-7 w-7 ${s.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Insights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg ATS Score</p>
                <p className="text-xl font-bold text-foreground">{avgATS || '—'}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Apps</p>
                <p className="text-xl font-bold text-foreground">{activeApps.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Offers</p>
                <p className="text-xl font-bold text-foreground">{offerCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted Today</p>
                <p className="text-xl font-bold text-foreground">{submittedToday}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gmail Jobs */}
        <EmailJobsSection />

        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/jobs')}><Search className="h-4 w-4 mr-1" /> Search Jobs</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/tailored-resumes/new')}><FilePlus className="h-4 w-4 mr-1" /> Create Resume</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/applications')}><Briefcase className="h-4 w-4 mr-1" /> Applications</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/review-queue')}><ClipboardList className="h-4 w-4 mr-1" /> Review Queue {pendingReviews > 0 && `(${pendingReviews})`}</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/automation-settings')}><Zap className="h-4 w-4 mr-1" /> Automation</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')}><Bell className="h-4 w-4 mr-1" /> Notifications {unreadNotifs > 0 && `(${unreadNotifs})`}</Button>
          </CardContent>
        </Card>

        {/* Recent sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Applications</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/applications')}>View All</Button>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No applications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 5).map(app => (
                    <div key={app.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/applications/${app.id}`)}>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{app.jobTitle}</p>
                        <p className="text-sm text-muted-foreground">{app.company}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/activity-logs')}>View All</Button>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="py-2 px-3 rounded-lg">
                      <p className="text-sm font-medium text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{log.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
