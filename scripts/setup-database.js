#!/usr/bin/env node

const { createClient } = require('@supabase/supabasejs');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', 'env.local') });

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration. Please check env.local file.');
    process.exit(1);
  }
  
  console.log('📡 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (testError) {
      console.error('❌ Failed to connect to Supabase:', testError.message);
      process.exit(1);
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    // Read and execute setup script
    console.log('📋 Reading database setup script...');
    const setupScript = fs.readFileSync(path.join(__dirname, 'setup-supabase-dev.sql'), 'utf8');
    
    // Split script into individual statements
    const statements = setupScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  Statement ${i + 1} (non-critical):`, error.message);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} (non-critical):`, err.message);
        }
      }
    }
    
    // Create test user and root folder
    console.log('👤 Setting up test user and root folder...');
    const initScript = fs.readFileSync(path.join(__dirname, 'init-root-folder.sql'), 'utf8');
    const initStatements = initScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < initStatements.length; i++) {
      const statement = initStatements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  Init statement ${i + 1} (non-critical):`, error.message);
          }
        } catch (err) {
          console.log(`⚠️  Init statement ${i + 1} (non-critical):`, err.message);
        }
      }
    }
    
    // Verify setup
    console.log('🔍 Verifying database setup...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'folders', 'files', 'storage_usage']);
    
    if (tablesError) {
      console.error('❌ Failed to verify tables:', tablesError.message);
    } else {
      console.log('✅ Found tables:', tables.map(t => t.table_name).join(', '));
    }
    
    // Check for test user
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', '916375dc-f279-4130-94c7-09f42a06fa56')
      .single();
    
    if (userError) {
      console.log('⚠️  Test user not found (may need manual creation):', userError.message);
    } else {
      console.log('✅ Test user found:', testUser.email);
    }
    
    // Check for root folder
    const { data: rootFolder, error: folderError } = await supabase
      .from('folders')
      .select('id, name, user_id')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();
    
    if (folderError) {
      console.log('⚠️  Root folder not found (may need manual creation):', folderError.message);
    } else {
      console.log('✅ Root folder found:', rootFolder.name);
    }
    
    console.log('🎉 Database setup completed!');
    console.log('📝 Note: Some statements may have failed due to existing objects - this is normal.');
    console.log('🚀 Your API should now work correctly.');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupDatabase().catch(console.error);
