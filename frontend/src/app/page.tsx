"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useChat } from '@/hooks/useChat';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { askQuestion, uploadFile, loading } = useChat();

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const data = await askQuestion(query, undefined);
    if (data.session_id) router.push(`/chat/${data.session_id}`);
  };

  const handleUpload = async (e: any) => {
    if (e.target.files?.[0]) {
      const data = await uploadFile(e.target.files[0], undefined);
      if (data.session_id) router.push(`/chat/${data.session_id}`);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      <Sidebar onNewChat={() => router.push('/')} onSessionSelect={(id: string) => router.push(`/chat/${id}`)} />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-black text-blue-600 mb-4 tracking-tighter">VERITAS</h1>
        <p className="text-slate-500 mb-8 font-mono text-sm">Clinical Intelligence Agent</p>
        
        <div className="w-full max-w-2xl space-y-4">
          <div className="relative group">
            <input 
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask a medical question to begin..."
              className="w-full bg-slate-900 border border-slate-800 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-2xl"
            />
            <button onClick={handleSend} className="absolute right-4 top-4 bg-blue-600 p-1.5 rounded-lg">↑</button>
          </div>
          
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-800 rounded-2xl hover:border-blue-500/50 cursor-pointer transition-all">
            <span className="text-xs text-slate-500">Or drop a PDF to initialize session</span>
            <input type="file" className="hidden" onChange={handleUpload} accept=".pdf" />
          </label>
        </div>
      </main>
    </div>
  );
}