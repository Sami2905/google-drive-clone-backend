#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Storage Setup for Google Drive Clone');
console.log('================================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env file not found. Please create one first.');
  console.log('💡 Copy .env.example to .env and fill in your configuration.');
  process.exit(1);
}

console.log('✅ .env file found');

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if Firebase config already exists
if (envContent.includes('FIREBASE_API_KEY')) {
  console.log('⚠️  Firebase configuration already exists in .env file');
  console.log('💡 If you want to update it, edit the .env file manually.');
  process.exit(0);
}

console.log('\n📝 Adding Firebase configuration to .env file...');

// Add Firebase configuration
const firebaseConfig = `
# Firebase Storage Configuration (Recommended for free tier)
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456
`;

// Add to .env file
fs.appendFileSync(envPath, firebaseConfig);

console.log('✅ Firebase configuration added to .env file');
console.log('\n📋 Next Steps:');
console.log('1. Go to https://console.firebase.google.com/');
console.log('2. Create a new project or select existing one');
console.log('3. Enable Storage in the Firebase console');
console.log('4. Get your configuration from Project Settings > General');
console.log('5. Update the Firebase values in your .env file');
console.log('\n💡 Firebase Storage offers:');
console.log('   - 5GB free storage');
console.log('   - 1GB/day download');
console.log('   - Simple setup');
console.log('   - Great documentation');

console.log('\n🚀 After setup, your file uploads will use Firebase Storage!');
