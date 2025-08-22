-- Initialize root folder and storage for test user
-- Run this in your Supabase SQL editor

-- Step 1: Create root folder for test user
DO $$
DECLARE
    root_folder_id UUID := '00000000-0000-0000-0000-000000000000'; -- Special UUID for root folder
BEGIN
    -- Create root folder for test user if it doesn't exist
    INSERT INTO public.folders (id, name, description, parent_id, user_id, path, is_shared)
    VALUES (
        root_folder_id,
        'My Drive',
        'Root folder',
        NULL, -- No parent for root
        '916375dc-f279-4130-94c7-09f42a06fa56', -- Test user ID
        '/',
        FALSE
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description;

    -- Step 2: Ensure storage usage is initialized
    INSERT INTO public.storage_usage (user_id, total_size, file_count, last_calculated)
    VALUES (
        '916375dc-f279-4130-94c7-09f42a06fa56',
        0,
        0,
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        last_calculated = NOW();

    -- Step 3: Verify setup
    RAISE NOTICE 'Root folder ID: %', root_folder_id;
END $$;

-- Step 4: Verify setup
SELECT 'Root folder exists' as check_type, id::text, name, user_id::text
FROM public.folders 
WHERE id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 'Storage usage exists' as check_type, user_id::text, total_size::text, file_count::text
FROM public.storage_usage
WHERE user_id = '916375dc-f279-4130-94c7-09f42a06fa56';
