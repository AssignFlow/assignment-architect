import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Loader2, Calendar, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Assignment = Tables<'assignments'>;

export default function HistoryPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    if (!user) return;
    supabase.from('assignments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setAssignments(data || []); setLoading(false); });
  }, [user]);

  const deleteAssignment = async (id: string) => {
    await supabase.from('assignments').delete().eq('id', id);
    setAssignments(prev => prev.filter(a => a.id !== id));
    toast.success('Assignment deleted');
  };

  let filtered = assignments.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.course_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  if (sortBy === 'due_date') {
    filtered = filtered.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-success/10 text-success',
    medium: 'bg-primary/10 text-primary',
    high: 'bg-warning/10 text-warning',
    urgent: 'bg-destructive/10 text-destructive',
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">History</h1>
        <p className="text-sm text-muted-foreground mb-6">Browse all your saved assignments.</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="due_date">Due date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {assignments.length === 0 ? 'No assignments yet. Parse your first one!' : 'No assignments match your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <div key={a.id} className="group relative block rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
                <Link to={`/assignment/${a.id}`} className="absolute inset-0 z-0" />
                <div className="relative z-10 flex items-start justify-between pointer-events-none">
                  <div className="pointer-events-auto">
                    <h3 className="text-sm font-medium text-foreground group-hover:underline underline-offset-4 decoration-muted-foreground">{a.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {a.course_name && <span className="text-xs text-muted-foreground">{a.course_name}</span>}
                      {a.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {format(new Date(a.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pointer-events-auto">
                    {a.priority_level && (
                      <Badge className={cn('text-xs capitalize', priorityColors[a.priority_level])}>
                        {a.priority_level}
                      </Badge>
                    )}
                    <Badge variant={a.status === 'completed' ? 'default' : 'secondary'} className="text-xs capitalize">
                      {a.status.replace('_', ' ')}
                    </Badge>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete "{a.title}" and all its tasks.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAssignment(a.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
