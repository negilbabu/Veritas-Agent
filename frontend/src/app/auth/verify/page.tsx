"use client";
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { NEXT_PUBLIC_API_URL } from '../../../../config';

type Status = 'loading' | 'success' | 'error' | 'already';

// Inner component that uses useSearchParams — must be wrapped in Suspense
function VerifyInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [status,  setStatus]  = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    const verify = async () => {
      try {
        const res  = await fetch(`${NEXT_PUBLIC_API_URL}/auth/verify?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setMessage(data.detail || 'Verification failed. The link may have expired.');
          return;
        }

        if (data.already_verified) {
          setStatus('already');
          return;
        }

        if (data.access_token) {
          localStorage.setItem('veritas_token', data.access_token);
          localStorage.setItem('veritas_user', JSON.stringify(data.user));
        }

        setStatus('success');
        setTimeout(() => router.push('/'), 2000);
      } catch {
        setStatus('error');
        setMessage('An unexpected error occurred.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-900/60 mx-auto mb-6">
          <span className="text-xl font-black text-white">V</span>
        </div>

        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Verifying your email…</h2>
            <p className="text-slate-500 text-sm">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email verified!</h2>
            <p className="text-slate-400 text-sm">Your account is now active. Redirecting you to Veritas…</p>
          </>
        )}

        {status === 'already' && (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Already verified</h2>
            <p className="text-slate-400 text-sm mb-5">Your email is already verified.</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            >
              Sign In
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verification failed</h2>
            <p className="text-slate-400 text-sm mb-5">{message}</p>
            <button
              onClick={() => router.push('/auth/register')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            >
              Register again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Outer page wraps inner in Suspense — required by Next.js for useSearchParams
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyInner />
    </Suspense>
  );
}