"use client";
import { useState, useEffect, useCallback } from 'react';
import { NEXT_PUBLIC_API_URL } from '../../config';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  provider: 'email' | 'google';
  data_retention_days: string;
}

const TOKEN_KEY = 'veritas_token';
const USER_KEY  = 'veritas_user';

export function useAuth() {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);  // true while rehydrating from storage

  // Rehydrate on mount
  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const saveSession = useCallback((token: string, userData: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  // Attach Bearer token to fetch headers
  const authHeaders = useCallback((): Record<string, string> => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getToken]);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
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
    saveSession(data.access_token, data.user);
    return data.user;
  }, [saveSession]);

  const googleLogin = useCallback(async (idToken: string) => {
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Google login failed');
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
    if (user) saveSession(getToken()!, { ...user, data_retention_days: days });
    return data;
  }, [authHeaders, user, saveSession, getToken]);

  const deleteAccount = useCallback(async () => {
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/auth/me`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Delete failed');
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