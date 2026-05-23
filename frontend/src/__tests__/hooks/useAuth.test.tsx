import { renderHook } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/context/AuthContext';

// 1. Mock the context hook directly since AuthContext isn't exported
jest.mock('@/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

describe('useAuth Hook - Full Coverage', () => {
  const mockSaveSession = jest.fn();
  const mockLogout = jest.fn();
  const mockGoogleLogin = jest.fn();

  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();

    // 2. Provide a default authenticated state for the hook to consume
    (useAuthContext as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@test.com', name: 'Test User' },
      loading: false,
      saveSession: mockSaveSession,
      logout: mockLogout,
      googleLogin: mockGoogleLogin,
    });
  });

  // --- ERROR HANDLING PATHS (Covers catch blocks) ---

  it('handles registration failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Registration failed' }),
    });

    const { result } = renderHook(() => useAuth());
    await expect(result.current.register('e@e.com', 'Name', 'pw'))
      .rejects.toThrow('Registration failed');
  });

  it('handles login failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Login failed' }),
    });

    const { result } = renderHook(() => useAuth());
    await expect(result.current.login('e@e.com', 'pw'))
      .rejects.toThrow('Login failed');
  });

  it('handles password change failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Password change failed' }),
    });

    const { result } = renderHook(() => useAuth());
    await expect(result.current.changePassword('old', 'new'))
      .rejects.toThrow('Password change failed');
  });

  it('handles update retention failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Update failed' }),
    });

    const { result } = renderHook(() => useAuth());
    await expect(result.current.updateRetention('90'))
      .rejects.toThrow('Update failed');
  });

  it('handles delete account failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Delete failed' }),
    });

    const { result } = renderHook(() => useAuth());
    await expect(result.current.deleteAccount())
      .rejects.toThrow('Delete failed');
  });

  // --- SUCCESS PATHS (Covers try blocks and state updates) ---

  it('handles successful registration', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });
    const { result } = renderHook(() => useAuth());
    const res = await result.current.register('e@e.com', 'Name', 'pw');
    expect(res.message).toBe('Success');
  });

  it('handles successful login and saves session', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'fake-token', user: { id: '1' } }),
    });
    const { result } = renderHook(() => useAuth());
    const res = await result.current.login('e@e.com', 'pw');
    
    expect(mockSaveSession).toHaveBeenCalledWith('fake-token', { id: '1' });
    expect(res.id).toBe('1');
  });

  it('handles successful password change', async () => {
     (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });
    const { result } = renderHook(() => useAuth());
    const res = await result.current.changePassword('old', 'new');
    expect(res.message).toBe('Success');
  });

  it('handles successful update retention and updates local storage', async () => {
    localStorage.setItem('veritas_token', 'fake-token');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });
    const { result } = renderHook(() => useAuth());
    await result.current.updateRetention('30');
    
    expect(mockSaveSession).toHaveBeenCalledWith('fake-token', expect.objectContaining({ data_retention_days: '30' }));
  });

  it('handles successful delete account and logs out', async () => {
     (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Deleted' }),
    });
    const { result } = renderHook(() => useAuth());
    await result.current.deleteAccount();
    
    expect(mockLogout).toHaveBeenCalled();
  });
});