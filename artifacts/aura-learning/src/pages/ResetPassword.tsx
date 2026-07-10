import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { GraduationCap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const BASE_URL = (import.meta.env.BASE_URL ?? '').replace(/\/$/, '');

export default function ResetPassword() {
  const [, setLocation] = useLocation();

  // Read token from URL query string
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-sm text-center shadow-xl">
          <CardContent className="pt-8 pb-6 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <p className="font-bold text-lg">Invalid reset link</p>
            <p className="text-sm text-muted-foreground">This link is missing the reset token. Please request a new password reset.</p>
            <Button className="w-full" onClick={() => setLocation('/')}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Reset failed.');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-3 text-primary">
          <GraduationCap className="w-8 h-8" />
          <h1 className="text-2xl font-black tracking-tight">AuraLearning <span className="text-accent">Elite</span></h1>
        </div>

        <Card className="shadow-xl border-border/50">
          {success ? (
            <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="font-bold text-lg">Password updated!</p>
                <p className="text-sm text-muted-foreground mt-1">You can now log in with your new password.</p>
              </div>
              <Button className="w-full font-bold" onClick={() => setLocation('/')}>
                Go to Login
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Set a new password</CardTitle>
                <CardDescription>Choose a strong password for your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="bg-muted/30 focus-visible:bg-transparent transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repeat your password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    className="bg-muted/30 focus-visible:bg-transparent transition-colors"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full font-bold h-11" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Update Password'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
