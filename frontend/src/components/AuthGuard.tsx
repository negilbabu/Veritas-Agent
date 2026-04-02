"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/guest', '/auth/verify'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Use state to prevent Server/Client Hydration Mismatches
  const [isGuest, setIsGuest] = useState<boolean | null>(null);

  useEffect(() => {
    // This only runs on the browser, safely checking sessionStorage
    setIsGuest(!!sessionStorage.getItem('guest_session_id'));
  }, [pathname]);

  useEffect(() => {
    // Wait until both context and guest state are loaded
    if (loading || isGuest === null) return;

    const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));

    // RULE 1: If not logged in, not a guest, and trying to access a private path -> Login
    if (!user && !isGuest && !isPublicPath) {
      router.push('/auth/login');
    }

    // RULE 2: If logged in and trying to access login/register -> Home
    if (user && isPublicPath && pathname !== '/auth/verify') {
      router.push('/');
    }
  }, [user, loading, isGuest, pathname, router]);

  // Prevent flashing of protected content while checking state
  if (loading || isGuest === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}