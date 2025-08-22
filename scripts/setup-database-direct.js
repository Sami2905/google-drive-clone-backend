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
    // Test connection by checking if we can query
    console.log('🔍 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);
    
    if (testError) {
      console.error('❌ Failed to connect to Supabase:', testError.message);
      process.exit(1);
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    // Check if tables already exist
    console.log('🔍 Checking existing tables...');
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'folders', 'files', 'storage_usage']);
    
    if (tablesError) {
      console.error('❌ Failed to check existing tables:', tablesError.message);
    } else {
      console.log('📋 Existing tables:', existingTables.map(t => t.table_name).join(', '));
    }
    
    // Create tables if they don't exist
    console.log('🔧 Creating database tables...');
    
    // Create users table
    try {
      await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'enterprise')),
            google_id TEXT,
            password_hash TEXT,
            password_reset_token TEXT,
            password_reset_expires TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      console.log('✅ Users table created/verified');
    } catch (err) {
      console.log('⚠️  Users table creation (may already exist):', err.message);
    }
    
    // Create folders table
    try {
      await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS public.folders (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
            path TEXT,
            is_shared BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      console.log('✅ Folders table created/verified');
    } catch (err) {
      console.log('⚠️  Folders table creation (may already exist):', err.message);
    }
    
    // Create files table
    try {
      await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS public.files (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            original_name TEXT NOT NULL,
            description TEXT,
            mime_type TEXT NOT NULL,
            size BIGINT NOT NULL,
            folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
            storage_path TEXT NOT NULL,
            storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 's3')),
            is_shared BOOLEAN DEFAULT FALSE,
            is_deleted BOOLEAN DEFAULT FALSE,
            deleted_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      console.log('✅ Files table created/verified');
    } catch (err) {
      console.log('⚠️  Files table creation (may already exist):', err.message);
    }
    
    // Create storage_usage table
    try {
      await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS public.storage_usage (
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
            total_size BIGINT DEFAULT 0,
            file_count INTEGER DEFAULT 0,
            last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      console.log('✅ Storage usage table created/verified');
    } catch (err) {
      console.log('⚠️  Storage usage table creation (may already exist):', err.message);
    }
    
    // Create test user
    console.log('👤 Creating test user...');
    try {
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: '916375dc-f279-4130-94c7-09f42a06fa56',
          email: 'test@example.com',
          name: 'Test User',
          plan: 'free'
        }, { onConflict: 'id' });
      
      if (userError) {
        console.log('⚠️  Test user creation:', userError.message);
      } else {
        console.log('✅ Test user created/updated');
      }
    } catch (err) {
      console.log('⚠️  Test user creation:', err.message);
    }
    
    // Create root folder
    console.log('📁 Creating root folder...');
    try {
      const { error: folderError } = await supabase
        .from('folders')
        .upsert({
          id: '00000000-0000-0000-0000-000000000000',
          name: 'My Drive',
          description: 'Root folder',
          parent_id: null,
          user_id: '916375dc-f279-4130-94c7-09f42a06fa56',
          path: '/',
          is_shared: false
        }, { onConflict: 'id' });
      
      if (folderError) {
        console.log('⚠️  Root folder creation:', folderError.message);
      } else {
        console.log('✅ Root folder created/updated');
      }
    } catch (err) {
      console.log('⚠️  Root folder creation:', err.message);
    }
    
    // Initialize storage usage
    console.log('💾 Initializing storage usage...');
    try {
      const { error: storageError } = await supabase
        .from('storage_usage')
        .upsert({
          user_id: '916375dc-f279-4130-94c7-09f42a06fa56',
          total_size: 0,
          file_count: 0,
          last_calculated: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (storageError) {
        console.log('⚠️  Storage usage initialization:', storageError.message);
      } else {
        console.log('✅ Storage usage initialized');
      }
    } catch (err) {
      console.log('⚠️  Storage usage initialization:', err.message);
    }
    
    // Final verification
    console.log('🔍 Final verification...');
    
    const { data: finalTables, error: finalTablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'folders', 'files', 'storage_usage']);
    
    if (finalTablesError) {
      console.error('❌ Failed to verify final tables:', finalTablesError.message);
    } else {
      console.log('✅ Final tables found:', finalTables.map(t => t.table_name).join(', '));
    }
    
    // Check test user
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', '916375dc-f279-4130-94c7-09f42a06fa56')
      .single();
    
    if (userError) {
      console.log('⚠️  Test user verification failed:', userError.message);
    } else {
      console.log('✅ Test user verified:', testUser.email);
    }
    
    // Check root folder
    const { data: rootFolder, error: folderError } = await supabase
      .from('folders')
      .select('id, name, user_id')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();
    
    if (folderError) {
      console.log('⚠️  Root folder verification failed:', folderError.message);
    } else {
      console.log('✅ Root folder verified:', rootFolder.name);
    }
    
    console.log('🎉 Database setup completed!');
    console.log('🚀 Your API should now work correctly.');
    console.log('📝 Run your API tests again to verify the fix.');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupDatabase().catch(console.error);
