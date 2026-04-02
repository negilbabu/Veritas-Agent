
"use client";
import { useCallback } from 'react';
import { NEXT_PUBLIC_API_URL } from '../../config';
import { useAuthContext } from '@/context/AuthContext';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  provider: 'email' | 'google';
  data_retention_days: string;
}

const TOKEN_KEY = 'veritas_token';

export function useAuth() {
  // Consume the shared global state from AuthContext
  const { user, loading, saveSession, logout, googleLogin } = useAuthContext();

  // Utility to get the token for internal use
  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  // Helper to attach Bearer token to fetch headers
  const authHeaders = useCallback((): Record<string, string> => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getToken]);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const guestSessionId = typeof window !== 'undefined' ? sessionStorage.getItem('guest_session_id') : null;
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, session_id: guestSessionId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    if (typeof window !== 'undefined') {
    sessionStorage.removeItem('guest_session_id');
    }
    return data;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    
    // Update the global context state
    saveSession(data.access_token, data.user);
    return data.user;
  }, [saveSession]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/auth/me/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Password change failed');
    return data;
  }, [authHeaders]);

  const updateRetention = useCallback(async (days: string) => {
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/auth/me/retention`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ data_retention_days: days }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Update failed');
    
    // Update the session in context to reflect new preference
    if (user) {
      const token = getToken();
      if (token) saveSession(token, { ...user, data_retention_days: days });
    }
    return data;
  }, [authHeaders, user, saveSession, getToken]);

  const deleteAccount = useCallback(async () => {
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/auth/me`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Delete failed');
    
    // Global logout
    logout();
    return data;
  }, [authHeaders, logout]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    getToken,
    authHeaders,
    register,
    login,
    googleLogin, 
    logout,
    changePassword,
    updateRetention,
    deleteAccount,
  };
}
