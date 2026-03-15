
"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import Toast from '@/components/Toast';
import { useChat } from '@/hooks/useChat';
import { NEXT_PUBLIC_API_URL } from '../../config';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { askQuestion, uploadFile, loading } = useChat();

  const showToast = (message: string) => {
    setToast(null);
    setTimeout(() => setToast(message), 10);
  };

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const data = await askQuestion(query, undefined);
    if (data?.session_id) router.push(`/chat/${data.session_id}`);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploading(true);
    try {
      const data = await uploadFile(file, undefined);
      if (data?.session_id) {
        showToast(`Successfully analyzed: ${file.name}`);
        setTimeout(() => router.push(`/chat/${data.session_id}`), 800);
      }
    } catch (err) {
      showToast(`Failed to upload: ${file.name}`);
      setUploading(false);
    }
  };

  const isBusy = loading || uploading;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Full-width header — same as chat page */}
      <AppHeader
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(p => !p)}
      />

      {/* Body row */}
      <div className="flex flex-1 min-h-0">
        <Sidebar
          onNewChat={() => router.push('/')}
          onSessionSelect={(id: string) => router.push(`/chat/${id}`)}
          collapsed={sidebarCollapsed}
        />

        {/* Centered welcome content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Brand mark */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-900/60 mb-5">
              <span className="text-2xl font-black text-white tracking-tight">V</span>
            </div>
            <h1 className="text-5xl font-black text-slate-100 tracking-tighter mb-2">VERITAS</h1>
            <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Clinical Intelligence Agent</p>
          </div>

          <div className="w-full max-w-2xl space-y-3">
            {/* Text input */}
            <div className="relative">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask a medical question to begin..."
                disabled={isBusy}
                className="w-full bg-slate-900 border border-slate-800 pl-5 pr-14 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-2xl disabled:opacity-50 placeholder:text-slate-600"
              />
              <button
                onClick={handleSend}
                disabled={isBusy || !query.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 p-2 rounded-xl transition-all disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>

            {/* PDF drop zone */}
            <label className={`flex items-center justify-center gap-3 p-4 border-2 border-dashed rounded-2xl transition-all ${
              uploading
                ? 'border-blue-500/70 cursor-not-allowed'
                : 'border-slate-800 hover:border-blue-500/50 cursor-pointer'
            }`}>
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-blue-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 100 24v-4l-3 3 3 3v4A12 12 0 014 12z" />
                  </svg>
                  <span className="text-xs text-blue-400">Uploading and analyzing document...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-xs text-slate-500">Or drop a PDF to initialize a session</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
                accept=".pdf"
                disabled={uploading}
              />
            </label>

            {/* Disclaimer */}
            <p className="text-center text-[10px] text-slate-600 pt-1 leading-relaxed">
              Veritas may produce inaccurate information. Always verify clinical decisions with qualified medical professionals.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}