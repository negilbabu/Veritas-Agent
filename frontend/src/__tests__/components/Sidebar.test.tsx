import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('Sidebar Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/chat/session-123');
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u1', name: 'Dr. Negil' },
      loading: false
    });
  });

  it('renders chat action links, workspace buttons, and historical item nodes accurately', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        { session_id: 'session-123', title: 'Dermatology Case Notes Analysis' },
        { session_id: 'session-456', title: 'Radiology Context Evaluation' }
      ]
    });

    render(<Sidebar collapsed={false} onToggle={jest.fn()} />);

    expect(screen.getByText('New Analysis')).toBeInTheDocument();

    // Verify asynchronous chat history items are pulled from the server and rendered cleanly
    await waitFor(() => {
      expect(screen.getByText('Dermatology Case Notes Analysis')).toBeInTheDocument();
      expect(screen.getByText('Radiology Context Evaluation')).toBeInTheDocument();
    });
  });

  it('triggers workspace redirection handlers when clicking the New Analysis layout link container', () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });
    render(<Sidebar collapsed={false} onToggle={jest.fn()} />);

    const newAnalysisBtn = screen.getByText('New Analysis');
    fireEvent.click(newAnalysisBtn);
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});