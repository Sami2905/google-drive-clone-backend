-- Update database schema to support trash functionality
-- Run this in your Supabase SQL editor

-- Add missing columns to folders table
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to files table if they don't exist
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_is_deleted ON public.folders(is_deleted);
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at ON public.folders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_is_deleted ON public.files(is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON public.files(deleted_at);

-- Verify the changes
SELECT 
    'folders' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'folders' 
    AND column_name IN ('is_deleted', 'deleted_at')
UNION ALL
SELECT 
    'files' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'files' 
    AND column_name IN ('is_deleted', 'deleted_at');
