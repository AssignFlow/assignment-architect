import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [prefs, setPrefs] = useState<Tables<'user_preferences'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [sessionLength, setSessionLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [weekStart, setWeekStart] = useState('monday');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    ]).then(([pRes, prRes]) => {
      setProfile(pRes.data);
      setPrefs(prRes.data);
      if (pRes.data) {
        setFullName(pRes.data.full_name || '');
        setSchool(pRes.data.school || '');
      }
      if (prRes.data) {
        setSessionLength(prRes.data.default_session_length);
        setBreakLength(prRes.data.break_length);
        setWeekStart(prRes.data.week_start);
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({ full_name: fullName, school }).eq('user_id', user.id);
      await supabase.from('user_preferences').update({
        default_session_length: sessionLength,
        break_length: breakLength,
        week_start: weekStart,
        theme,
      }).eq('user_id', user.id);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
    setSaving(false);
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

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">Manage your profile and preferences.</p>

        <div className="space-y-8">
          {/* Profile */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="mt-1.5 bg-muted" />
              </div>
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="school">School</Label>
                <Input id="school" placeholder="e.g. University of Michigan" value={school} onChange={e => setSchool(e.target.value)} className="mt-1.5" />
              </div>
            </div>
          </section>

          {/* Theme */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Appearance</h2>
            <div className="flex gap-3">
              {[
                { value: 'light' as const, label: 'Light', icon: Sun },
                { value: 'dark' as const, label: 'Dark', icon: Moon },
                { value: 'system' as const, label: 'System', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    theme === value ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-secondary text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </section>

          {/* Planning */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Planning preferences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Work session (min)</Label>
                <Input type="number" min={5} max={120} value={sessionLength} onChange={e => setSessionLength(Number(e.target.value))} className="mt-1.5" />
              </div>
              <div>
                <Label>Break length (min)</Label>
                <Input type="number" min={1} max={30} value={breakLength} onChange={e => setBreakLength(Number(e.target.value))} className="mt-1.5" />
              </div>
              <div>
                <Label>Week starts on</Label>
                <Select value={weekStart} onValueChange={setWeekStart}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save changes
            </Button>
            <Button variant="outline" onClick={() => signOut()} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
