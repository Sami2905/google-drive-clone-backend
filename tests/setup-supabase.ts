import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load test environment variables if they exist
dotenv.config({ path: '.env.test' });

// Always set mock environment variables for testing
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-service-key';
process.env.SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'test-files';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment with mock Supabase configuration');
  
  // Test Supabase connection (will fail with mock values, which is expected)
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // This will fail with mock values, which is expected in test environment
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('ℹ️  Expected connection failure with mock values:', error.message);
    } else {
      console.log('✅ Supabase test connection successful (real environment)');
    }
  } catch (error) {
    console.log('ℹ️  Expected connection failure with mock values:', error);
  }
});

// Global test teardown
afterAll(async () => {
  // Clean up any test data if needed
  console.log('🧹 Test suite completed');
});

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Export mock Supabase client for tests
export const createMockSupabaseClient = (): SupabaseClient => {
  return createClient('https://mock.supabase.co', 'mock-key');
};
