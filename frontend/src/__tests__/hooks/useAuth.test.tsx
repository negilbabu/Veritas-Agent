import { renderHook } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { AuthContext } from '@/context/AuthContext';
import React from 'react';

describe('useAuth Custom Hook', () => {
  it('throws an informative validation error statement if invoked outside an active AuthProvider scope wrapper', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuthContext must be used within AuthProvider'
    );

    spy.mockRestore();
  });

  it('safely extracts auth context state records when bounded inside a valid provider tree hierarchy', () => {
    const mockContextValue = {
      user: { id: 'user-789', name: 'Negil Babu' },
      loading: false,
      saveSession: jest.fn(),
      logout: jest.fn(),
      googleLogin: jest.fn()
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user?.name).toEqual('Negil Babu');
  });
});