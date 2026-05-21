import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import React from 'react';

describe('AuthContext and AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('hydrates user records from localStorage on initial render mount safely', () => {
    const mockUser = { id: 'u1', name: 'Dr. Negil' };
    localStorage.setItem('veritas_user', JSON.stringify(mockUser));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuthContext(), { wrapper });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('handles saveSession updates and signs out user sessions cleanly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    act(() => {
      result.current.saveSession('fake-token', { name: 'New User' });
    });
    expect(result.current.user?.name).toBe('New User');
    expect(localStorage.getItem('veritas_token')).toBe('fake-token');

    act(() => {
      result.current.logout();
    });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('veritas_token')).toBeNull();
  });

  it('orchestrates googleLogin pipelines and removes transient session records upon completion', async () => {
    sessionStorage.setItem('guest_session_id', 'sess-123');
    
    const mockUserData = { id: 'g1', name: 'Google User' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'g-token', user: mockUserData }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    let profile;
    await act(async () => {
      profile = await result.current.googleLogin('oauth-id-token');
    });

    expect(profile).toEqual(mockUserData);
    expect(sessionStorage.getItem('guest_session_id')).toBeNull();
    expect(result.current.user).toEqual(mockUserData);
  });

  it('throws an explicit error description if Google sign-in response returns a validation failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Invalid Google OAuth credentials provided' }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await act(async () => {
      await expect(result.current.googleLogin('bad-token')).rejects.toThrow(
        'Invalid Google OAuth credentials provided'
      );
    });
  });
});