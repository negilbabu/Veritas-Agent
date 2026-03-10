"use client";
import { useEffect, useState } from 'react';

export default function Sidebar({ currentSessionId, onSessionSelect, onNewChat }: any) {
  const [sessions, setSessions] = useState<string[]>([]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:8000/sessions");
      const data = await res.json();
      setSessions(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]);

  const handleDelete = async (id: string, e: any) => {
    e.stopPropagation();
    if (!confirm("Delete Chat?")) return;
    await fetch(`http://localhost:8000/sessions/${id}`, { method: 'DELETE' });
    if (id === currentSessionId) onNewChat();
    fetchSessions();
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-full flex flex-col">
      <div className="p-4">
        <button onClick={onNewChat} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold transition-all text-sm">+ New Chat</button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2 mb-2">History</p>
        {sessions.map(id => (
          <div key={id} className="group relative mb-1">
            <button 
              onClick={() => onSessionSelect(id)}
              className={`w-full text-left p-3 text-xs rounded-lg truncate pr-8 ${currentSessionId === id ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50'}`}
            >
              Chat: {id.slice(0, 18)}...
            </button>
            <button onClick={(e) => handleDelete(id, e)} className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all text-xs">🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}