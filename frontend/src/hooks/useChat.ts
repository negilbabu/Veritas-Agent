"use client";
import { useState } from 'react';
import { NEXT_PUBLIC_API_URL } from '../../config';

/**
 * useChat — attaches Bearer token if present in localStorage.
 * Works for both authenticated users and guests (no token = guest).
 */
export const useChat = () => {
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('veritas_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const askQuestion = async (query: string, sessionId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ query });
      if (sessionId) params.append('session_id', sessionId);

      const response = await fetch(`${NEXT_PUBLIC_API_URL}/chat?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Backend failed');
      return await response.json();
    } catch (error) {
      console.error('Chat Error:', error);
      return { response: 'Sorry, I encountered an error connecting to the agent.', sources: [] };
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, sessionId?: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (sessionId) formData.append('session_id', sessionId);

      const response = await fetch(`${NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),  // Note: do NOT set Content-Type — browser sets multipart boundary
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      return await response.json();
    } catch (error) {
      console.error('Upload Error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { askQuestion, uploadFile, loading };
};