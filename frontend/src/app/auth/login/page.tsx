"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-900/60 mb-4">
            <span className="text-xl font-black text-white">V</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sign in to Veritas</h1>
          <p className="text-slate-500 text-sm mt-1">Clinical Intelligence Agent</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">

          {/* Google Sign In */}
          <button
            onClick={() => router.push('/auth/login?method=google')}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-2.5 rounded-xl text-sm font-medium transition-all mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-slate-600"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800/60 text-red-400 text-xs px-3 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 mt-1"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-4">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Guest option */}
        <div className="mt-4 text-center">
          <Link
            href="/auth/guest"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Continue as guest (no history saved) →
          </Link>
        </div>

        {/* Legal */}
        <p className="text-center text-[10px] text-slate-700 mt-6 leading-relaxed">
          By signing in you agree to our Terms of Service and Privacy Policy.<br/>
          Data processed in accordance with GDPR (EU 2016/679).
        </p>
      </div>
    </div>
  );
}