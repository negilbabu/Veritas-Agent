"use client";
import { useState } from 'react';
import { useChat } from '@/hooks/useChat';

export default function Home() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const { askQuestion, uploadFile, loading } = useChat();

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    
    // Add user message to UI
    const currentQuery = query;
    setMessages((prev) => [...prev, { role: 'user', text: currentQuery }]);
    setQuery('');

    // Fetch answer from Agent
    const answer = await askQuestion(currentQuery);
    setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const success = await uploadFile(e.target.files[0]);
      if (success) {
        alert("Document uploaded and indexed successfully!");
      } else {
        alert("Upload failed. Check backend logs.");
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Navbar */}
      <nav className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-500">Veritas-Agent</h1>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm border border-slate-700 transition-all">
            Upload PDF
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
          </label>
        </div>
      </nav>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-20 text-slate-500">
            <p className="text-xl">Welcome to Veritas-Agent.</p>
            <p className="text-sm">Upload a medical document to begin agentic analysis.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-4 rounded-xl ${
              m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-blue-400 text-xs animate-pulse italic">Veritas is thinking...</div>}
      </div>

      {/* Input Bar */}
      <div className="p-6 bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto flex gap-4">
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your documents..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-6 py-3 rounded-lg font-bold transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}