export interface File {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  mime_type?: string;
  is_folder: boolean;
  is_shared: boolean;
  is_favorite: boolean;
  thumbnail_url?: string;
}
