"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Guest Mode — creates an ephemeral session stored in sessionStorage only.
 * No token → backend excludes from /sessions → destroyed when tab closes.
 */
export default function GuestPage() {
  const router = useRouter();

  useEffect(() => {
    // Reuse existing guest session or create a new UUID
    let guestSessionId = sessionStorage.getItem('guest_session_id');
    if (!guestSessionId) {
      // Generate UUID without external library
      guestSessionId = crypto.randomUUID();
      sessionStorage.setItem('guest_session_id', guestSessionId);
    }
    router.replace(`/chat/${guestSessionId}`);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Starting guest session…</p>
      </div>
    </div>
  );
}