#!/usr/bin/env node

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

async function testApiFix() {
  console.log('🧪 Testing API endpoints after database fix...');
  
  try {
    // Test 1: Root folders endpoint
    console.log('\n📁 Testing /api/folders endpoint...');
    try {
      const response = await fetch(`${API_BASE}/api/folders`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API is working! Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ API still has issues:', errorText);
      }
    } catch (err) {
      console.log('❌ Request failed:', err.message);
    }
    
    // Test 2: Storage usage endpoint
    console.log('\n💾 Testing /api/storage/usage endpoint...');
    try {
      const response = await fetch(`${API_BASE}/api/storage/usage`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Storage API is working! Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Storage API has issues:', errorText);
      }
    } catch (err) {
      console.log('❌ Request failed:', err.message);
    }
    
    // Test 3: Files endpoint
    console.log('\n📄 Testing /api/files endpoint...');
    try {
      const response = await fetch(`${API_BASE}/api/files`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Files API is working! Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Files API has issues:', errorText);
      }
    } catch (err) {
      console.log('❌ Request failed:', err.message);
    }
    
    console.log('\n🎉 API test completed!');
    console.log('📝 If all endpoints return 200 status, your API is fixed!');
    console.log('🚀 You can now run your frontend API tests again.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait a bit for server to start, then test
setTimeout(testApiFix, 3000);
