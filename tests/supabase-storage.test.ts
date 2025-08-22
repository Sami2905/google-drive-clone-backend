import { SupabaseStorageService } from '../src/services/supabaseStorageService';
import { createMockSupabaseClient } from './setup-supabase';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('SupabaseStorageService', () => {
  let storageService: SupabaseStorageService;
  let mockSupabase: any;

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabase = {
      storage: {
        listBuckets: jest.fn(),
        createBucket: jest.fn(),
        from: jest.fn(),
        list: jest.fn(),
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
        createSignedUrl: jest.fn(),
      }
    };

    // Mock the createClient function
    const { createClient } = require('@supabase/supabase-js');
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Set the expected bucket name for testing
    process.env.SUPABASE_STORAGE_BUCKET = 'files';

    // Create storage service instance
    storageService = new SupabaseStorageService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create Supabase client with environment variables', () => {
      const { createClient } = require('@supabase/supabase-js');
      
      expect(createClient).toHaveBeenCalledWith(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    });

    it('should throw error if Supabase URL is missing', () => {
      const originalUrl = process.env.SUPABASE_URL;
      delete process.env.SUPABASE_URL;
      
      expect(() => new SupabaseStorageService()).toThrow('Missing Supabase configuration');
      
      process.env.SUPABASE_URL = originalUrl;
    });

    it('should throw error if Supabase service key is missing', () => {
      const originalKey = process.env.SUPABASE_SERVICE_KEY;
      delete process.env.SUPABASE_SERVICE_KEY;
      
      expect(() => new SupabaseStorageService()).toThrow('Missing Supabase configuration');
      
      process.env.SUPABASE_SERVICE_KEY = originalKey;
    });
  });

  describe('Storage Operations', () => {
    it('should initialize bucket successfully', async () => {
      // Mock the listBuckets method to return existing bucket
      mockSupabase.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'files' }],
        error: null
      });

      await expect(storageService.initializeBucket()).resolves.not.toThrow();
      
      // Verify listBuckets was called
      expect(mockSupabase.storage.listBuckets).toHaveBeenCalled();
    });

    it('should create bucket if it does not exist', async () => {
      // Mock the listBuckets method to return no buckets
      mockSupabase.storage.listBuckets.mockResolvedValue({
        data: [],
        error: null
      });

      // Mock the createBucket method
      mockSupabase.storage.createBucket.mockResolvedValue({
        error: null
      });

      await expect(storageService.initializeBucket()).resolves.not.toThrow();
      
      // Verify createBucket was called
      expect(mockSupabase.storage.createBucket).toHaveBeenCalledWith('files', {
        public: true,
        allowedMimeTypes: ['*/*'],
        fileSizeLimit: 52428800
      });
    });

    it('should upload file successfully', async () => {
      const mockFile = Buffer.from('test file content');
      const userId = 'test-user-id';
      const folderPath = 'test-folder';

      // Mock the storage bucket
      const mockBucket = {
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null
        }),
        list: jest.fn().mockResolvedValue({
          data: [{ metadata: { size: 100 } }],
          error: null
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test-url.com' }
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockBucket);

      const result = await storageService.uploadFile(mockFile, userId, folderPath);
      
      expect(result.path).toBeDefined();
      expect(result.size).toBe(100);
      expect(result.url).toBe('https://test-url.com');
    });

    it('should handle upload errors gracefully', async () => {
      const mockFile = Buffer.from('test file content');
      const userId = 'test-user-id';

      const mockBucket = {
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' }
        })
      };

      mockSupabase.storage.from.mockReturnValue(mockBucket);

      await expect(storageService.uploadFile(mockFile, userId)).rejects.toThrow('Upload failed');
    });
  });
});
