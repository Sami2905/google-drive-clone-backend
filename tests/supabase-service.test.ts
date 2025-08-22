import SupabaseService from '../src/services/supabaseService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('SupabaseService', () => {
  let supabaseService: SupabaseService;
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signInWithOAuth: jest.fn(),
        getUser: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        refreshSession: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    
    // Mock environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
    
    supabaseService = new SupabaseService();
  });

  describe('Constructor', () => {
    it('should create Supabase client with environment variables', () => {
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key'
      );
    });

    it('should throw error if Supabase URL is missing', () => {
      delete process.env.SUPABASE_URL;
      expect(() => new SupabaseService()).toThrow('Missing Supabase configuration');
    });

    it('should throw error if Supabase anon key is missing', () => {
      delete process.env.SUPABASE_ANON_KEY;
      expect(() => new SupabaseService()).toThrow('Missing Supabase configuration');
    });
  });

  describe('Authentication Methods', () => {
    describe('signup', () => {
      it('should create user successfully', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' };
        const mockAuthData = { user: mockUser };
        
        mockSupabase.auth.signUp.mockResolvedValue({
          data: mockAuthData,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            error: null,
          }),
        });

        const result = await supabaseService.signup({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

        expect(result.user.id).toBe('user-123');
        expect(result.user.email).toBe('test@example.com');
        expect(result.token).toBeDefined();
      });

      it('should handle signup errors', async () => {
        mockSupabase.auth.signUp.mockResolvedValue({
          data: null,
          error: { message: 'Email already exists' },
        });

        await expect(
          supabaseService.signup({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          })
        ).rejects.toThrow('Email already exists');
      });
    });

    describe('login', () => {
      it('should authenticate user successfully', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' };
        const mockAuthData = { user: mockUser };
        
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: mockAuthData,
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'user-123',
                  email: 'test@example.com',
                  name: 'Test User',
                  plan: 'free',
                  created_at: '2023-01-01T00:00:00Z',
                },
                error: null,
              }),
            }),
          }),
        });

        const result = await supabaseService.login({
          email: 'test@example.com',
          password: 'password123',
        });

        expect(result.user.id).toBe('user-123');
        expect(result.user.email).toBe('test@example.com');
        expect(result.token).toBeDefined();
      });

      it('should handle login errors', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: null,
          error: { message: 'Invalid credentials' },
        });

        await expect(
          supabaseService.login({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
        ).rejects.toThrow('Invalid credentials');
      });
    });

    describe('signInWithGoogle', () => {
      it('should generate Google OAuth URL', async () => {
        const mockUrl = 'https://accounts.google.com/oauth/authorize?client_id=...';
        
        mockSupabase.auth.signInWithOAuth.mockResolvedValue({
          data: { url: mockUrl },
          error: null,
        });

        const result = await supabaseService.signInWithGoogle();
        expect(result.url).toBe(mockUrl);
      });
    });

    describe('signOut', () => {
      it('should sign out user successfully', async () => {
        mockSupabase.auth.signOut.mockResolvedValue({
          error: null,
        });

        await expect(supabaseService.signOut()).resolves.not.toThrow();
      });

      it('should handle sign out errors', async () => {
        mockSupabase.auth.signOut.mockResolvedValue({
          error: { message: 'Sign out failed' },
        });

        await expect(supabaseService.signOut()).rejects.toThrow('Sign out failed');
      });
    });
  });

  describe('User Profile Methods', () => {
    describe('getUserProfile', () => {
      it('should return user profile', async () => {
        const mockProfile = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          plan: 'free',
          created_at: '2023-01-01T00:00:00Z',
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        });

        const result = await supabaseService.getUserProfile('user-123');
        expect(result).toEqual(mockProfile);
      });

      it('should return null if profile not found', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        });

        const result = await supabaseService.getUserProfile('user-123');
        expect(result).toBeNull();
      });
    });

    describe('updateProfile', () => {
      it('should update user profile successfully', async () => {
        const mockUpdatedProfile = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Updated Name',
          plan: 'free',
          created_at: '2023-01-01T00:00:00Z',
        };

        mockSupabase.from.mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedProfile,
                  error: null,
                }),
              }),
            }),
          }),
        });

        const result = await supabaseService.updateProfile('user-123', {
          name: 'Updated Name',
        });

        expect(result.name).toBe('Updated Name');
      });
    });
  });

  describe('File and Folder Methods', () => {
    describe('getFiles', () => {
      it('should return user files', async () => {
        const mockFiles = [
          { id: 'file-1', name: 'document.pdf', size: 1024 },
          { id: 'file-2', name: 'image.jpg', size: 2048 },
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: mockFiles,
              error: null,
            }),
          }),
        });

        const result = await supabaseService.getFiles('user-123');
        expect(result).toEqual(mockFiles);
      });
    });

    describe('getFolders', () => {
      it('should return user folders', async () => {
        const mockFolders = [
          { id: 'folder-1', name: 'Documents', parent_id: null },
          { id: 'folder-2', name: 'Images', parent_id: null },
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: mockFolders,
              error: null,
            }),
          }),
        });

        const result = await supabaseService.getFolders('user-123');
        expect(result).toEqual(mockFolders);
      });
    });
  });

  describe('Search Methods', () => {
    describe('searchFiles', () => {
      it('should search files by query', async () => {
        const mockFiles = [
          { id: 'file-1', name: 'document.pdf', description: 'Important document' },
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              or: jest.fn().mockReturnValue({
                data: mockFiles,
                error: null,
              }),
            }),
          }),
        });

        const result = await supabaseService.searchFiles('user-123', 'document');
        expect(result).toEqual(mockFiles);
      });
    });
  });

  describe('Storage Usage', () => {
    describe('getStorageUsage', () => {
      it('should calculate storage usage correctly', async () => {
        const mockFiles = [
          { size: 1024 },
          { size: 2048 },
          { size: 3072 },
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: mockFiles,
              error: null,
            }),
          }),
        });

        const result = await supabaseService.getStorageUsage('user-123');
        expect(result.totalSize).toBe(6144); // 1024 + 2048 + 3072
        expect(result.fileCount).toBe(3);
      });

      it('should handle empty storage', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: [],
              error: null,
            }),
          }),
        });

        const result = await supabaseService.getStorageUsage('user-123');
        expect(result.totalSize).toBe(0);
        expect(result.fileCount).toBe(0);
      });
    });
  });
});
