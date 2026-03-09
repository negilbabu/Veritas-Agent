import { useState } from 'react';

export const useChat = () => {
  const [loading, setLoading] = useState(false);

  // Function to send a query to the /chat endpoint
  const askQuestion = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/chat?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Backend request failed");
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Chat Error:", error);
      return "I'm having trouble connecting to the server. Please ensure the backend is running.";
    } finally {
      setLoading(false);
    }
  };

  // Function to send a file to the /upload endpoint
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      return response.ok;
    } catch (error) {
      console.error("Upload Error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { askQuestion, uploadFile, loading };
};