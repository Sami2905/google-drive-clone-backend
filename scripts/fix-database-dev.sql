-- Fix Database for Development - Safe version that handles existing objects
-- Run this in your Supabase SQL editor

-- Step 1: Disable RLS on all tables (safe to run multiple times)
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.file_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.file_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.storage_usage DISABLE ROW LEVEL SECURITY;

-- Step 2: Insert test user (safe - uses ON CONFLICT)
INSERT INTO public.users (id, email, name, plan) 
VALUES (
    'e0931c7f-507b-4864-858a-860c8cf2cbb2', 
    'test@example.com', 
    'test', 
    'free'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    plan = EXCLUDED.plan;

-- Step 3: Initialize storage usage for the test user
INSERT INTO public.storage_usage (user_id, total_size, file_count, last_calculated)
VALUES (
    'e0931c7f-507b-4864-858a-860c8cf2cbb2',
    0,
    0,
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    last_calculated = NOW();

-- Step 4: Verify setup
SELECT 
    'User exists' as check_type,
    id, email, name 
FROM public.users 
WHERE id = 'e0931c7f-507b-4864-858a-860c8cf2cbb2'
UNION ALL
SELECT 
    'Storage usage exists' as check_type,
    user_id::text, 
    total_size::text, 
    file_count::text 
FROM public.storage_usage 
WHERE user_id = 'e0931c7f-507b-4864-858a-860c8cf2cbb2';

-- Step 5: Show RLS status (should all be false)
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'folders', 'files', 'permissions', 'shares', 'file_versions', 'tags', 'file_tags', 'storage_usage')
ORDER BY tablename;
