import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Clock, ArrowLeft, Trash2, RotateCcw, Plus, AlertTriangle, CheckCircle2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Countdown from '@/components/Countdown';
import type { Tables } from '@/integrations/supabase/types';
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

type Assignment = Tables<'assignments'>;
type Task = Tables<'assignment_tasks'>;

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const [aRes, tRes] = await Promise.all([
        supabase.from('assignments').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('assignment_tasks').select('*').eq('assignment_id', id).eq('user_id', user.id).order('display_order'),
      ]);
      setAssignment(aRes.data);
      setTasks(tRes.data || []);
      setLoading(false);
    };
    load();
  }, [user, id]);

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
    await supabase.from('assignment_tasks').update({ status: newStatus }).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    // Update assignment status
    const updated = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
    const allDone = updated.every(t => t.status === 'completed');
    if (allDone && updated.length > 0) {
      await supabase.from('assignments').update({ status: 'completed' }).eq('id', id!);
      setAssignment(prev => prev ? { ...prev, status: 'completed' } : prev);
      toast.success('All tasks completed! 🎉');
    } else if (assignment?.status === 'completed') {
      await supabase.from('assignments').update({ status: 'in_progress' }).eq('id', id!);
      setAssignment(prev => prev ? { ...prev, status: 'in_progress' } : prev);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim() || !user || !id) return;
    const { data, error } = await supabase.from('assignment_tasks').insert({
      assignment_id: id,
      user_id: user.id,
      title: newTaskTitle,
      display_order: tasks.length,
      status: 'not_started',
    }).select().single();
    if (data) {
      setTasks(prev => [...prev, data]);
      setNewTaskTitle('');
      toast.success('Task added');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    if (source.index === destination.index) return;
    
    // Optmimistic update
    const reorderedTasks = Array.from(tasks);
    const [movedTask] = reorderedTasks.splice(source.index, 1);
    reorderedTasks.splice(destination.index, 0, movedTask);
    
    // Update order locally
    const updatedTasks = reorderedTasks.map((t, i) => ({ ...t, display_order: i }));
    setTasks(updatedTasks);
    
    // Save to DB in background
    try {
      await Promise.all(
        updatedTasks.map(t => 
          supabase
            .from('assignment_tasks')
            .update({ display_order: t.display_order })
            .eq('id', t.id)
        )
      );
    } catch {
      toast.error('Failed to save task order.');
    }
  };

  const deleteAssignment = async () => {
    if (!id) return;
    await supabase.from('assignments').delete().eq('id', id);
    toast.success('Assignment deleted');
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!assignment) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Assignment not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const warnings = (assignment.parsed_warnings as any[]) || [];
  const requirements = assignment.parsed_requirements as any;

  const priorityColors: Record<string, string> = {
    low: 'bg-success/10 text-success',
    medium: 'bg-primary/10 text-primary',
    high: 'bg-warning/10 text-warning',
    urgent: 'bg-destructive/10 text-destructive',
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{assignment.title}</h1>
              <Badge variant={assignment.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                {assignment.status.replace('_', ' ')}
              </Badge>
            </div>
            {assignment.course_name && (
              <p className="text-sm text-muted-foreground">{assignment.course_name}</p>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete this assignment and all its tasks.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAssignment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-lg font-semibold text-foreground">{pct}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Due</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {assignment.due_date ? format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a') : 'No date set'}
            </p>
            {assignment.due_date && (
              <Countdown targetDate={assignment.due_date} className="text-xs text-muted-foreground mt-0.5" />
            )}
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Effort</p>
            <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {assignment.effort_estimate || 'Unknown'}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Priority</p>
            <Badge className={cn('mt-1 capitalize', priorityColors[assignment.priority_level || 'medium'])}>
              {assignment.priority_level || 'medium'}
            </Badge>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-foreground">Warnings</span>
            </div>
            {warnings.map((w: any, i: number) => (
              <p key={i} className="text-sm text-foreground ml-6">{w.message}</p>
            ))}
          </div>
        )}

        {/* Tasks */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Tasks ({completed}/{total})</h2>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="tasks-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id!} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border transition-colors bg-card',
                            task.status === 'completed' ? 'bg-muted/50 border-transparent' : 'border-border hover:bg-secondary/30',
                            snapshot.isDragging && 'shadow-md border-primary/50 relative z-10'
                          )}
                          style={provided.draggableProps.style}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={() => toggleTask(task)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm', task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground')}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                            )}
                          </div>
                          {task.estimated_minutes && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {task.estimated_minutes}m
                            </span>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add task */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            <Input
              placeholder="Add a custom task..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addTask} disabled={!newTaskTitle.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Re-parse */}
        <Button variant="outline" onClick={() => navigate('/parse')}>
          <RotateCcw className="h-4 w-4 mr-2" /> Parse again
        </Button>
      </div>
    </AppLayout>
  );
}
