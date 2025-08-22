export interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  user_id: string;
  path?: string;
  is_shared: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  parent_id?: string;
  path?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  parent_id?: string;
  path?: string;
  is_shared?: boolean;
}

export interface FolderWithChildren extends Folder {
  children?: Folder[];
  file_count?: number;
  total_size?: number;
}
