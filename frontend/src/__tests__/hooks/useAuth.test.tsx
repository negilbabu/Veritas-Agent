import { renderHook } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/context/AuthContext';

// Mock useAuthContext directly since useAuth is a simple pass-through wrapper
jest.mock('@/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

describe('useAuth Custom Hook', () => {
  it('throws an informative validation error statement if invoked outside an active AuthProvider scope wrapper', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (useAuthContext as jest.Mock).mockImplementation(() => {
      throw new Error('useAuthContext must be used within AuthProvider');
    });

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuthContext must be used within AuthProvider'
    );

    spy.mockRestore();
  });

  it('safely extracts auth context state records when bounded inside a valid provider tree hierarchy', () => {
    const mockContextValue = {
      user: { id: 'user-789', name: 'Negil Babu' },
      loading: false,
    };

    (useAuthContext as jest.Mock).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useAuth());
    expect(result.current.user?.name).toEqual('Negil Babu');
  });
});