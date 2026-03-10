"use client";
import { useState } from 'react';

export const useChat = () => {
  const [loading, setLoading] = useState(false);

  const askQuestion = async (query: string, sessionId?: string) => {
    setLoading(true);
    try {
      // Use URLSearchParams for clean query building
      const params = new URLSearchParams({ query });
      if (sessionId) params.append("session_id", sessionId);

      const response = await fetch(`http://localhost:8000/chat?${params.toString()}`);
      
      if (!response.ok) throw new Error("Backend failed");
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Chat Error:", error);
      return { response: "Sorry, I encountered an error connecting to the agent.", sources: [] };
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, sessionId?: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (sessionId) {
        formData.append("session_id", sessionId);
      }

      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      return await response.json();
    } catch (error) {
      console.error("Upload Error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Ensure this return is INSIDE the useChat function brackets
  return { askQuestion, uploadFile, loading };
};