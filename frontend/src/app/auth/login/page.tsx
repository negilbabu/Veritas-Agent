"use client";
import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Toast from '@/components/Toast';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  // const { login } = useAuth();
  const { login, googleLogin } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [toast, setToast] = useState<string | null>(null);


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
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      // credentialResponse.credential is the id_token needed by your backend
      await googleLogin(credentialResponse.credential);
      router.push('/');
    } catch (err: any) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-900/60 mb-4">
            <span className="text-xl font-black text-white">V</span>
          </div> */}
          <Image 
            src="/veritas.svg" 
            alt="Veritas Logo" 
            width={48} 
            height={48} 
            className="mx-auto mb-6 drop-shadow-lg" 
          />
          <h1 className="text-2xl font-black text-white tracking-tight">Sign in to Veritas</h1>
          <p className="text-slate-500 text-sm mt-1">Clinical Intelligence Agent</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">

          {/* Google Sign In */}
          <div className="w-full flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setToast("Google Login Failed")}
              theme="filled_black"
              shape="pill"
            />
          </div>
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