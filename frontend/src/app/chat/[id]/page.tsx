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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      <Sidebar currentSessionId={sessionId} onSessionSelect={(id: string) => router.push(`/chat/${id}`)} onNewChat={() => router.push('/')} />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl max-w-xl text-sm ${m.role === 'user' ? 'bg-blue-700' : 'bg-slate-900 border border-slate-800'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-blue-500 animate-pulse text-xs italic">Veritas is thinking...</div>}
        </div>
        <div className="p-6 bg-slate-950/80 border-t border-slate-900">
           <input 
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Continue analysis..."
              className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl outline-none"
           />
        </div>
      </main>
    </div>
  );
}