import { LayoutDashboard, FileText, FilePlus, Briefcase, FolderOpen, Settings, LogOut, Sparkles, Search, Bookmark, ClipboardList, Zap, Bell, Activity } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const mainNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Job Search', url: '/jobs', icon: Search },
  { title: 'Saved Jobs', url: '/saved-jobs', icon: Bookmark },
  { title: 'Applications', url: '/applications', icon: Briefcase },
  { title: 'Review Queue', url: '/review-queue', icon: ClipboardList },
];

const resumeNav = [
  { title: 'Master Resume', url: '/master-resume', icon: FileText },
  { title: 'Tailored Resumes', url: '/tailored-resumes', icon: FilePlus },
  { title: 'Documents', url: '/documents', icon: FolderOpen },
];

const systemNav = [
  { title: 'Automation', url: '/automation-settings', icon: Zap },
  { title: 'Activity Logs', url: '/activity-logs', icon: Activity },
  { title: 'Notifications', url: '/notifications', icon: Bell },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { logout, profile } = useAuth();
  const { notifications, reviewQueue } = useApp();

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingReviews = reviewQueue.filter(r => r.status === 'pending').length;

  const renderNav = (items: typeof mainNav, label?: string) => (
    <SidebarGroup>
      {label && !collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} end={item.url === '/dashboard'}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                  activeClassName="bg-sidebar-accent text-primary font-medium">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 flex items-center justify-between">
                      {item.title}
                      {item.url === '/notifications' && unreadCount > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">{unreadCount}</span>
                      )}
                      {item.url === '/review-queue' && pendingReviews > 0 && (
                        <span className="ml-auto bg-amber-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">{pendingReviews}</span>
                      )}
                    </span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <Sparkles className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight text-sidebar-foreground">
            CareerFlow <span className="text-primary">AI</span>
          </span>
        )}
      </div>

      <SidebarContent className="pt-2">
        {renderNav(mainNav)}
        {renderNav(resumeNav, 'Resumes')}
        {renderNav(systemNav, 'System')}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && profile && (
          <div className="mb-2 px-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        )}
        <Button variant="ghost" size={collapsed ? 'icon' : 'sm'} onClick={logout} className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
