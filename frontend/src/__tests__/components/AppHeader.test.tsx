import { render, screen, fireEvent } from '@testing-library/react';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('AppHeader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { name: 'Dr. Negil Babu', email: 'negilbabu@gmail.com' },
      loading: false
    });
  });

  it('renders application branding elements and layout tags correctly', () => {
    render(<AppHeader onToggleSidebar={jest.fn()} sidebarCollapsed={false} />);

    expect(screen.getByText('Veritas')).toBeInTheDocument();
    expect(screen.getByText('Clinical Intelligence')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('toggles dropdown menus and handles sidebar toggle clicks correctly', () => {
    const toggleSidebarMock = jest.fn();
    
    // Render wrapper elements
    render(
      <AppHeader 
        onToggleSidebar={toggleSidebarMock} 
        sidebarCollapsed={false} 
      />
    );

    // 1. Open the profile drop-down overlay card first
    const avatarButton = screen.getByText('D');
    fireEvent.click(avatarButton);

    // 2. Verify account info text rendering behaves correctly inside dropdown
    expect(screen.getByText('Dr. Negil Babu')).toBeInTheDocument();
    expect(screen.getByText('negilbabu@gmail.com')).toBeInTheDocument();

    // 3. Test account settings click response behavior
    const settingsButton = screen.getByText('Account Settings');
    fireEvent.click(settingsButton);

    // 4. Test sidebar compression action triggers callback
    const menuButtons = screen.getAllByRole('button');
    if (menuButtons.length > 0) {
      fireEvent.click(menuButtons[0]);
      expect(toggleSidebarMock).toHaveBeenCalledTimes(1);
    }
  });
});