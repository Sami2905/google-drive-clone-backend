-- Quick Fix for Development - Handle auth.users dependency
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

-- Step 2: First create user in auth.users (if it doesn't exist)
-- This handles the foreign key constraint to auth.users
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
    'e0931c7f-507b-4864-858a-860c8cf2cbb2',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@example.com',
    '$2a$10$dummy.hash.for.development.purposes.only',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"test"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Now create user in public.users
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

-- Step 4: Initialize storage usage for the test user
INSERT INTO public.storage_usage (user_id, total_size, file_count, last_calculated)
VALUES (
    'e0931c7f-507b-4864-858a-860c8cf2cbb2',
    0,
    0,
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    last_calculated = NOW();

-- Step 5: Verify setup
SELECT 'User exists in auth.users' as check_type, id::text, email, email_confirmed_at::text 
FROM auth.users 
WHERE id = 'e0931c7f-507b-4864-858a-860c8cf2cbb2'
UNION ALL
SELECT 'User exists in public.users' as check_type, id::text, email, name 
FROM public.users 
WHERE id = 'e0931c7f-507b-4864-858a-860c8cf2cbb2';
