import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Calendar, Loader2, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface ClassItem {
  id: string;
  name: string;
  color: string;
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [assignments, setAssignments] = useState<Tables<'assignments'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!user || !id) return;
      
      const classes = (user.user_metadata?.classes as ClassItem[]) || [];
      const currentClass = classes.find(c => c.id === id);
      
      if (!currentClass) {
        navigate('/classes');
        return;
      }
      
      setClassData(currentClass);

      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_name', currentClass.name);

      setAssignments(data || []);
      setLoading(false);
    };

    fetchClassDetails();
  }, [user, id, navigate]);

  const sortedAssignments = [...assignments].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const pendingAssignments = sortedAssignments.filter(a => a.status !== 'completed');
  const completedAssignments = sortedAssignments.filter(a => a.status === 'completed');

  const priorityColors: Record<string, string> = {
    low: 'bg-success/10 text-success',
    medium: 'bg-primary/10 text-primary',
    high: 'bg-warning/10 text-warning',
    urgent: 'bg-destructive/10 text-destructive',
  };

  const getStatusDisplay = (status: string) => {
    return status.replace('_', ' ');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!classData) return null;

  return (
    <AppLayout>
      <div className="animate-fade-in pb-8 max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/classes')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to classes
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-8 border-b border-border">
          <div>
            <div className={cn("inline-block px-3 py-1 rounded-md text-sm font-semibold mb-3", classData.color)}>
              {classData.name}
            </div>
            <h1 className="text-3xl font-bold text-foreground">Class Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Viewing all assignments connected to {classData.name}.
            </p>
          </div>
          <Button 
            className="gap-2 shrink-0" 
            onClick={() => navigate('/parse', { state: { prefillCourse: classData.name } })}
          >
            <Plus className="h-4 w-4" /> New Assignment
          </Button>
        </div>

        <div className="space-y-10">
          {/* Pending Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Pending</h2>
              <Badge variant="secondary" className="ml-2">{pendingAssignments.length}</Badge>
            </div>
            
            {pendingAssignments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <p className="text-sm font-medium text-muted-foreground">No pending assignments.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingAssignments.map(a => (
                  <Link key={a.id} to={`/assignment/${a.id}`} className="group block rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-all hover:border-primary/50 relative overflow-hidden flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors pr-4 line-clamp-2">{a.title}</h3>
                      <Badge variant="secondary" className="capitalize text-[10px] py-0 shrink-0">{getStatusDisplay(a.status)}</Badge>
                    </div>
                    <div className="flex justify-between items-end mt-auto pt-4 border-t border-border/50">
                      {a.due_date ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className={new Date(a.due_date) < new Date() ? 'text-destructive font-bold' : ''}>
                            {format(new Date(a.due_date), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" /> No due date
                        </div>
                      )}
                      
                      {a.priority_level && (
                        <Badge className={cn('capitalize text-[10px]', priorityColors[a.priority_level])}>
                          {a.priority_level}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Completed Section bg-card/40 opacity-70 hover:opacity-100 */}
          {completedAssignments.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-bold text-muted-foreground">Completed</h2>
                <Badge variant="outline" className="ml-2 text-muted-foreground">{completedAssignments.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {completedAssignments.map(a => (
                  <Link key={a.id} to={`/assignment/${a.id}`} className="block rounded-lg border border-border bg-card/40 p-4 hover:bg-card transition-colors opacity-80 hover:opacity-100">
                    <h3 className="text-sm font-medium text-foreground mb-2 truncate">{a.title}</h3>
                    <div className="flex items-center justify-between">
                       <Badge variant="default" className="text-[10px] py-0 capitalize">{getStatusDisplay(a.status)}</Badge>
                       {a.due_date && (
                        <span className="text-xs text-muted-foreground">{format(new Date(a.due_date), 'MMM d')}</span>
                       )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
