import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Calendar, Settings, FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/parse', label: 'New Assignment', icon: PlusCircle },
  { href: '/history', label: 'History', icon: History },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card min-h-screen p-4">
      <Link to="/dashboard" className="flex items-center gap-2 px-2 mb-8">
        <FileText className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold text-foreground">AssignFlow</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              location.pathname === href || location.pathname.startsWith(href + '/')
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut()}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </aside>
  );
}
