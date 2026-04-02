import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Clock, AlertTriangle, CheckCircle2, ListChecks, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { parseAssignmentText, sampleAssignments, type ParsedRequirements, type ParsedWarning } from '@/lib/parser';
import { cn } from '@/lib/utils';

interface ParseResult {
  assignmentType: string;
  effortEstimate: string;
  difficultyEstimate: string;
  priorityLevel: string;
  requirements: ParsedRequirements;
  warnings: ParsedWarning[];
  tasks: { title: string; description: string; estimatedMinutes: number; order: number }[];
}

export default function Parser() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const prefillCourse = location.state?.prefillCourse;
  const [courseName, setCourseName] = useState(prefillCourse || '');
  const [showCustomCourse, setShowCustomCourse] = useState(false);
  const classes = (user?.user_metadata?.classes as { id: string, name: string }[]) || [];
  
  const [dueDate, setDueDate] = useState<Date>();
  const [dueTime, setDueTime] = useState('23:59');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [saving, setSaving] = useState(false);

  const getCombinedDate = () => {
    if (!dueDate) return null;
    const d = new Date(dueDate);
    if (dueTime) {
      const [h, m] = dueTime.split(':').map(Number);
      d.setHours(h, m, 0, 0);
    } else {
      d.setHours(23, 59, 59, 999);
    }
    return d;
  };

  const handleParse = () => {
    if (!rawText.trim()) {
      toast.error('Paste your assignment instructions first.');
      return;
    }
    setLoading(true);
    // Simulate parsing delay
    setTimeout(() => {
      const parsed = parseAssignmentText(rawText, title || 'Untitled Assignment', courseName, dueDate ? format(dueDate, 'yyyy-MM-dd') : null);
      setResult(parsed);
      setLoading(false);
      if (!title) setTitle('Untitled Assignment');
    }, 1200);
  };

  const handleSave = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const { data: assignment, error: aErr } = await supabase.from('assignments').insert({
        user_id: user.id,
        title: title || 'Untitled Assignment',
        course_name: courseName || null,
        raw_input_text: rawText,
        assignment_type: result.assignmentType as any,
        due_date: getCombinedDate()?.toISOString() || null,
        effort_estimate: result.effortEstimate,
        difficulty_estimate: result.difficultyEstimate,
        priority_level: result.priorityLevel as any,
        parsed_requirements: result.requirements as any,
        parsed_warnings: result.warnings as any,
        status: 'in_progress',
      }).select().single();

      if (aErr) throw aErr;

      const taskInserts = result.tasks.map(t => ({
        assignment_id: assignment.id,
        user_id: user.id,
        title: t.title,
        description: t.description,
        estimated_minutes: t.estimatedMinutes,
        display_order: t.order,
        status: 'not_started' as const,
      }));

      const { error: tErr } = await supabase.from('assignment_tasks').insert(taskInserts);
      if (tErr) throw tErr;

      toast.success('Assignment saved!');
      navigate(`/assignment/${assignment.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
    setSaving(false);
  };

  const loadSample = (sample: typeof sampleAssignments[0]) => {
    setTitle(sample.title);
    
    // Check if sample course exists in user classes
    const exists = classes.some(c => c.name === sample.course);
    if (!exists && sample.course) setShowCustomCourse(true);
    
    setCourseName(sample.course);
    setRawText(sample.text);
    const loadedDate = sample.dueDate ? new Date(sample.dueDate) : undefined;
    setDueDate(loadedDate);
    if (loadedDate && loadedDate.getHours() !== 0) {
      setDueTime(format(loadedDate, 'HH:mm'));
    } else {
      setDueTime('23:59');
    }
    setResult(null);
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-success/10 text-success',
    medium: 'bg-primary/10 text-primary',
    high: 'bg-warning/10 text-warning',
    urgent: 'bg-destructive/10 text-destructive',
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Parse assignment</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Paste the assignment instructions exactly as your teacher or professor gave them.
        </p>

        {!result ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Assignment title (optional)</Label>
                <Input id="title" placeholder="e.g. History Essay #3" value={title} onChange={e => setTitle(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="course">Class (optional)</Label>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => navigate('/classes')} 
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Manage Classes
                    </button>
                    {classes.length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setShowCustomCourse(!showCustomCourse)} 
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        {showCustomCourse ? 'Choose from list' : 'Type manually'}
                      </button>
                    )}
                  </div>
                </div>
                
                {showCustomCourse || classes.length === 0 ? (
                  <Input 
                    id="course" 
                    placeholder="e.g. Biology 101" 
                    value={courseName} 
                    onChange={e => setCourseName(e.target.value)} 
                    className="mt-1.5 font-medium" 
                  />
                ) : (
                  <Select value={courseName} onValueChange={setCourseName}>
                    <SelectTrigger className="mt-1.5 font-medium">
                      <SelectValue placeholder="Assign to a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col">
                <Label htmlFor="due" className="mb-1.5">Due date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="due"
                      variant="outline"
                      className={cn(
                        'w-[240px] justify-start text-left font-normal',
                        !dueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {dueDate && (
                <div className="flex flex-col animate-fade-in">
                  <Label htmlFor="time" className="mb-1.5">Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={dueTime} 
                    onChange={e => setDueTime(e.target.value)}
                    className="w-[120px]" 
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="raw">Assignment instructions</Label>
              <Textarea
                id="raw"
                placeholder="Paste the full assignment prompt, rubric, or syllabus section here..."
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                className="mt-1.5 min-h-[200px]"
              />
            </div>

            <Button onClick={handleParse} disabled={loading || !rawText.trim()} size="lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {loading ? 'Analyzing...' : 'Generate action plan'}
            </Button>

            {/* Sample assignments */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Not sure where to start? Try a sample assignment.</p>
              <div className="flex flex-wrap gap-2">
                {sampleAssignments.map(s => (
                  <button
                    key={s.title}
                    onClick={() => loadSample(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-secondary transition-colors text-foreground"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">Assignment overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium text-foreground capitalize mt-0.5">{result.assignmentType?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Effort</p>
                  <p className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {result.effortEstimate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{result.difficultyEstimate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <Badge className={cn('mt-0.5 capitalize', priorityColors[result.priorityLevel] || '')}>
                    {result.priorityLevel}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-6">
                <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Heads up
                </h2>
                <div className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <p key={i} className="text-sm text-foreground">{w.message}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Extracted requirements
              </h2>
              <div className="space-y-4">
                {result.requirements.deliverables.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Deliverables</h3>
                    <ul className="space-y-1.5">
                      {result.requirements.deliverables.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.requirements.constraints.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Constraints</h3>
                    <ul className="space-y-1.5">
                      {result.requirements.constraints.map((c, i) => (
                        <li key={i} className="text-sm text-foreground">• {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.requirements.gradingCriteria.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Grading criteria</h3>
                    <ul className="space-y-1.5">
                      {result.requirements.gradingCriteria.map((g, i) => (
                        <li key={i} className="text-sm text-foreground">• {g}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.requirements.unclearItems.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Unclear items</h3>
                    <ul className="space-y-1.5">
                      {result.requirements.unclearItems.map((u, i) => (
                        <li key={i} className="text-sm text-warning">⚠ {u}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Action plan */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" /> Action plan
              </h2>
              <p className="text-xs text-muted-foreground mb-4">Start with step 1 and work your way through.</p>
              <div className="space-y-3">
                {result.tasks.map((task, i) => (
                  <div key={i} className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border transition-colors',
                    i === 0 ? 'border-primary/30 bg-primary/5' : 'border-border'
                  )}>
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                        {i === 0 && <Badge className="bg-primary/10 text-primary text-xs">Start here</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {task.estimatedMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {saving ? 'Saving...' : 'Save assignment'}
              </Button>
              <Button variant="outline" onClick={() => setResult(null)}>
                Parse another
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
