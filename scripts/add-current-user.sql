-- Add current user from login token to database

-- Run this in your Supabase SQL editor

-- Step 1: Create user in auth.users with the new ID
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
    '916375dc-f279-4130-94c7-09f42a06fa56',
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

-- Step 2: Create user in public.users with the new ID
INSERT INTO public.users (id, email, name, plan) 
VALUES (
    '916375dc-f279-4130-94c7-09f42a06fa56', 
    'test@example.com', 
    'test', 
    'free'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    plan = EXCLUDED.plan;

-- Step 3: Initialize storage usage for the new user
INSERT INTO public.storage_usage (user_id, total_size, file_count, last_calculated)
VALUES (
    '916375dc-f279-4130-94c7-09f42a06fa56',
    0,
    0,
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    last_calculated = NOW();

-- Step 4: Verify both users exist
SELECT 'New user exists' as check_type, id::text, email, name 
FROM public.users 
WHERE id = '916375dc-f279-4130-94c7-09f42a06fa56'
UNION ALL
SELECT 'Old user exists' as check_type, id::text, email, name 
FROM public.users 
WHERE id = 'e0931c7f-507b-4864-858a-860c8cf2cbb2';
