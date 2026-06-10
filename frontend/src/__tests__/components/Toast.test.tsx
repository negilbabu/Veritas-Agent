import { render, screen, fireEvent } from '@testing-library/react';
import Toast from '@/components/Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders message text payload and button markers perfectly', () => {
    const handleClose = jest.fn();
    render(<Toast message="Patient index processing complete" onClose={handleClose} />);
    
    expect(screen.getByText('Patient index processing complete')).toBeInTheDocument();
    
    // Explicitly select using string layout asset character to trace element
    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('automatically triggers onClose callback boundary after exactly 5 seconds', () => {
    const handleClose = jest.fn();
    render(<Toast message="Timeout processing verify tracer" onClose={handleClose} />);
    
    expect(handleClose).not.toHaveBeenCalled();
    
    // Fast-forward processing loops by exactly 5000 milliseconds
    jest.advanceTimersByTime(5000);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});