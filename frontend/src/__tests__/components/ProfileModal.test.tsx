import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import ProfileModal from '@/components/ProfileModal';
import { useAuth } from '@/hooks/useAuth';

// ── Mock next/navigation ──────────────────────────────────────────────────────
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

// ── Mock useAuth ──────────────────────────────────────────────────────────────
jest.mock('@/hooks/useAuth');

// ── Mock ConfirmModal so we can control its rendering ─────────────────────────
jest.mock('@/components/ConfirmModal', () =>
  function MockConfirmModal({ isOpen, actions }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-modal">
        {actions.map((a: any) => (
          <button key={a.label} onClick={a.onClick}>
            {a.label}
          </button>
        ))}
      </div>
    );
  }
);

// ── Shared mock factories ─────────────────────────────────────────────────────
const makeEmailUser = (overrides = {}) => ({
  email: 'test@example.com',
  name: 'Test User',
  provider: 'email',
  data_retention_days: '90',
  ...overrides,
});

const makeGoogleUser = (overrides = {}) => ({
  email: 'google@example.com',
  name: 'Google User',
  provider: 'google',
  data_retention_days: '30',
  ...overrides,
});

const makeAuth = (overrides = {}) => ({
  user: makeEmailUser(),
  logout: jest.fn(),
  changePassword: jest.fn().mockResolvedValue(undefined),
  updateRetention: jest.fn().mockResolvedValue(undefined),
  deleteAccount: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

// ── Helper ────────────────────────────────────────────────────────────────────
function setup(authOverrides = {}, onClose = jest.fn()) {
  const auth = makeAuth(authOverrides);
  (useAuth as jest.Mock).mockReturnValue(auth);
  const utils = render(<ProfileModal onClose={onClose} />);
  return { ...utils, auth, onClose };
}

function goToTab(label: string) {
  fireEvent.click(screen.getByText(label));
}

// =============================================================================
// PROFILE TAB
// =============================================================================
describe('ProfileModal — Profile tab (default)', () => {
  it('renders user name and email', () => {
    setup();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows avatar initial from user name', () => {
    setup();
    expect(screen.getByText('T')).toBeInTheDocument(); // first letter of "Test User"
  });

  it('shows fallback avatar "U" when name is missing', () => {
    setup({ user: makeEmailUser({ name: '' }) });
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('shows "Email & Password" sign-in method for email users', () => {
    setup();
    expect(screen.getByText('Email & Password')).toBeInTheDocument();
  });

  it('shows "Google" sign-in method and info banner for Google users', () => {
    setup({ user: makeGoogleUser() });
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText(/Password change is not available/i)).toBeInTheDocument();
  });

  it('clicking "Sign out" opens the confirm modal', () => {
    setup();
    fireEvent.click(screen.getByText('Sign out'));
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
  });

  it('confirming logout calls logout(), redirects, and closes modal', () => {
    const onClose = jest.fn();
    const { auth } = setup({}, onClose);
    fireEvent.click(screen.getByText('Sign out'));
    fireEvent.click(screen.getByText('Sign Out')); // ConfirmModal action button
    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('"Stay logged in" closes the confirm modal without logging out', () => {
    const { auth } = setup();
    fireEvent.click(screen.getByText('Sign out'));
    fireEvent.click(screen.getByText('Stay logged in'));
    expect(auth.logout).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('clicking the backdrop calls onClose', () => {
    const onClose = jest.fn();
    setup({}, onClose);
    // The backdrop is the outermost div
    fireEvent.click(screen.getByText('Account Settings').closest('.fixed')!);
    expect(onClose).toHaveBeenCalled();
  });

  it('clicking inside the card does NOT call onClose', () => {
    const onClose = jest.fn();
    setup({}, onClose);
    fireEvent.click(screen.getByText('Account Settings').closest('.rounded-2xl')!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clicking the X button calls onClose', () => {
    const onClose = jest.fn();
    setup({}, onClose);
    // The X button is the close svg button in the header
    const header = screen.getByText('Account Settings').parentElement!;
    const closeBtn = header.querySelector('button')!;
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

// =============================================================================
// SECURITY TAB — email provider
// =============================================================================
describe('ProfileModal — Security tab (email provider)', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue(makeAuth());
  });

  function openSecurity() {
    render(<ProfileModal onClose={jest.fn()} />);
    goToTab('Security');
  }

  it('renders the three password fields with proper label associations', () => {
    openSecurity();
    expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New/i)).toBeInTheDocument();
  });

  it('shows client-side error when new password is too short', async () => {
    openSecurity();
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: 'short' } });
      fireEvent.change(screen.getByLabelText(/Confirm New/i),  { target: { value: 'short' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    });
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows client-side error when passwords do not match', async () => {
    openSecurity();
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Current Password/i), { target: { value: 'currentpass' } });
      fireEvent.change(screen.getByLabelText(/New Password/i),     { target: { value: 'longpassword1' } });
      fireEvent.change(screen.getByLabelText(/Confirm New/i),       { target: { value: 'longpassword2' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    });
    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('shows success message on successful password change', async () => {
    openSecurity();
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Current Password/i), { target: { value: 'oldpass123' } });
      fireEvent.change(screen.getByLabelText(/New Password/i),     { target: { value: 'newpass123' } });
      fireEvent.change(screen.getByLabelText(/Confirm New/i),       { target: { value: 'newpass123' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    });
    expect(await screen.findByText(/Password changed successfully/i)).toBeInTheDocument();
  });

  it('clears inputs after successful password change', async () => {
    openSecurity();
    const currentInput = screen.getByLabelText(/Current Password/i) as HTMLInputElement;
    const newInput     = screen.getByLabelText(/New Password/i)     as HTMLInputElement;
    const confirmInput = screen.getByLabelText(/Confirm New/i)       as HTMLInputElement;

    await act(async () => {
      fireEvent.change(currentInput, { target: { value: 'oldpass123' } });
      fireEvent.change(newInput,     { target: { value: 'newpass123' } });
      fireEvent.change(confirmInput, { target: { value: 'newpass123' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    });

    await waitFor(() => {
      expect(currentInput.value).toBe('');
      expect(newInput.value).toBe('');
      expect(confirmInput.value).toBe('');
    });
  });

  it('shows API error when changePassword rejects', async () => {
    (useAuth as jest.Mock).mockReturnValue(
      makeAuth({ changePassword: jest.fn().mockRejectedValue(new Error('Incorrect current password')) })
    );
    render(<ProfileModal onClose={jest.fn()} />);
    goToTab('Security');

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Current Password/i), { target: { value: 'wrongpass' } });
      fireEvent.change(screen.getByLabelText(/New Password/i),     { target: { value: 'newpass123' } });
      fireEvent.change(screen.getByLabelText(/Confirm New/i),       { target: { value: 'newpass123' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    });

    expect(await screen.findByText(/Incorrect current password/i)).toBeInTheDocument();
  });
});

// =============================================================================
// SECURITY TAB — Google provider
// =============================================================================
describe('ProfileModal — Security tab (Google provider)', () => {
  it('shows Google-account notice instead of password form', () => {
    (useAuth as jest.Mock).mockReturnValue(makeAuth({ user: makeGoogleUser() }));
    render(<ProfileModal onClose={jest.fn()} />);
    goToTab('Security');
    expect(screen.getByText(/Password management is not available for Google accounts/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/New Password/i)).not.toBeInTheDocument();
  });
});

// =============================================================================
// DATA TAB
// =============================================================================
describe('ProfileModal — My Data tab', () => {
  function openData(authOverrides = {}) {
    (useAuth as jest.Mock).mockReturnValue(makeAuth(authOverrides));
    render(<ProfileModal onClose={jest.fn()} />);
    goToTab('My Data');
  }

  it('renders retention selector and delete section', () => {
    openData();
    expect(screen.getByText(/Data Retention/i)).toBeInTheDocument();
    expect(screen.getByText(/Delete Account/i)).toBeInTheDocument();
  });

  it('calls updateRetention with selected value on save', async () => {
    const updateRetention = jest.fn().mockResolvedValue(undefined);
    openData({ updateRetention });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '365' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Preference/i }));
    });

    expect(updateRetention).toHaveBeenCalledWith('365');
  });

  it('shows "Saved" text briefly after saving retention', async () => {
    jest.useFakeTimers();
    openData();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Preference/i }));
    });

    expect(screen.getByRole('button', { name: /✓ Saved/i })).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(2600); });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Save Preference/i })).toBeInTheDocument()
    );

    jest.useRealTimers();
  });

  it('delete button stays disabled when a non-matching email is entered', () => {
    openData();
    fireEvent.change(screen.getByPlaceholderText(/Type test@example.com to confirm/i), {
      target: { value: 'wrong@example.com' },
    });
    expect(screen.getByRole('button', { name: /Permanently Delete My Account/i })).toBeDisabled();
  });

  it('delete button is disabled when confirm field is empty', () => {
    openData();
    const btn = screen.getByRole('button', { name: /Permanently Delete My Account/i });
    expect(btn).toBeDisabled();
  });

  it('delete button becomes enabled when correct email is entered', () => {
    openData();
    fireEvent.change(screen.getByPlaceholderText(/Type test@example.com to confirm/i), {
      target: { value: 'test@example.com' },
    });
    const btn = screen.getByRole('button', { name: /Permanently Delete My Account/i });
    expect(btn).not.toBeDisabled();
  });

  it('calls deleteAccount and redirects on successful deletion', async () => {
    const deleteAccount = jest.fn().mockResolvedValue(undefined);
    openData({ deleteAccount });

    fireEvent.change(screen.getByPlaceholderText(/Type test@example.com to confirm/i), {
      target: { value: 'test@example.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Permanently Delete My Account/i }));
    });

    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('shows API error and re-enables button when deleteAccount rejects', async () => {
    const deleteAccount = jest.fn().mockRejectedValue(new Error('Server error'));
    openData({ deleteAccount });

    fireEvent.change(screen.getByPlaceholderText(/Type test@example.com to confirm/i), {
      target: { value: 'test@example.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Permanently Delete My Account/i }));
    });

    expect(await screen.findByText(/Server error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Permanently Delete My Account/i })).not.toBeDisabled();
  });

  it('initialises retention selector from user.data_retention_days', () => {
    openData({ user: makeEmailUser({ data_retention_days: '365' }) });
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('365');
  });

  it('defaults retention to 90 when data_retention_days is absent', () => {
    openData({ user: makeEmailUser({ data_retention_days: undefined }) });
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('90');
  });
});

// =============================================================================
// TAB NAVIGATION
// =============================================================================
describe('ProfileModal — tab navigation', () => {
  it('starts on Profile tab by default', () => {
    setup();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('switches to Security tab', () => {
    setup();
    goToTab('Security');
    expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
  });

  it('switches to My Data tab', () => {
    setup();
    goToTab('My Data');
    expect(screen.getByText(/Data Retention/i)).toBeInTheDocument();
  });

  it('switches back to Profile tab from Security', () => {
    setup();
    goToTab('Security');
    goToTab('Profile');
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});