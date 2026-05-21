import { renderHook } from '@testing-library/react';
import { useChat } from '@/hooks/useChat';

describe('useChat Hook', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('uploads a file correctly via FormData', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success' }),
    });

    const { result } = renderHook(() => useChat());
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    const response = await result.current.uploadFile(file, 'sess-1');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/upload'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(response.status).toBe('success');
  });

  it('handles backend failures in askQuestion gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useChat());
    const response = await result.current.askQuestion('Hi', 'sess-1');
    
    expect(response.response).toContain('Sorry, I encountered an error');
  });
});