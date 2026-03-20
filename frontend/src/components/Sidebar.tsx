"use client";
import { useEffect, useState } from 'react';
import { NEXT_PUBLIC_API_URL } from '../../config';
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

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${NEXT_PUBLIC_API_URL}/sessions`);
      
      // 1. Tell TypeScript data is an array of sessions
      const data: { id: string; title: string }[] = await res.json();
      
      // 2. Add types to the filter parameters
      const uniqueSessions = data.filter((session, index, self) =>
        index === self.findIndex((s) => s.id === session.id)
      );    
      
      setSessions(uniqueSessions);
    } catch (e) {
      console.error("Sidebar fetch error:", e);
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

  return (
    <aside
      className={`flex flex-col bg-slate-900 border-r border-slate-800 h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
        collapsed ? "w-[56px]" : "w-60"
      }`}
    >
      {/* ── New Chat button ── */}
      <div className="p-3 shrink-0">
        {collapsed ? (
          <button
            onClick={onNewChat}
            title="New Chat"
            className="w-8 h-8 mx-auto flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onNewChat}
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
        {/* Expanded state */}
        {!collapsed && (
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
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all pr-8 ${
                      isActive
                        ? "bg-blue-600/15 text-blue-300 border border-blue-500/30"
                        : "text-slate-400 hover:bg-slate-800/70 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-600"}`}
                      >
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

        {/* Collapsed state — icon-only list, tightly packed from top */}
        {collapsed && (
          <div className="flex flex-col items-center gap-1 py-3 px-1.5">
            {sessions.map((session) => {
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
  );
}