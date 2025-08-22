#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Running Quick Fix Tests...\n');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

try {
  console.log('1. Testing backend compilation...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Backend TypeScript check passed\n');
  
  console.log('2. Testing a single backend API test...');
  execSync('npm test -- --testNamePattern="should create new user" --verbose', { stdio: 'inherit' });
  console.log('✅ Backend test passed\n');
  
  console.log('3. Testing frontend compilation...');
  execSync('npx tsc --noEmit', { cwd: './drive-frontend', stdio: 'inherit' });
  console.log('✅ Frontend TypeScript check passed\n');
  
  console.log('4. Testing PDF serving endpoint...');
  execSync('npm test -- --testNamePattern="File Serving Endpoint" --verbose', { stdio: 'inherit' });
  console.log('✅ PDF serving test passed\n');
  
  console.log('🎉 All quick tests passed! Major issues are fixed.');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.log('\n📋 Remaining issues to fix:');
  console.log('- Database connection setup');
  console.log('- JWT token validation');
  console.log('- Test environment configuration');
  console.log('- Frontend test setup');
  
  console.log('\n💡 Next steps:');
  console.log('1. Fix database initialization in tests');
  console.log('2. Configure proper test environment variables');
  console.log('3. Set up Jest configuration for frontend');
  console.log('4. Implement proper authentication mocking');
}
