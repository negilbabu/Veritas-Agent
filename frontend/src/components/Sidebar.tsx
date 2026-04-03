"use client";
import { useEffect, useState } from 'react';
import { NEXT_PUBLIC_API_URL } from '../../config';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ConfirmModal from './ConfirmModal'; 

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
  
  // Modals state
  const [showGuestModal, setShowGuestModal] = useState(false); 
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null); // Track ID for deletion
  
  const { user } = useAuth();
  const router = useRouter();

  const handleNewChatClick = () => {
    if (!user) {
      setShowGuestModal(true);
      return;
    }
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

  // Triggered when trash icon is clicked
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(id);
  };

  // Called after confirmation in the modal
  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    
    try {
      await fetch(`${NEXT_PUBLIC_API_URL}/sessions/${sessionToDelete}`, { method: "DELETE" });
      if (sessionToDelete === currentSessionId) onNewChat();
      fetchSessions();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setSessionToDelete(null);
    }
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

        <div className="mx-3 border-t border-slate-800 shrink-0" />

        {/* ── Session list ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!collapsed && (
            <>
              {loadingSessions ? (
                <SkeletonRows />
              ) : (
                <div className="px-2 py-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2 mb-2">History</p>
                  {sessions.map((session) => {
                    const isActive = currentSessionId === session.id;
                    return (
                      <div key={session.id} className="group relative mb-0.5">
                        <button
                          onClick={() => onSessionSelect(session.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all pr-8 ${
                            isActive ? "bg-blue-600/15 text-blue-300 border border-blue-500/30" : "text-slate-400 hover:bg-slate-800/70 border border-transparent"
                          }`}
                        >
                          <span className="truncate block">{session.title}</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(session.id, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded-lg"
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
        </div>
      </aside>

      {/* ── 3-Button Guest Modal ── */}
      <ConfirmModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        title="Save your chat history?"
        description="Starting a new chat will permanently erase your current guest session. Register a free account to save this conversation."
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
        actions={[
          {
            label: "Register & Save Chat",
            variant: "primary",
            onClick: () => {
              setShowGuestModal(false);
              router.push('/auth/register');
            }
          },
          {
            label: "Erase & Start New",
            variant: "danger",
            onClick: () => {
              sessionStorage.removeItem('guest_session_id');
              setShowGuestModal(false);
              onNewChat();
            }
          },
          {
            label: "Cancel (Stay here)",
            variant: "ghost",
            onClick: () => setShowGuestModal(false)
          }
        ]}
      />

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmModal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        title="Delete Chat?"
        description="This will permanently delete this conversation and all associated medical data from our servers. This action cannot be undone."
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        }
        actions={[
          {
            label: "Permanently Delete",
            variant: "danger",
            onClick: handleConfirmDelete
          },
          {
            label: "Keep Chat",
            variant: "ghost",
            onClick: () => setSessionToDelete(null)
          }
        ]}
      />
    </>
  );
}