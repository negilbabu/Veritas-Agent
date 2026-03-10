"use client";
import { useEffect } from 'react';

export default function Toast({ message, onClose }: { message: string, onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); 
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 right-8 bg-slate-800 border border-slate-700 text-blue-400 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 z-50">
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">×</button>
    </div>
  );
}