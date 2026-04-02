import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, ArrowLeft, GraduationCap, BookOpen, Brain, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

const studentTypes = [
  { value: 'high_school', label: 'High School' },
  { value: 'college', label: 'College' },
  { value: 'grad', label: 'Graduate' },
  { value: 'other', label: 'Other' },
] as const;

const helpTopics = [
  { value: 'essays', label: 'Essays & Papers' },
  { value: 'labs', label: 'Lab Reports' },
  { value: 'reading', label: 'Reading Responses' },
  { value: 'programming', label: 'Programming' },
  { value: 'projects', label: 'Projects' },
  { value: 'applications', label: 'Applications' },
];

const struggles = [
  { value: 'getting_started', label: 'Getting started' },
  { value: 'understanding_prompt', label: 'Understanding the prompt' },
  { value: 'planning', label: 'Planning the work' },
  { value: 'managing_time', label: 'Managing time' },
  { value: 'remembering_deadlines', label: 'Remembering deadlines' },
];

const planningStyles = [
  { value: 'simple_checklist', label: 'Simple checklist', desc: 'Just tell me what to do' },
  { value: 'daily_schedule', label: 'Daily schedule', desc: 'Break it into days' },
  { value: 'detailed_plan', label: 'Detailed step-by-step', desc: 'Give me everything' },
] as const;

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [studentType, setStudentType] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [struggle, setStruggle] = useState('');
  const [planStyle, setPlanStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 4;

  const toggleTopic = (val: string) => {
    setSelectedTopics(prev => prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]);
  };

  const canNext = () => {
    if (step === 0) return !!studentType;
    if (step === 1) return selectedTopics.length > 0;
    if (step === 2) return !!struggle;
    if (step === 3) return !!planStyle;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.from('profiles').update({
        student_type: studentType as any,
      }).eq('user_id', user.id);

      await supabase.from('user_preferences').update({
        help_topics: selectedTopics,
        biggest_struggle: struggle,
        planning_style: planStyle as any,
        onboarding_completed: true,
      }).eq('user_id', user.id);

      navigate('/parse');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Logo className="h-8 w-8" />
          <span className="text-xl font-semibold text-foreground">AssignFlow</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {step === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">What type of student are you?</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">This helps us tailor your experience.</p>
              <div className="grid grid-cols-2 gap-3">
                {studentTypes.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setStudentType(value)}
                    className={cn(
                      'rounded-lg border p-3 text-sm font-medium transition-colors text-left',
                      studentType === value ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-secondary text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">What do you need help with?</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Select all that apply.</p>
              <div className="grid grid-cols-2 gap-3">
                {helpTopics.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => toggleTopic(value)}
                    className={cn(
                      'rounded-lg border p-3 text-sm font-medium transition-colors text-left',
                      selectedTopics.includes(value) ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-secondary text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">What's your biggest struggle?</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">We'll focus on helping you here first.</p>
              <div className="space-y-2">
                {struggles.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setStruggle(value)}
                    className={cn(
                      'w-full rounded-lg border p-3 text-sm font-medium transition-colors text-left',
                      struggle === value ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-secondary text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ListChecks className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Preferred planning style?</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">You can always change this later.</p>
              <div className="space-y-2">
                {planningStyles.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setPlanStyle(value)}
                    className={cn(
                      'w-full rounded-lg border p-4 text-left transition-colors',
                      planStyle === value ? 'border-primary bg-accent' : 'border-border hover:bg-secondary'
                    )}
                  >
                    <div className="text-sm font-medium text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : <div />}

            {step < totalSteps - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canNext()}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleFinish} disabled={!canNext() || loading}>
                {loading ? 'Saving...' : 'Start parsing'} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
