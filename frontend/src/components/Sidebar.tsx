"use client";
import { useEffect, useState } from 'react';
import { NEXT_PUBLIC_API_URL } from '../../config';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  currentSessionId?: any;
  onSessionSelect: (id: string) => void;
  onNewChat: () => void;
  collapsed: boolean;
}

export default function Sidebar({
  currentSessionId,
  onSessionSelect,
  onNewChat,
  collapsed,
}: SidebarProps) {
  const [sessions, setSessions] = useState<{ id: string; title: string }[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  
  // NEW: State to control our custom guest warning modal
  const [showGuestModal, setShowGuestModal] = useState(false); 
  
  const { user } = useAuth();
  const router = useRouter();

  const handleNewChatClick = () => {
    // If not logged in, show the custom modal instead of the browser alert
    if (!user) {
      setShowGuestModal(true);
      return;
    }
    
    // Normal behavior for logged-in users
    onNewChat();
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const token = localStorage.getItem('veritas_token');
      const headers: Record<string, string> = token 
        ? { "Authorization": `Bearer ${token}` } 
        : {};

      const res = await fetch(`${NEXT_PUBLIC_API_URL}/sessions`, { headers });
      const data: { id: string; title: string }[] = await res.json();
      setSessions(data);
    } catch (e) {
      console.error("Sidebar fetch error:", e);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    await fetch(`${NEXT_PUBLIC_API_URL}/sessions/${id}`, { method: "DELETE" });
    if (id === currentSessionId) onNewChat();
    fetchSessions();
  };

  const SkeletonRows = () => (
    <div className="px-2 py-3 space-y-1.5">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-9 rounded-xl bg-slate-800/60 animate-pulse"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );

  return (
    <>
      <aside
        className={`flex flex-col bg-slate-900 border-r border-slate-800 h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          collapsed ? "w-[56px]" : "w-60"
        }`}
      >
        {/* ── New Chat button ── */}
        <div className="p-3 shrink-0">
          {collapsed ? (
            <button
              onClick={handleNewChatClick}
              title="New Chat"
              className="w-8 h-8 mx-auto flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleNewChatClick}
              className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-bold transition-all text-sm tracking-wide"
            >
              + New Chat
            </button>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="mx-3 border-t border-slate-800 shrink-0" />

        {/* ── Session list ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!collapsed && (
            <>
              {loadingSessions ? (
                <SkeletonRows />
              ) : (
                <div className="px-2 py-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2 mb-2">
                    History
                  </p>
                  {sessions.length === 0 && (
                    <p className="text-xs text-slate-600 italic px-3 py-2">No chats yet</p>
                  )}
                  {sessions.map((session) => {
                    const isActive = currentSessionId === session.id;
                    return (
                      <div key={session.id} className="group relative mb-0.5">
                        <button
                          onClick={() => onSessionSelect(session.id)}
                          title={session.title}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all pr-8 ${
                            isActive
                              ? "bg-blue-600/15 text-blue-300 border border-blue-500/30"
                              : "text-slate-400 hover:bg-slate-800/70 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-600"}`}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                            <span className="truncate font-medium leading-snug">{session.title}</span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleDelete(session.id, e)}
                          title="Delete chat"
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 rounded-lg hover:bg-red-500/10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {collapsed && (
            <div className="flex flex-col items-center gap-1 py-3 px-1.5">
              {loadingSessions
                ? [...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-xl bg-slate-800/60 animate-pulse" />
                  ))
                : sessions.map((session) => {
                    const isActive = currentSessionId === session.id;
                    return (
                      <button
                        key={session.id}
                        onClick={() => onSessionSelect(session.id)}
                        title={session.title}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                          isActive
                            ? "bg-blue-600/20 border border-blue-500/40 text-blue-400"
                            : "text-slate-600 hover:bg-slate-800 hover:text-slate-400 border border-transparent"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                      </button>
                    );
                  })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Custom Guest Warning Modal ── */}
      {showGuestModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">Save your chat history?</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Starting a new chat will permanently erase your current guest session. Register a free account to save this conversation.
            </p>
            
            <div className="flex flex-col gap-2.5">
              {/* Option 1: Register and Save */}
              <button 
                onClick={() => {
                  setShowGuestModal(false);
                  router.push('/auth/register');
                }} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-900/20"
              >
                Register & Save Chat
              </button>
              
              {/* Option 2: Erase and Start New */}
              <button 
                onClick={() => {
                  sessionStorage.removeItem('guest_session_id');
                  setShowGuestModal(false);
                  router.push('/auth/guest');
                }} 
                className="w-full bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 font-bold py-2.5 rounded-xl text-sm transition-all border border-transparent hover:border-red-500/30"
              >
                Erase & Start New
              </button>
              
              {/* Option 3: Cancel (The missing piece!) */}
              <button 
                onClick={() => setShowGuestModal(false)} 
                className="w-full text-slate-500 hover:text-slate-300 py-2 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}