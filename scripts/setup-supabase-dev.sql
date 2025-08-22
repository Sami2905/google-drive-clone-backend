-- Supabase Database Setup for Google Drive Clone (Development Version)
-- This version disables RLS for development purposes
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
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

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    path TEXT,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Create permissions table for sharing
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
    permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
    granted_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, resource_id, resource_type)
);

-- Create shares table for public sharing
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource_id UUID NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
    share_token TEXT UNIQUE NOT NULL,
    access_level TEXT NOT NULL CHECK (access_level IN ('read', 'write')),
    password_protected BOOLEAN DEFAULT FALSE,
    password_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file_versions table for versioning
CREATE TABLE IF NOT EXISTS public.file_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    size BIGINT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, version_number)
);

-- Create tags table for file organization
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, user_id)
);

-- Create file_tags junction table
CREATE TABLE IF NOT EXISTS public.file_tags (
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (file_id, tag_id)
);

-- Create storage_usage table for tracking user storage
CREATE TABLE IF NOT EXISTS public.storage_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_size BIGINT DEFAULT 0,
    file_count INTEGER DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_mime_type ON public.files(mime_type);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at);
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON public.permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_shares_token ON public.shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON public.file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_file_id ON public.file_tags(file_id);

-- IMPORTANT: DISABLE RLS for development
-- This allows the mock authentication system to work
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_usage DISABLE ROW LEVEL SECURITY;

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate storage usage
CREATE OR REPLACE FUNCTION calculate_user_storage_usage(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.storage_usage (user_id, total_size, file_count, last_calculated)
    VALUES (
        user_uuid,
        COALESCE((SELECT SUM(size) FROM public.files WHERE user_id = user_uuid AND NOT is_deleted), 0),
        COALESCE((SELECT COUNT(*) FROM public.files WHERE user_id = user_uuid AND NOT is_deleted), 0),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_size = EXCLUDED.total_size,
        file_count = EXCLUDED.file_count,
        last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update storage usage when files change
CREATE OR REPLACE FUNCTION update_storage_on_file_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM calculate_user_storage_usage(NEW.user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM calculate_user_storage_usage(NEW.user_id);
        IF OLD.user_id != NEW.user_id THEN
            PERFORM calculate_user_storage_usage(OLD.user_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM calculate_user_storage_usage(OLD.user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for storage calculation
CREATE TRIGGER trigger_update_storage_usage
    AFTER INSERT OR UPDATE OR DELETE ON public.files
    FOR EACH ROW EXECUTE FUNCTION update_storage_on_file_change();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Grant permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;

-- Insert a test user for development
INSERT INTO public.users (id, email, name, plan) 
VALUES (
    'e0931c7f-507b-4864-858a-860c8cf2cbb2', 
    'test@example.com', 
    'test', 
    'free'
) ON CONFLICT (id) DO NOTHING;
