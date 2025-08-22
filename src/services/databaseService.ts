import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Folder,
  CreateFolderRequest,
  UpdateFolderRequest,
  FolderWithChildren,
  File,
  CreateFileRequest,
  UpdateFileRequest,
  FileWithMetadata,
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  Share,
  CreateShareRequest,
  UpdateShareRequest,
  ShareWithResource,
  PaginationParams,
  PaginatedResponse,
  SearchParams
} from '../models';

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Use service role key to bypass RLS policies for development
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  // User Management
  async createUser(userData: CreateUserRequest): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Folder Management
  async createFolder(folderData: CreateFolderRequest, userId: string): Promise<Folder> {
    const { data, error } = await this.supabase
      .from('folders')
      .insert([{ ...folderData, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getFolderById(id: string, userId: string): Promise<Folder | null> {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getFoldersByParentId(parentId: string | null, userId: string): Promise<Folder[]> {
    let query = this.supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId);
    
    // Handle null parent_id (root folders) vs specific parent_id
    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }
    
    const { data, error } = await query.order('name');

    if (error) throw error;
    return data || [];
  }

  async getFolderTree(userId: string): Promise<FolderWithChildren[]> {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;

    const folders = data || [];
    return this.buildFolderTree(folders);
  }

  private buildFolderTree(folders: Folder[], parentId: string | null = null): FolderWithChildren[] {
    return folders
      .filter(folder => folder.parent_id === parentId)
      .map(folder => ({
        ...folder,
        children: this.buildFolderTree(folders, folder.id)
      }));
  }

  async updateFolder(id: string, updates: UpdateFolderRequest, userId: string): Promise<Folder> {
    const { data, error } = await this.supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFolder(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // File Management
  async createFile(fileData: CreateFileRequest, userId: string): Promise<File> {
    const { data, error } = await this.supabase
      .from('files')
      .insert([{ ...fileData, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getFileById(id: string, userId: string): Promise<File | null> {
    const { data, error } = await this.supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getFilesByFolderId(folderId: string | null, userId: string, params: PaginationParams = {}): Promise<PaginatedResponse<File>> {
    const { limit = 50, offset = 0 } = params;

    let query = this.supabase
      .from('files')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    // Handle null folder_id (root files) vs specific folder_id
    if (folderId === null) {
      query = query.is('folder_id', null);
    } else {
      query = query.eq('folder_id', folderId);
    }

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data || [],
      pagination: {
        limit,
        offset,
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages
      }
    };
  }

  async updateFile(id: string, updates: UpdateFileRequest, userId: string): Promise<File> {
    const { data, error } = await this.supabase
      .from('files')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async softDeleteFile(id: string, userId: string): Promise<boolean> {
    try {
      // First check if the columns exist by trying to update
      const { data, error } = await this.supabase
        .from('files')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        // If the columns don't exist, fall back to permanent deletion
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.warn('is_deleted column not found, falling back to permanent deletion');
          await this.permanentlyDeleteFile(id, userId);
          return true;
        }
        throw error;
      }
      return !!data;
    } catch (error) {
      console.error('Error in softDeleteFile:', error);
      // Fallback to permanent deletion
      try {
        await this.permanentlyDeleteFile(id, userId);
        return true;
      } catch (fallbackError) {
        console.error('Fallback deletion also failed:', fallbackError);
        return false;
      }
    }
  }

  async permanentlyDeleteFile(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('files')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async restoreFile(id: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('files')
        .update({ 
          is_deleted: false, 
          deleted_at: null 
        })
        .eq('id', id)
        .eq('user_id', userId)
        .eq('is_deleted', true)
        .select()
        .single();

      if (error) {
        // If the columns don't exist, the file can't be restored
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.warn('is_deleted column not found, file cannot be restored');
          return false;
        }
        throw error;
      }
      return !!data;
    } catch (error) {
      console.error('Error in restoreFile:', error);
      return false;
    }
  }

  async getTrashItems(userId: string, limit: number = 100, offset: number = 0): Promise<{ files: File[], folders: Folder[] }> {
    try {
      // Get deleted files
      const { data: files, error: filesError } = await this.supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filesError) {
        console.warn('Files table might not have is_deleted column:', filesError.message);
        // Fallback: return empty files array
        return { files: [], folders: [] };
      }

      // Try to get deleted folders, but handle gracefully if columns don't exist
      let folders: Folder[] = [];
      try {
        const { data: foldersData, error: foldersError } = await this.supabase
          .from('folders')
          .select('*')
          .eq('user_id', userId)
          .eq('is_deleted', true)
          .order('deleted_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!foldersError) {
          folders = foldersData || [];
        }
      } catch (error) {
        console.warn('Folders table might not have is_deleted column, skipping folders:', error);
        // Continue without folders
      }

      return {
        files: files || [],
        folders: folders
      };
    } catch (error) {
      console.error('Error getting trash items:', error);
      return { files: [], folders: [] };
    }
  }

  // Search
  async searchFiles(searchParams: SearchParams, userId: string, params: PaginationParams = {}): Promise<PaginatedResponse<FileWithMetadata>> {
    const { limit = 50, offset = 0 } = params;
    const { query, type, mime_type, date_from, date_to, size_min, size_max, tags } = searchParams;

    let queryBuilder = this.supabase
      .from('files')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (type && type !== 'all') {
      if (type === 'folder') {
        queryBuilder = queryBuilder.eq('mime_type', 'folder');
      } else {
        queryBuilder = queryBuilder.neq('mime_type', 'folder');
      }
    }

    if (mime_type) {
      queryBuilder = queryBuilder.eq('mime_type', mime_type);
    }

    if (date_from) {
      queryBuilder = queryBuilder.gte('created_at', date_from.toISOString());
    }

    if (date_to) {
      queryBuilder = queryBuilder.lte('created_at', date_to.toISOString());
    }

    if (size_min !== undefined) {
      queryBuilder = queryBuilder.gte('size', size_min);
    }

    if (size_max !== undefined) {
      queryBuilder = queryBuilder.lte('size', size_max);
    }

    if (limit) queryBuilder = queryBuilder.limit(limit);
    if (offset) queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder.order('created_at', { ascending: false });

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data || [],
      pagination: {
        limit,
        offset,
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages
      }
    };
  }

  // Permission Management
  async createPermission(permissionData: CreatePermissionRequest, grantedBy: string): Promise<Permission> {
    const { data, error } = await this.supabase
      .from('permissions')
      .insert([{ ...permissionData, granted_by: grantedBy }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPermissionsByResource(resourceId: string, resourceType: 'file' | 'folder'): Promise<Permission[]> {
    const { data, error } = await this.supabase
      .from('permissions')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType);

    if (error) throw error;
    return data || [];
  }

  async updatePermission(id: string, updates: UpdatePermissionRequest): Promise<Permission> {
    const { data, error } = await this.supabase
      .from('permissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePermission(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('permissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Sharing
  async createShare(shareData: CreateShareRequest, createdBy: string): Promise<Share> {
    const shareToken = this.generateShareToken();
    
    const { data, error } = await this.supabase
      .from('shares')
      .insert([{ 
        ...shareData, 
        created_by: createdBy,
        share_token: shareToken,
        password_hash: shareData.password ? await this.hashPassword(shareData.password) : undefined
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getShareByToken(token: string): Promise<ShareWithResource | null> {
    const { data, error } = await this.supabase
      .from('shares')
      .select(`
        *,
        files!inner(name, size, mime_type),
        folders!inner(name)
      `)
      .eq('share_token', token)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateShare(id: string, updates: UpdateShareRequest): Promise<Share> {
    const updateData = { ...updates };
    if (updates.password) {
      updateData.password_hash = await this.hashPassword(updates.password);
      delete updateData.password;
    }

    const { data, error } = await this.supabase
      .from('shares')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteShare(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('shares')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Storage Usage
  async getStorageUsage(userId: string): Promise<{ total_size: number; file_count: number }> {
    const { data, error } = await this.supabase
      .from('storage_usage')
      .select('total_size, file_count')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data || { total_size: 0, file_count: 0 };
  }

  // Utility methods
  private generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private async hashPassword(password: string): Promise<string> {
    // In production, use a proper hashing library like bcrypt
    return btoa(password);
  }
}

// Export lazy-loaded singleton instance
let _databaseService: DatabaseService | null = null;

export const databaseService = {
  get instance(): DatabaseService {
    if (!_databaseService) {
      _databaseService = new DatabaseService();
    }
    return _databaseService;
  }
};
