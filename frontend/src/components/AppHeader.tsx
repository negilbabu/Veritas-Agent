"use client";
import { useState, useRef, useEffect } from 'react';

interface AppHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function AppHeader({ sidebarCollapsed, onToggleSidebar }: AppHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
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

  return (
    <header className="h-14 w-full flex items-center justify-between px-4 bg-slate-900 border-b border-slate-800 shrink-0 z-20">
      {/* Left: sidebar toggle + brand */}
      <div className="flex items-center gap-3">
        {/* Sidebar toggle — inside header, aligned left */}
        <button
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-all"
        >
          {/* Hamburger / arrow icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-5 h-5"
          >
            {sidebarCollapsed ? (
              // Three-line menu when collapsed
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            ) : (
              // Sidebar-close icon when expanded
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5" />
            )}
          </svg>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-700/60" />

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50 shrink-0">
            <span className="text-[11px] font-black text-white tracking-tight">V</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-slate-100 tracking-widest uppercase">Veritas</span>
            <span className="text-[9px] text-blue-400/70 font-medium uppercase tracking-widest">Clinical Intelligence</span>
          </div>
        </div>

        {/* Live badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 border border-slate-700/60 rounded-full px-2.5 py-1 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-emerald-400/80 font-semibold uppercase tracking-widest">Online</span>
        </div>
      </div>

      {/* Right: profile */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => setProfileOpen(p => !p)}
          className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-900/40 hover:from-blue-400 hover:to-blue-600 transition-all ring-2 ${
            profileOpen ? 'ring-blue-500/70' : 'ring-slate-700 hover:ring-blue-500/40'
          }`}
        >
          U
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-11 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/70 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-2.5 border-b border-slate-800">
              <p className="text-xs font-semibold text-slate-200">Signed in as</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">user@veritas.ai</p>
            </div>
            <button className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button className="w-full text-left px-4 py-2.5 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5 rounded-b-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}