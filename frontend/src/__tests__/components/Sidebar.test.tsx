import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: jest.fn(),
}));

describe('Sidebar Component', () => {
  const mockOnNewChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'session-123', title: 'Dermatology Case Notes Analysis' },
        { id: 'session-456', title: 'Radiology Context Evaluation' }
      ]
    });

    (usePathname as jest.Mock).mockReturnValue('/chat/session-123');
  });

  it('renders chat action links, workspace buttons, and historical item nodes accurately', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u1', name: 'Dr. Negil Babu' },
      loading: false
    });

    await act(async () => {
      render(<Sidebar collapsed={false} onToggle={jest.fn()} onNewChat={mockOnNewChat} />);
    });

    expect(screen.getByText('+ New Chat')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Dermatology Case Notes Analysis')).toBeInTheDocument();
      expect(screen.getByText('Radiology Context Evaluation')).toBeInTheDocument();
    });
  });

  it('calls onNewChat when an authenticated user clicks the New Chat button', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u1', name: 'Dr. Negil Babu' },
      loading: false
    });

    await act(async () => {
      render(<Sidebar collapsed={false} onToggle={jest.fn()} onNewChat={mockOnNewChat} />);
    });

    const newChatBtn = screen.getByText('+ New Chat');
    await act(async () => {
      fireEvent.click(newChatBtn);
    });
    
    expect(mockOnNewChat).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to the guest auth workspace route when an anonymous guest clicks the New Chat button', async () => {
    // Simulate an unauthenticated anonymous guest session
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    });

    await act(async () => {
      render(<Sidebar collapsed={false} onToggle={jest.fn()} onNewChat={mockOnNewChat} />);
    });

    const newChatBtn = screen.getByText('+ New Chat');
    await act(async () => {
      fireEvent.click(newChatBtn);
    });
    
    expect(mockPush).toHaveBeenCalledWith('/auth/guest');
    expect(mockOnNewChat).not.toHaveBeenCalled();
  });
});