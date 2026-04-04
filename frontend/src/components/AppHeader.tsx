"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ProfileModal from '@/components/ProfileModal';
import Image from 'next/image';

interface AppHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function AppHeader({ sidebarCollapsed, onToggleSidebar }: AppHeaderProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [showModal,    setShowModal]    = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isGuest = !loading && !user;
  const initial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      <header className="h-14 w-full flex items-center justify-between px-4 bg-slate-900 border-b border-slate-800 shrink-0 z-20">
        {/* Left: sidebar toggle + brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5" />
              )}
            </svg>
          </button>

          <div className="h-6 w-px bg-slate-700/60" />

          <div className="flex items-center gap-3">
            <Image 
              src="/icon.svg" 
              alt="Veritas Logo" 
              width={38} 
              height={42} 
              className="shrink-0 drop-shadow-md rounded-lg" 
            />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-slate-100 tracking-widest uppercase">Veritas</span>
              <span className="text-[9px] text-blue-400/70 font-medium uppercase tracking-widest">Clinical Intelligence</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 border border-slate-700/60 rounded-full px-2.5 py-1 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400/80 font-semibold uppercase tracking-widest">Online</span>
          </div>
        </div>

        {/* Right: guest badge or profile */}
        <div className="flex items-center gap-2">
          {isGuest && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] text-slate-500 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
                Guest session
              </span>
              <button
                onClick={() => router.push('/auth/register')}
                className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-600/10 border border-blue-600/30 px-2.5 py-1 rounded-full transition-all font-medium"
              >
                Sign up to save history
              </button>
            </div>
          )}

          {/* Profile button */}
          <div ref={profileRef} className="relative">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : user ? (
              <>
                <button
                  onClick={() => setProfileOpen(p => !p)}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-900/40 hover:from-blue-400 hover:to-blue-600 transition-all ring-2 ${
                    profileOpen ? 'ring-blue-500/70' : 'ring-slate-700 hover:ring-blue-500/40'
                  }`}
                >
                  {initial}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-11 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/70 py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-slate-800">
                      <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setProfileOpen(false); setShowModal(true); }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors flex items-center gap-2.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      Account Settings
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => router.push('/auth/login')}
                className="text-xs text-blue-400 hover:text-blue-300 bg-blue-600/10 border border-blue-600/30 px-3 py-1.5 rounded-xl transition-all font-medium"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {showModal && <ProfileModal onClose={() => setShowModal(false)} />}
    </>
  );
}