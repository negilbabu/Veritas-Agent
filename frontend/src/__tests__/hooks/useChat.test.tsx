import { renderHook, act } from '@testing-library/react';
import { useChat } from '@/hooks/useChat';

describe('useChat Hook', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    // Mute expected console.errors during tests to keep the terminal clean
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- askQuestion Tests ---

  it('asks a question successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Hello from Veritas', sources: [] }),
    });

    const { result } = renderHook(() => useChat());

    let data;
    await act(async () => {
      data = await result.current.askQuestion('Hi', 'sess-1');
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(data.response).toBe('Hello from Veritas');
  });

  it('handles backend failures in askQuestion gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useChat());
    
    let data;
    await act(async () => {
      data = await result.current.askQuestion('Hi', 'sess-1');
    });

    expect(data.response).toContain('Sorry, I encountered an error');
  });

  // --- uploadFile Tests ---

  it('uploads a file successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success' }),
    });

    const { result } = renderHook(() => useChat());
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    let data;
    await act(async () => {
      data = await result.current.uploadFile(file, 'sess-1');
    });

    expect(data.status).toBe('success');
  });

  it('handles backend failures in uploadFile gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useChat());
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    let data;
    await act(async () => {
      data = await result.current.uploadFile(file, 'sess-1');
    });

    expect(data).toBeNull();
  });
});