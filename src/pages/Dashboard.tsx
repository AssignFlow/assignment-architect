import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Clock, AlertTriangle, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, addDays } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Assignment = Tables<'assignments'>;
type Task = Tables<'assignment_tasks'>;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Tables<'user_preferences'> | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [aRes, tRes, pRes] = await Promise.all([
        supabase.from('assignments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('assignment_tasks').select('*').eq('user_id', user.id).order('display_order'),
        supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
      ]);
      setAssignments(aRes.data || []);
      setTasks(tRes.data || []);
      setPrefs(pRes.data);
      setLoading(false);

      // Redirect to onboarding if not completed
      if (pRes.data && !pRes.data.onboarding_completed) {
        navigate('/onboarding');
      }
    };
    load();
  }, [user, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const upcomingAssignments = assignments
    .filter(a => a.due_date && !isPast(new Date(a.due_date)) && a.status !== 'completed')
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  const inProgressAssignments = assignments.filter(a => a.status === 'in_progress');
  const todayTasks = tasks.filter(t => t.status !== 'completed').slice(0, 5);

  const isEmpty = assignments.length === 0;

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Here's what's on your plate.</p>
          </div>
          <Link to="/parse">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" /> New assignment
            </Button>
          </Link>
        </div>

        {isEmpty ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No assignments yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Paste your first assignment and we'll turn it into a clear action plan.
            </p>
            <Link to="/parse">
              <Button>
                Parse your first assignment <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's focus */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-base font-semibold text-foreground mb-4">Today's focus</h2>
                {todayTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All caught up! Parse a new assignment to get started.</p>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <div className={`h-2 w-2 rounded-full ${task.status === 'in_progress' ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        <span className="text-sm text-foreground flex-1">{task.title}</span>
                        {task.estimated_minutes && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {task.estimated_minutes}m
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* In progress */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-base font-semibold text-foreground mb-4">In progress</h2>
                {inProgressAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignments in progress.</p>
                ) : (
                  <div className="space-y-3">
                    {inProgressAssignments.slice(0, 5).map(a => {
                      const assignmentTasks = tasks.filter(t => t.assignment_id === a.id);
                      const completed = assignmentTasks.filter(t => t.status === 'completed').length;
                      const total = assignmentTasks.length;
                      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                      return (
                        <Link key={a.id} to={`/assignment/${a.id}`} className="block p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-foreground">{a.title}</h3>
                              {a.course_name && <p className="text-xs text-muted-foreground mt-0.5">{a.course_name}</p>}
                            </div>
                            <Badge variant="secondary" className="text-xs">{pct}%</Badge>
                          </div>
                          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming deadlines */}
            <div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Upcoming deadlines
                </h2>
                {upcomingAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingAssignments.slice(0, 6).map(a => {
                      const due = new Date(a.due_date!);
                      const isUrgent = isToday(due) || isTomorrow(due);
                      return (
                        <Link key={a.id} to={`/assignment/${a.id}`} className="block">
                          <div className="p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                            <h3 className="text-sm font-medium text-foreground">{a.title}</h3>
                            <p className={`text-xs mt-1 ${isUrgent ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              {formatDistanceToNow(due, { addSuffix: true })}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
