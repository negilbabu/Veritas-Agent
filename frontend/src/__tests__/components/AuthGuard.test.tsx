import { render, screen } from '@testing-library/react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('AuthGuard Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('shows a loading placeholder spinner state while authorization resolves', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: true });
    (usePathname as jest.Mock).mockReturnValue('/chat/abc');

    const { container } = render(
      <AuthGuard>
        <div data-testid="child">Protected Payload</div>
      </AuthGuard>
    );

    // FIX: Selects via tracking the active spinner animation class element directly
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('redirects to the login route if a guest attempts to read private workspace areas', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });
    (usePathname as jest.Mock).mockReturnValue('/chat/abc');

    render(
      <AuthGuard>
        <div>Protected Payload</div>
      </AuthGuard>
    );

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('permits route initialization when conditions pass correctly', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: '123' }, loading: false });
    (usePathname as jest.Mock).mockReturnValue('/chat/abc');

    render(
      <AuthGuard>
        <div data-testid="child">Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});