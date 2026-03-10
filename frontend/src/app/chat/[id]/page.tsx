"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useChat } from '@/hooks/useChat';

export default function ChatPage() {
  const { id: sessionId } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const { askQuestion, uploadFile, loading } = useChat();

  useEffect(() => {
    const load = async () => {
      setMessages([]);
      const res = await fetch(`http://localhost:8000/sessions/${sessionId}/history`);
      if (res.ok) {
        const history = await res.json();
        setMessages(history.map((m: any) => ({ role: m.role, text: m.content })));
      }
    };
    if (sessionId) load();
  }, [sessionId]);

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const currentQuery = query;
    setMessages(prev => [...prev, { role: 'user', text: currentQuery }]);
    setQuery('');
    const data = await askQuestion(currentQuery, sessionId as string);
    setMessages(prev => [...prev, { role: 'assistant', text: data.response, sources: data.sources }]);
  };
  // ADDED: Handle upload within an existing chat
  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const data = await uploadFile(e.target.files[0], sessionId as string);
      if (data) alert(`Uploaded ${e.target.files[0].name} to this session.`);
    }
  };

return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      <Sidebar currentSessionId={sessionId} onSessionSelect={(id: string) => router.push(`/chat/${id}`)} onNewChat={() => router.push('/')} />
      <main className="flex-1 flex flex-col">
        {/* HEADER WITH UPLOAD BUTTON */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-mono text-slate-400">SESSION: {sessionId?.slice(0, 8)}</span>
          </div>
          
          <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all border border-slate-700">
            + ADD DOCUMENT
            <input type="file" className="hidden" onChange={handleInlineUpload} accept=".pdf" />
          </label>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl max-w-xl text-sm ${m.role === 'user' ? 'bg-blue-700 shadow-lg shadow-blue-900/20' : 'bg-slate-900 border border-slate-800'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-blue-500 animate-pulse text-xs italic px-2">Veritas is researching...</div>}
        </div>

        <div className="p-6 bg-slate-950/80 border-t border-slate-900">
          <div className="max-w-3xl mx-auto">
            <input 
               value={query} onChange={e => setQuery(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder="Continue the medical analysis..."
               className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl outline-none focus:ring-1 focus:ring-blue-600 transition-all"
            />
          </div>
        </div>
      </main>
    </div>
  );
}