"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NEXT_PUBLIC_API_URL } from '../../config';

// Define the shape of your context
interface AuthContextType {
  user: any;
  loading: boolean;
  saveSession: (token: string, userData: any) => void;
  logout: () => void;
  googleLogin: (idToken: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('veritas_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const saveSession = useCallback((token: string, userData: any) => {
    localStorage.setItem('veritas_token', token);
    localStorage.setItem('veritas_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('veritas_token');
    localStorage.removeItem('veritas_user');
    setUser(null);
  }, []);

  const googleLogin = async (idToken: string) => {
    const guestSessionId = typeof window !== 'undefined' ? sessionStorage.getItem('guest_session_id') : null;
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken, session_id: guestSessionId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Google login failed');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('guest_session_id');
    }
    saveSession(data.access_token, data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, saveSession, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within AuthProvider");
  return context;
};