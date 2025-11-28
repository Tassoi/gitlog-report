import { NavLink } from 'react-router-dom';
import { Home, FolderGit2, GitCommit, FileText, FileCode, Settings } from 'lucide-react';

export function SideNav() {
  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/repos', icon: FolderGit2, label: 'Repos' },
    { to: '/commits', icon: GitCommit, label: 'Commits' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/templates', icon: FileCode, label: 'Templates' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="w-64 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">GitLog AI</h1>
      </div>
      <div className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
