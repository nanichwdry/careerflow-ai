import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check, CheckCheck, Briefcase, FileText, AlertTriangle, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { NotificationType } from '@/types/automation';

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; label: string }> = {
  new_match: { icon: Sparkles, color: 'text-primary', label: 'New Match' },
  review_needed: { icon: AlertTriangle, color: 'text-amber-500', label: 'Review Needed' },
  app_submitted: { icon: Check, color: 'text-emerald-500', label: 'Submitted' },
  app_failed: { icon: AlertTriangle, color: 'text-red-500', label: 'Failed' },
  resume_generated: { icon: FileText, color: 'text-indigo-500', label: 'Resume Ready' },
  follow_up: { icon: Clock, color: 'text-amber-500', label: 'Follow Up' },
};

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();

  const unread = notifications.filter(n => !n.read);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">{unread.length} unread</p>
          </div>
          {unread.length > 0 && (
            <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
              <CheckCheck className="h-4 w-4 mr-2" /> Mark All Read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center py-16">
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center max-w-md">You'll receive notifications for job matches, application updates, and more.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const config = TYPE_CONFIG[n.type];
              const Icon = config.icon;
              return (
                <Card key={n.id} className={`border-border/50 transition-all ${!n.read ? 'bg-primary/5 border-primary/20' : ''}`}>
                  <CardContent className="py-3 flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>{n.title}</p>
                        <Badge variant="outline" className="text-xs">{config.label}</Badge>
                        {!n.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.read && (
                        <Button variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {n.entityId && n.entityType && (
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (n.entityType === 'job') navigate(`/jobs/${n.entityId}`);
                          else if (n.entityType === 'application') navigate(`/applications/${n.entityId}`);
                          else if (n.entityType === 'resume') navigate(`/resume-preview/${n.entityId}`);
                        }}>View</Button>
                      )}
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
