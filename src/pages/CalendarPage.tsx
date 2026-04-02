import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Assignment = Tables<'assignments'>;

export default function CalendarPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('assignments').select('*').eq('user_id', user.id).not('due_date', 'is', null).order('due_date')
      .then(({ data }) => { setAssignments(data || []); setLoading(false); });
  }, [user]);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">Calendar</h1>
        <p className="text-sm text-muted-foreground mb-6">Your week at a glance.</p>

        {/* Week view */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {weekDays.map(day => {
            const isToday = isSameDay(day, today);
            const dayAssignments = assignments.filter(a => a.due_date && isSameDay(new Date(a.due_date), day));

            return (
              <div key={day.toISOString()} className={cn(
                'rounded-xl border p-3 min-h-[120px]',
                isToday ? 'border-primary bg-primary/5' : 'border-border bg-card'
              )}>
                <div className="text-center mb-2">
                  <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                  <p className={cn('text-sm font-semibold', isToday ? 'text-primary' : 'text-foreground')}>
                    {format(day, 'd')}
                  </p>
                </div>
                <div className="space-y-1">
                  {dayAssignments.map(a => (
                    <Link key={a.id} to={`/assignment/${a.id}`}>
                      <div className="rounded-md bg-accent p-1.5 text-xs font-medium text-accent-foreground truncate hover:bg-accent/80 transition-colors">
                        {a.title}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming list */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Upcoming deadlines</h2>
          {assignments.filter(a => a.due_date && new Date(a.due_date) >= today).length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming deadlines. Nice work!</p>
          ) : (
            <div className="space-y-3">
              {assignments.filter(a => a.due_date && new Date(a.due_date) >= today).slice(0, 10).map(a => (
                <Link key={a.id} to={`/assignment/${a.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="text-center min-w-[40px]">
                    <p className="text-xs text-muted-foreground">{format(new Date(a.due_date!), 'MMM')}</p>
                    <p className="text-lg font-bold text-foreground">{format(new Date(a.due_date!), 'd')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    {a.course_name && <p className="text-xs text-muted-foreground">{a.course_name}</p>}
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs">{a.status.replace('_', ' ')}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
