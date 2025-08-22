export interface Share {
  id: string;
  resource_id: string;
  resource_type: 'file' | 'folder';
  share_token: string;
  access_level: 'read' | 'write';
  password_protected: boolean;
  password_hash?: string;
  expires_at?: Date;
  created_by: string;
  created_at: Date;
}

export interface CreateShareRequest {
  resource_id: string;
  resource_type: 'file' | 'folder';
  access_level: 'read' | 'write';
  password_protected?: boolean;
  password?: string;
  expires_at?: Date;
}

export interface UpdateShareRequest {
  access_level?: 'read' | 'write';
  password_protected?: boolean;
  password?: string;
  password_hash?: string;
  expires_at?: Date;
}

export interface ShareWithResource extends Share {
  resource_name?: string;
  resource_size?: number;
  resource_type_name?: string;
}
