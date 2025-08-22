// Simple test environment setup
// This file sets up minimal environment variables for testing

const fs = require('fs');
const path = require('path');

// Create a minimal .env file for testing
const testEnvContent = `# Test Environment Configuration
SUPABASE_URL=https://test-project.supabase.co
SUPABASE_ANON_KEY=test_anon_key_123
SUPABASE_SERVICE_ROLE_KEY=test_service_key_123
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=52428800
JWT_SECRET=test_jwt_secret_123
STORAGE_PROVIDER=supabase
STORAGE_BUCKET=test-bucket
`;

// Write the test environment file
fs.writeFileSync('.env', testEnvContent);
console.log('✅ Test environment file created: .env');
console.log('📝 Update the Supabase credentials in .env with your actual values');
console.log('🔑 You can get these from your Supabase project dashboard');
