-- Disable RLS for Development
-- Run this in your Supabase SQL editor if you already have tables with RLS enabled

-- Disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_usage DISABLE ROW LEVEL SECURITY;

-- Insert test user if it doesn't exist
INSERT INTO public.users (id, email, name, plan) 
VALUES (
    'e0931c7f-507b-4864-858a-860c8cf2cbb2', 
    'test@example.com', 
    'test', 
    'free'
) ON CONFLICT (id) DO NOTHING;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'folders', 'files', 'permissions', 'shares', 'file_versions', 'tags', 'file_tags', 'storage_usage');
