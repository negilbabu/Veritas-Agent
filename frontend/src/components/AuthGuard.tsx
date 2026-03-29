"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/verify', '/auth/guest'];

export default function AuthGuard({ children }: AuthGuardProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Guest session check — must be client-side only (sessionStorage is not available in SSR)
  const [guestSession, setGuestSession] = useState<string | null>(null);

  useEffect(() => {
    setGuestSession(sessionStorage.getItem('guest_session_id'));
  }, [pathname]);

  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const isChatPath   = pathname.startsWith('/chat/');
  const isGuestChat  = isChatPath && guestSession && pathname.includes(guestSession);

  useEffect(() => {
    if (loading) return;
    if (isPublicPath || isGuestChat || user) return;
    router.push('/auth/login');
  }, [loading, user, pathname, isGuestChat]);

  // Show spinner while rehydrating auth state from localStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}