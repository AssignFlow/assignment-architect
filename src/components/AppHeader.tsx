import { Link, useLocation } from 'react-router-dom';
import { Menu, FileText, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LayoutDashboard, History, Calendar, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/parse', label: 'New Assignment', icon: PlusCircle },
  { href: '/history', label: 'History', icon: History },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <Link to="/dashboard" className="flex items-center gap-2 px-2 mb-6" onClick={() => setOpen(false)}>
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">AssignFlow</span>
            </Link>
            <nav className="space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === href
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
              onClick={() => { signOut(); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mt-4"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            {user.email}
          </div>
        )}
      </div>
    </header>
  );
}
