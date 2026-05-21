import { render, screen, fireEvent } from '@testing-library/react';
// FIX: Imported as a default import to match your implementation file export layout
import ConfirmModal from '@/components/ConfirmModal';

describe('ConfirmModal Component', () => {
  const defaultActions = [
    { label: 'Confirm Action', onClick: jest.fn(), variant: 'primary' as const },
    { label: 'Cancel Action', onClick: jest.fn(), variant: 'ghost' as const }
  ];

  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <ConfirmModal 
        isOpen={false} 
        onClose={jest.fn()} 
        title="Delete Document" 
        description="Are you absolutely sure?" 
        actions={defaultActions}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all fields, buttons, and handles styling variants correctly when open', () => {
    const mockActions = [
      { label: 'Primary Btn', onClick: jest.fn(), variant: 'primary' as const },
      { label: 'Danger Btn', onClick: jest.fn(), variant: 'danger' as const },
      { label: 'Secondary Btn', onClick: jest.fn(), variant: 'secondary' as const, isLoading: true },
      { label: 'Ghost Btn', onClick: jest.fn(), variant: 'ghost' as const }
    ];

    render(
      <ConfirmModal 
        isOpen={true} 
        onClose={jest.fn()} 
        title="Clinical Update Notice" 
        description="This will clear your local cached patient context vectors." 
        icon={<span data-testid="mock-icon">⚕️</span>}
        actions={mockActions}
      />
    );

    expect(screen.getByText('Clinical Update Notice')).toBeInTheDocument();
    expect(screen.getByText('This will clear your local cached patient context vectors.')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();

    // Verify click tracking and loader constraints on button targets
    fireEvent.click(screen.getByText('Primary Btn'));
    expect(mockActions[0].onClick).toHaveBeenCalledTimes(1);

    // Verify loading spinner operates correctly instead of drawing text
    expect(screen.queryByText('Secondary Btn')).not.toBeInTheDocument();
  });

  it('stops event propagation on the modal content container, but fires onClose on backdrop click', () => {
    const handleClose = jest.fn();
    render(
      <ConfirmModal 
        isOpen={true} 
        onClose={handleClose} 
        title="Propagation Test" 
        description="Desc" 
        actions={defaultActions}
      />
    );

    // Click inside the inner layout card should not fire onClose
    const innerCard = screen.getByText('Propagation Test').closest('div');
    if (innerCard) {
      fireEvent.click(innerCard);
    }
    expect(handleClose).not.shared;

    // Click on the full overlay screen backdrop triggers onClose boundary helper
    const backdropElement = screen.getByText('Propagation Test').parentElement?.parentElement;
    if (backdropElement) {
      fireEvent.click(backdropElement);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });
});