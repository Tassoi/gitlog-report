import { NavLink } from 'react-router-dom';
import { Home, FolderGit2, GitCommit, FileText, FileCode, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SideNav() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/repos', icon: FolderGit2, label: 'Repos' },
    { to: '/commits', icon: GitCommit, label: 'Commits' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/templates', icon: FileCode, label: 'Templates' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className={cn(
      "relative border-r bg-background flex flex-col transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      <Button
        variant="outline"
        size="icon"
        className="absolute -right-3 top-4 z-50 h-6 w-6 rounded-full"
        onClick={toggleSidebar}
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="p-4 border-b">
        {!sidebarCollapsed && <h1 className="text-xl font-bold">GitLog AI</h1>}
        {sidebarCollapsed && <h1 className="text-xl font-bold text-center">G</h1>}
      </div>
      <div className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
                sidebarCollapsed && 'justify-center'
              )
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
