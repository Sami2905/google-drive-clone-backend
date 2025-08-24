import { jest } from '@jest/globals';
import { useAuthStore } from '@/store/authStore';
import { downloadFile } from '@/lib/file-actions';

jest.mock('@/store/authStore', () => ({
  __esModule: true,
  default: jest.fn(),
  useAuthStore: jest.fn(),
}));

describe('file-actions', () => {
  const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
  const state = {
    token: 'test-token',
    user: { id: 'test-id', email: 'test@example.com' },
    isTokenValid: jest.fn().mockReturnValue(true),
    refreshToken: jest.fn().mockResolvedValue(true),
    logout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue(state);
  });

  describe('downloadFile', () => {
    it('should download a file successfully', async () => {
      const fileId = 'test-file-id';
      const mockBlob = new Blob(['test content'], { type: 'text/plain' });
      const mockResponse = new Response(mockBlob, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });

      (global as any).fetch = jest.fn().mockResolvedValueOnce(mockResponse);

      const result = await downloadFile(fileId);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should throw an error if no token is available', async () => {
      mockUseAuthStore.mockReturnValueOnce({
        ...state,
        token: null,
      });

      await expect(downloadFile('test-file-id')).rejects.toThrow(
        'No authentication token available'
      );
    });

    it('should refresh token if current token is invalid', async () => {
      mockUseAuthStore.mockReturnValueOnce({
        ...state,
        isTokenValid: jest.fn().mockReturnValue(false),
      });

      const mockBlob = new Blob(['test content'], { type: 'text/plain' });
      const mockResponse = new Response(mockBlob, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });

      (global as any).fetch = jest.fn().mockResolvedValueOnce(mockResponse);

      await downloadFile('test-file-id');
      expect(state.refreshToken).toHaveBeenCalled();
    });

    it('should throw an error if token refresh fails', async () => {
      mockUseAuthStore.mockReturnValueOnce({
        ...state,
        isTokenValid: jest.fn().mockReturnValue(false),
        refreshToken: jest.fn().mockResolvedValue(false),
      });

      await expect(downloadFile('test-file-id')).rejects.toThrow(
        'Failed to refresh token'
      );
    });

    it('should throw an error if download fails', async () => {
      const mockResponse = new Response(null, { status: 404 });
      (global as any).fetch = jest.fn().mockResolvedValueOnce(mockResponse);

      await expect(downloadFile('test-file-id')).rejects.toThrow(
        'Failed to download file'
      );
    });

    it('should call onProgress callback with progress updates', async () => {
      const fileId = 'test-file-id';
      const mockBlob = new Blob(['test content'], { type: 'text/plain' });
      const mockResponse = new Response(mockBlob, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': '100',
        },
      });

      (global as any).fetch = jest.fn().mockResolvedValueOnce(mockResponse);
      const onProgress = jest.fn();

      await downloadFile(fileId, onProgress);
      expect(onProgress).toHaveBeenCalled();
    });
  });
});