export interface Permission {
  id: string;
  user_id: string;
  resource_id: string;
  resource_type: 'file' | 'folder';
  permission_level: 'read' | 'write' | 'admin';
  granted_by: string;
  created_at: Date;
  expires_at?: Date;
}

export interface CreatePermissionRequest {
  user_id: string;
  resource_id: string;
  resource_type: 'file' | 'folder';
  permission_level: 'read' | 'write' | 'admin';
  expires_at?: Date;
}

export interface UpdatePermissionRequest {
  permission_level?: 'read' | 'write' | 'admin';
  expires_at?: Date;
}
