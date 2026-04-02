import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, Sparkles, Clock, BarChart3, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { useState } from 'react';
import Logo from '@/components/Logo';

const steps = [
  { icon: FileText, title: 'Paste your assignment', desc: 'Copy and paste the instructions, rubric, or syllabus section exactly as given.' },
  { icon: Sparkles, title: 'Get a structured plan', desc: 'AssignFlow breaks it down into clear requirements, subtasks, and a timeline.' },
  { icon: CheckCircle2, title: 'Start working', desc: 'Follow the action plan step by step. Check off tasks as you go.' },
];

const useCases = [
  { title: 'Essays & Papers', desc: 'Turn a 2-page prompt into a clear outline with research, draft, and revision steps.' },
  { title: 'Lab Reports', desc: 'Break down complex lab procedures into manageable phases with time estimates.' },
  { title: 'Programming Projects', desc: 'Decompose coding assignments into implementation tasks with suggested order.' },
  { title: 'Group Presentations', desc: 'Split the workload, assign sections, and plan rehearsal time.' },
];

const faqs = [
  { q: 'How does AssignFlow work?', a: 'Paste your assignment instructions and AssignFlow analyzes the text to extract requirements, create subtasks, estimate effort, and generate a step-by-step action plan.' },
  { q: 'Is it free to use?', a: 'Yes! AssignFlow is free for students. Sign up with your email and start parsing assignments right away.' },
  { q: 'Does it work with any assignment type?', a: 'AssignFlow works with essays, lab reports, programming assignments, reading responses, presentations, and more.' },
  { q: 'Can I edit the generated plan?', a: 'Absolutely. You can edit tasks, reorder steps, change time estimates, and add your own custom tasks.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-semibold text-foreground">AssignFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 lg:py-32 px-4">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Paste your assignment.{' '}
            <span className="text-primary">Get the plan.</span>
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AssignFlow turns prompts, rubrics, and syllabus instructions into clear step-by-step action plans so you know exactly what to do next.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="px-8 text-base">
                Try it free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="px-8 text-base">
                See how it works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Preview mockup */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-border bg-card p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-destructive/40" />
              <div className="h-3 w-3 rounded-full bg-warning/40" />
              <div className="h-3 w-3 rounded-full bg-success/40" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Requirements extracted', 'Tasks created', 'Timeline ready'].map((label) => (
                  <div key={label} className="rounded-lg bg-accent p-4 text-center">
                    <CheckCircle2 className="h-5 w-5 mx-auto text-primary mb-2" />
                    <span className="text-sm font-medium text-accent-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-secondary/30 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">How it works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Three simple steps to go from overwhelmed to organized.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="text-center">
                <div className="mx-auto h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">Works for any assignment</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            No matter the subject or format, AssignFlow helps you break it down.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {useCases.map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 hover:shadow-sm transition-shadow">
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-secondary/30 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map(({ q, a }, i) => (
              <div key={q} className="rounded-xl border border-border bg-card">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-foreground">{q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to stop stressing?</h2>
          <p className="text-muted-foreground mb-8">Sign up free and parse your first assignment in under a minute.</p>
          <Link to="/signup">
            <Button size="lg" className="px-8 text-base">
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" />
            <span className="text-sm font-medium text-foreground">AssignFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} AssignFlow. Built for students who want clarity.</p>
        </div>
      </footer>
    </div>
  );
}
