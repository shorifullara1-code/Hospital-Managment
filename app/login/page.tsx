'use client'

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Lock, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    
    setError('');
    setLoading(true);

    // Timeout alert after 10 seconds if nothing happens
    const timeout = setTimeout(() => {
      if (loading) {
        setError('The request is taking longer than expected. Please check your Supabase connection.');
        setLoading(false);
      }
    }, 10000);

    try {
      console.log("Login attempt started");

      // Verify environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
          process.env.NEXT_PUBLIC_SUPABASE_URL === 'your-project-url' ||
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setError('Supabase connection details are missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in settings.');
        clearTimeout(timeout);
        setLoading(false);
        return;
      }

      const result = await login(username.trim(), password);
      clearTimeout(timeout);
      
      if (!result.success) {
        setError(result.error || 'Invalid credentials or database error.');
      }
    } catch (err: any) {
      clearTimeout(timeout);
      setError(`Login Error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from('staff').select('count', { count: 'exact', head: true });
      if (error) throw error;
      alert("Connection Successful: Staff table is accessible.");
    } catch (err: any) {
      console.error("Connection test failed:", err);
      alert(`Connection Failed: ${err.message}. Make sure the 'staff' table exists and RLS is configured.`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 font-sans">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4 text-primary">
            <div className="rounded-full bg-primary/10 p-3 shadow-inner">
              <Activity className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">MedCore Hospital Management</CardTitle>
          <CardDescription>
            Enter your credentials to access the secure system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username / ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="admin"
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In To Dashboard'}
            </Button>
          </form>
          <div className="mt-4 text-center">
             <Button variant="link" size="sm" onClick={checkConnection} type="button" className="text-xs text-muted-foreground">
               Troubleshoot Connection
             </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-xs text-center text-muted-foreground bg-muted/50 p-2 rounded w-full border">
            <p className="font-semibold mb-1">Demo Credentials:</p>
            <p>User: <span className="font-mono bg-background px-1">admin</span> | Pass: <span className="font-mono bg-background px-1">admin123</span></p>
          </div>
          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
            MedCore Security Service
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
