export interface FileGridItem {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  mime_type?: string;
  is_folder: boolean;
  is_shared: boolean;
  is_favorite: boolean;
  thumbnail_url?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface SearchParams {
  query: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  sizeMin?: number;
  sizeMax?: number;
  folder_id?: string;
  include_subfolders?: boolean;
  date_from?: string;
  date_to?: string;
}

export type ViewMode = {
  type: 'grid' | 'list';
  size?: 'sm' | 'md' | 'lg';
};

export interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  file_count?: number;
}

export interface FolderWithChildren extends Folder {
  children?: FolderWithChildren[];
  file_count?: number;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  type?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  size?: {
    min?: number;
    max?: number;
  };
}

export * from './drive';