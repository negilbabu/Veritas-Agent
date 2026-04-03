"use client";
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { NEXT_PUBLIC_API_URL } from '../../../../config';

type Status = 'loading' | 'success' | 'error' | 'already';

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
        // Strip any accidental trailing slashes from your .env variable to prevent //auth/verify
        const cleanApiUrl = NEXT_PUBLIC_API_URL.replace(/\/$/, '');
        const res  = await fetch(`${cleanApiUrl}/auth/verify?token=${token}`);
        
        // Prevent fatal JSON parse crash if server returns an HTML 502/503 error
        const contentType = res.headers.get("content-type");
        if (contentType && !contentType.includes("application/json")) {
           throw new Error("The server is currently unavailable. Please try again.");
        }

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          // PREVENT REACT CRASH: Ensure the message is ALWAYS a string, never an Object/Array
          let errMsg = 'Verification failed. The link may have expired.';
          if (typeof data.detail === 'string') {
            errMsg = data.detail;
          } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
            errMsg = data.detail[0].msg; // Catches FastAPI 422 Validation Arrays
          }
          setMessage(errMsg);
          return;
        }

        if (data.already_verified) {
          setStatus('already');
          return;
        }

        if (data.access_token) {
          try {
            localStorage.setItem('veritas_token', data.access_token);
            localStorage.setItem('veritas_user', JSON.stringify(data.user));
          } catch (storageError) {
             // Prevents crash if user opens link in a strict in-app browser (like Gmail on iOS)
            console.error("Local storage is disabled or full");
          }
        }

        setStatus('success');
        setTimeout(() => router.push('/'), 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred while verifying.');
      }
    };

    verify();
  }, [searchParams, router]);

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