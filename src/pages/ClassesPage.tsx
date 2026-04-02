import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

export interface ClassItem {
  id: string;
  name: string;
  color: string;
}

const COLORS = [
  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
];

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<Tables<'assignments'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setClasses((user.user_metadata?.classes as ClassItem[]) || []);
    supabase.from('assignments').select('*').eq('user_id', user.id)
      .then(({ data }) => { setAssignments(data || []); setLoading(false); });
  }, [user]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !user) return;
    
    // Prevent duplicates
    if (classes.some(c => c.name.toLowerCase() === newClassName.trim().toLowerCase())) {
      toast.error('A class with this name already exists.');
      return;
    }
    
    const newClass: ClassItem = {
      id: crypto.randomUUID(),
      name: newClassName.trim(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };

    const updatedClasses = [...classes, newClass];
    
    const { error } = await supabase.auth.updateUser({
      data: { classes: updatedClasses }
    });

    if (error) {
      toast.error('Failed to add class');
      return;
    }

    setClasses(updatedClasses);
    setNewClassName('');
    setIsDialogOpen(false);
    toast.success('Class added successfully!');
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!user || !window.confirm(`Are you sure you want to delete ${name}? Your existing assignments won't be deleted, but they will no longer be connected to an active class.`)) return;

    const updatedClasses = classes.filter(c => c.id !== id);
    
    const { error } = await supabase.auth.updateUser({
      data: { classes: updatedClasses }
    });

    if (error) {
      toast.error('Failed to delete class');
      return;
    }

    setClasses(updatedClasses);
    toast.success('Class deleted');
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

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Classes</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your active courses and schedule.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddClass}>
                <DialogHeader>
                  <DialogTitle>Add a new class</DialogTitle>
                  <DialogDescription>Create a new distinct class to organize your assignments under.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="e.g. Biology 101" 
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={!newClassName.trim()}>Save Class</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">You don't have any classes yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first class to start getting organized.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c) => {
              const count = assignments.filter(a => a.course_name === c.name).length;
              return (
              <Link key={c.id} to={`/classes/${c.id}`} className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all relative overflow-hidden flex flex-col min-h-[140px]">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("px-2.5 py-1 rounded-md text-xs font-semibold", c.color)}>
                      {c.name}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.preventDefault(); handleDeleteClass(c.id, c.name); }}
                      className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  <div className="mt-auto">
                    <p className="text-3xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Assignments</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
