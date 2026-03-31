"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router  = useRouter();
  // Extract googleLogin from the hook
  const { register, googleLogin } = useAuth(); 
  
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  // Added: Google Success Handler
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      await googleLogin(credentialResponse.credential);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(email, name, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-emerald-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            We sent a verification link to <strong className="text-slate-200">{email}</strong>.<br/>
            Click the link in the email to activate your account.
          </p>
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-900/60 mb-4">
            <span className="text-xl font-black text-white">V</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Create an account</h1>
          <p className="text-slate-500 text-sm mt-1">Clinical Intelligence Agent</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          
          {/* Added: Google Sign Up Button */}
          <div className="w-full flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Sign-up failed")}
              theme="filled_black"
              shape="pill"
              text="signup_with"
            />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600">or sign up with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Dr. Jane Smith"
                required
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-slate-600"
              />
            </div>
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
                placeholder="Min. 8 characters"
                required
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-slate-600"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800/60 text-red-400 text-xs px-3 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex items-start gap-3 pt-1">
              <input type="checkbox" required id="gdpr" className="mt-0.5 accent-blue-600 shrink-0" />
              <label htmlFor="gdpr" className="text-[11px] text-slate-500 leading-relaxed cursor-pointer">
                I agree to the{' '}
                <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>
                {' '}and{' '}
                <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link>
                . I understand my data will be processed in accordance with GDPR (EU 2016/679).
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 mt-1"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <Link href="/auth/guest" className="block text-center text-xs text-slate-600 hover:text-slate-400 transition-colors mt-4">
          Continue as guest (no history saved) →
        </Link>
      </div>
    </div>
  );
}