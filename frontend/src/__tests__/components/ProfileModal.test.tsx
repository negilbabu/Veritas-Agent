import { render, screen, fireEvent, act } from '@testing-library/react';
import ProfileModal from '@/components/ProfileModal';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');

describe('ProfileModal', () => {
  const mockChangePw = jest.fn().mockRejectedValue(new Error('New password must be at least 8 characters'));

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@test.com', name: 'Test', provider: 'email' },
      logout: jest.fn(),
      changePassword: mockChangePw
    });
  });

  it('handles password validation errors', async () => {
    render(<ProfileModal onClose={jest.fn()} />);
    
    fireEvent.click(screen.getByText('Security'));
    
    // This now succeeds because the input has the 'id="new-pw"' and label has 'htmlFor="new-pw"'
    const newPwInput = screen.getByLabelText(/New Password/i);
    
    await act(async () => {
      fireEvent.change(newPwInput, { target: { value: 'short' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    });
    
    const errorText = await screen.findByText(/New password must be at least 8 characters/i);
    expect(errorText).toBeInTheDocument();
  });
});