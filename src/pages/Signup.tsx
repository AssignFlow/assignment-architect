import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) return;
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Check your email to confirm, or log in now.');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <FileText className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-foreground">AssignFlow</span>
        </Link>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Start turning assignments into action plans.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Alex Johnson" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
