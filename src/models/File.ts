import { Permission } from './Permission';

export interface File {
  id: string;
  name: string;
  original_name: string;
  description?: string;
  mime_type: string;
  size: number;
  folder_id?: string;
  user_id: string;
  storage_path: string;
  storage_provider: 'supabase' | 's3';
  is_shared: boolean;
  is_deleted: boolean;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFileRequest {
  name: string;
  original_name: string;
  description?: string;
  mime_type: string;
  size: number;
  folder_id?: string;
  storage_path: string;
  storage_provider?: 'supabase' | 's3';
}

export interface UpdateFileRequest {
  name?: string;
  description?: string;
  folder_id?: string;
  is_shared?: boolean;
}

export interface FileWithMetadata extends File {
  url?: string;
  thumbnail_url?: string;
  preview_url?: string;
  tags?: string[];
  permissions?: Permission[];
}

export interface FileVersion {
  id: string;
  file_id: string;
  version_number: number;
  storage_path: string;
  size: number;
  created_by: string;
  created_at: Date;
}
