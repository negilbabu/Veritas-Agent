"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import Toast from '@/components/Toast';
import { useChat } from '@/hooks/useChat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const { id: sessionId } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, uploading]);

  const showToast = (message: string) => {
    setToast(null);
    setTimeout(() => setToast(message), 10);
  };

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const currentQuery = query;
    setMessages(prev => [...prev, { role: 'user', text: currentQuery }]);
    setQuery('');
    const data = await askQuestion(currentQuery, sessionId as string);
    setMessages(prev => [...prev, { role: 'assistant', text: data.response, sources: data.sources }]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(true);
    try {
      const data = await uploadFile(file, sessionId as string);
      if (data) {
        showToast(`Successfully analyzed: ${file.name}`);
        setMessages(prev => [
          ...prev,
          { role: 'system', text: `📎 Document analyzed: ${file.name}` },
          { role: 'assistant', text: data.assistant_greeting },
        ]);
      }
    } catch (err) {
      showToast(`Failed to upload: ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  const isBusy = loading || uploading;

  return (
    /*
      Layout shell:
        ┌────────────────────────────────┐
        │         AppHeader (h-14)       │  ← full width, always visible
        ├──────────┬─────────────────────┤
        │          │                     │
        │ Sidebar  │    Chat content     │  ← fills remaining height
        │          │                     │
        └──────────┴─────────────────────┘
    */
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">

      {/* ── Full-width header ── */}
      <AppHeader
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(p => !p)}
      />

      {/* ── Body row: sidebar + content ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar sits flush under header, no floating toggle button needed */}
        <Sidebar
          currentSessionId={sessionId}
          onSessionSelect={(id: string) => router.push(`/chat/${id}`)}
          onNewChat={() => router.push('/')}
          collapsed={sidebarCollapsed}
        />

        {/* ── Main chat area ── */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {toast && <Toast message={toast} onClose={() => setToast(null)} />}

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.map((m, i) => {
              // System (file upload notice) — right side
              if (m.role === 'system') {
                const filename = m.text.replace('📎 Document analyzed: ', '');
                return (
                  <div key={i} className="flex justify-end">
                    <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-800/50 text-blue-300 px-3.5 py-2 rounded-2xl rounded-tr-sm max-w-[75%] sm:max-w-[65%] lg:max-w-[55%]">
                      <div className="shrink-0 w-7 h-8 bg-blue-900/60 border border-blue-700/50 rounded flex flex-col items-center justify-center gap-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-blue-400">
                          <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                          <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                        </svg>
                        <span className="text-[7px] font-bold text-blue-500 tracking-wide">PDF</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-blue-400/70 font-medium uppercase tracking-wider leading-none mb-0.5">Document uploaded</p>
                        <p className="text-xs text-blue-200 font-medium truncate">{filename}</p>
                      </div>
                    </div>
                  </div>
                );
              }

              // User bubble — right
              if (m.role === 'user') {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[75%] sm:max-w-[65%] lg:max-w-[55%] bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-lg shadow-blue-900/30 whitespace-pre-wrap break-words">
                      {m.text}
                    </div>
                  </div>
                );
              }

              // Assistant bubble — left
              return (
                <div key={i} className="flex justify-start gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-blue-400">V</span>
                  </div>
                  <div className="max-w-[75%] sm:max-w-[65%] lg:max-w-[55%] bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-md break-words">
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-headings:text-slate-100 prose-headings:font-semibold prose-strong:text-slate-100 prose-code:text-blue-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>
                    {m.sources?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                        {m.sources.map((s: string, si: number) => (
                          <span key={si} className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Upload loader */}
            {uploading && (
              <div className="flex justify-start gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-blue-400">V</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2.5">
                  <svg className="animate-spin w-3.5 h-3.5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 100 24v-4l-3 3 3 3v4A12 12 0 014 12z" />
                  </svg>
                  <span className="text-xs text-slate-400 italic">Analyzing document...</span>
                </div>
              </div>
            )}

            {/* Thinking loader */}
            {loading && !uploading && (
              <div className="flex justify-start gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-blue-400">V</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input bar + disclaimer ── */}
          <div className="px-4 pt-3 bg-slate-950/90 backdrop-blur border-t border-slate-800/80">
            <div className="max-w-3xl mx-auto relative flex items-center">
              <label className={`absolute left-4 transition-colors z-10 ${uploading ? 'text-blue-400 cursor-not-allowed' : 'cursor-pointer text-slate-500 hover:text-blue-400'}`}>
                {uploading ? (
                  <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 100 24v-4l-3 3 3 3v4A12 12 0 014 12z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                )}
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" disabled={uploading} />
              </label>

              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask Veritas about your documents..."
                disabled={isBusy}
                className="w-full bg-slate-900 border border-slate-800 pl-12 pr-12 py-3.5 rounded-2xl text-sm outline-none focus:ring-1 focus:ring-blue-600 transition-all shadow-inner disabled:opacity-50 placeholder:text-slate-600"
              />

              <button
                onClick={handleSend}
                disabled={isBusy || !query.trim()}
                className="absolute right-3 text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-[10px] text-slate-600 py-2.5 max-w-2xl mx-auto leading-relaxed">
              Veritas may produce inaccurate information. Always verify clinical decisions with qualified medical professionals.
              Not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}