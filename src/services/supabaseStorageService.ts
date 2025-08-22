import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Enhanced error logging interface
interface LogContext {
  operation: string;
  userId?: string;
  filePath?: string;
  folderPath?: string;
  bucketName?: string;
  metadata?: Record<string, any>;
}

interface StorageError extends Error {
  context: LogContext;
  timestamp: string;
  errorCode?: string;
}

// Enhanced logging function
const logError = (error: any, context: LogContext): StorageError => {
  const storageError = new Error(error.message || 'Storage operation failed') as StorageError;
  storageError.context = context;
  storageError.timestamp = new Date().toISOString();
  storageError.errorCode = error.code || error.status || 'UNKNOWN';
  
  // Structured logging
  console.error('🚨 Storage Error:', {
    message: storageError.message,
    code: storageError.errorCode,
    context,
    timestamp: storageError.timestamp,
    originalError: error
  });
  
  return storageError;
};

export interface FileUploadResult {
  path: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface StorageUsage {
  totalSize: number;
  fileCount: number;
}

export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor() {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    this.bucketName = process.env['SUPABASE_STORAGE_BUCKET'] || 'files';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Initialize storage bucket
   */
  async initializeBucket(): Promise<void> {
    const context: LogContext = {
      operation: 'initializeBucket',
      bucketName: this.bucketName
    };

    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      if (listError) {
        throw logError(listError, context);
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        // Create bucket if it doesn't exist
        const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['*/*'],
          fileSizeLimit: 52428800 // 50MB
        });
        if (createError) {
          throw logError(createError, context);
        }
        console.log(`✅ Created storage bucket: ${this.bucketName}`);
      } else {
        console.log(`✅ Storage bucket already exists: ${this.bucketName}`);
      }
    } catch (error: any) {
      if (error.context) {
        // Already logged
        throw error;
      }
      throw logError(error, context);
    }
  }

  /**
   * Upload file to storage
   */
  async uploadFile(file: File | Buffer, userId: string, folderPath: string = ''): Promise<FileUploadResult> {
    const context: LogContext = {
      operation: 'uploadFile',
      userId,
      folderPath,
      bucketName: this.bucketName,
      metadata: {
        fileSize: file instanceof File ? file.size : file.length,
        mimeType: file instanceof File ? file.type : 'application/octet-stream'
      }
    };

    try {
      const fileName = file instanceof File ? file.name : 'uploaded_file';
      const fileSize = file instanceof File ? file.size : file.length;
      const mimeType = file instanceof File ? file.type : 'application/octet-stream';
      
      // Generate unique file path
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const filePath = folderPath ? `${folderPath}/${timestamp}-${randomId}-${fileName}` : `${timestamp}-${randomId}-${fileName}`;
      
      context.filePath = filePath;
      
      // Upload file
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          contentType: mimeType,
          metadata: {
            userId,
            originalName: fileName,
            uploadedAt: new Date().toISOString()
          }
        });

      if (error) {
        throw logError(error, context);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log(`✅ File uploaded successfully: ${filePath} (${fileSize} bytes)`);

      return {
        path: filePath,
        size: fileSize,
        mimeType,
        url: urlData.publicUrl
      };
    } catch (error: any) {
      if (error.context) {
        // Already logged
        throw error;
      }
      throw logError(error, context);
    }
  }

  /**
   * Download file from storage
   */
  async downloadFile(filePath: string): Promise<Blob> {
    const context: LogContext = {
      operation: 'downloadFile',
      filePath,
      bucketName: this.bucketName
    };

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        throw logError(error, context);
      }
      if (!data) {
        throw logError(new Error('No data received'), context);
      }

      console.log(`✅ File downloaded successfully: ${filePath}`);
      return data;
    } catch (error: any) {
      if (error.context) {
        // Already logged
        throw error;
      }
      throw logError(error, context);
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    const context: LogContext = {
      operation: 'deleteFile',
      filePath,
      bucketName: this.bucketName
    };

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw logError(error, context);
      }

      console.log(`✅ File deleted successfully: ${filePath}`);
    } catch (error: any) {
      if (error.context) {
        // Already logged
        throw error;
      }
      throw logError(error, context);
    }
  }

  /**
   * Get file URL (public or signed)
   */
  async getFileUrl(filePath: string, signed: boolean = false, expiresIn: number = 3600): Promise<string> {
    const context: LogContext = {
      operation: 'getFileUrl',
      filePath,
      bucketName: this.bucketName,
      metadata: { signed, expiresIn }
    };

    try {
      if (signed) {
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .createSignedUrl(filePath, expiresIn);

        if (error) {
          throw logError(error, context);
        }
        return data.signedUrl;
      } else {
        const { data } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(filePath);

        return data.publicUrl;
      }
    } catch (error: any) {
      if (error.context) {
        // Already logged
        throw error;
      }
      throw logError(error, context);
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folderPath: string = '', limit: number = 100, offset: number = 0): Promise<Array<{ name: string; size: number; mimeType: string; path: string }>> {
    const context: LogContext = {
      operation: 'listFiles',
      folderPath,
      bucketName: this.bucketName,
      metadata: { limit, offset }
    };

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(folderPath, {
          limit,
          offset,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw logError(error, context);
      }

      console.log(`✅ Listed ${data.length} files from folder: ${folderPath || 'root'}`);

      return data.map(item => ({
        name: item.name,
        size: item.metadata?.['size'] || 0,
        mimeType: item.metadata?.['mimetype'] || 'application/octet-stream',
        path: item.name
      }));
    } catch (error: any) {
      if (error.context) {
        // Already logged
        throw error;
      }
      throw logError(error, context);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<StorageUsage> {
    const context: LogContext = {
      operation: 'getStorageUsage',
      bucketName: this.bucketName
    };

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', { limit: 1000 });

      if (error) {
        throw logError(error, context);
      }

      let totalSize = 0;
      let fileCount = 0;

      data.forEach(item => {
        if (item.metadata?.['size']) {
          totalSize += item.metadata['size'];
        }
        fileCount++;
      });

      console.log(`✅ Storage usage: ${fileCount} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

      return { totalSize, fileCount };
    } catch (error: any) {
      if (error.context) {
        // Already logged
        throw error;
      }
      throw logError(error, context);
    }
  }

  /**
   * Copy file to new location
   */
  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    const context: LogContext = {
      operation: 'copyFile',
      filePath: sourcePath,
      bucketName: this.bucketName,
      metadata: { destinationPath }
    };

    try {
      // Download source file
      const fileData = await this.downloadFile(sourcePath);
      
      // Convert Blob to Buffer for upload
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Upload to new location
      await this.uploadFile(buffer, 'system', destinationPath.split('/').slice(0, -1).join('/'));
      
      // Delete original file
      await this.deleteFile(sourcePath);

      console.log(`✅ File copied successfully: ${sourcePath} → ${destinationPath}`);
    } catch (error: any) {
      if (error.context) {
        // Already logged
        throw error;
      }
      throw logError(error, context);
    }
  }

  /**
   * Move file to new location
   */
  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    const context: LogContext = {
      operation: 'moveFile',
      filePath: sourcePath,
      bucketName: this.bucketName,
      metadata: { destinationPath }
    };

    try {
      // Download source file
      const fileData = await this.downloadFile(sourcePath);
      
      // Convert Blob to Buffer for upload
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Upload to new location
      await this.uploadFile(buffer, 'system', destinationPath.split('/').slice(0, -1).join('/'));
      
      // Delete original file
      await this.deleteFile(sourcePath);

      console.log(`✅ File moved successfully: ${sourcePath} → ${destinationPath}`);
    } catch (error: any) {
      if (error.context) {
        // Already logged
        throw error;
      }
      throw logError(error, context);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    const context: LogContext = {
      operation: 'fileExists',
      filePath,
      bucketName: this.bucketName
    };

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          limit: 1,
          offset: 0,
          search: filePath.split('/').pop() || ''
        });

      if (error) {
        console.warn(`⚠️  Error checking file existence: ${filePath}`, error.message);
        return false;
      }
      return data.length > 0;
    } catch (error: any) {
      console.warn(`⚠️  Error checking file existence: ${filePath}`, error.message);
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<{ size: number; mimeType: string; lastModified: Date } | null> {
    const context: LogContext = {
      operation: 'getFileMetadata',
      filePath,
      bucketName: this.bucketName
    };

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          limit: 1,
          offset: 0,
          search: filePath.split('/').pop() || ''
        });

      if (error || !data.length) return null;

      const item = data[0];
      if (!item) return null;

      return {
        size: item.metadata?.['size'] || 0,
        mimeType: item.metadata?.['mimetype'] || 'application/octet-stream',
        lastModified: new Date(item.updated_at || item.created_at || Date.now())
      };
    } catch (error: any) {
      console.warn(`⚠️  Error getting file metadata: ${filePath}`, error.message);
      return null;
    }
  }

  /**
   * Get signed URL for file access
   */
  async getSignedUrl(filePath: string, disposition: 'inline' | 'attachment' = 'inline'): Promise<string | null> {
    const context: LogContext = {
      operation: 'getSignedUrl',
      filePath,
      bucketName: this.bucketName
    };

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, 3600, { // 1 hour expiry
          download: disposition === 'attachment'
        });

      if (error) {
        console.warn(`⚠️  Error generating signed URL for: ${filePath}`, error.message);
        return null;
      }

      return data.signedUrl;
    } catch (error: any) {
      console.warn(`⚠️  Error generating signed URL for: ${filePath}`, error.message);
      return null;
    }
  }
}

// Export lazy-loaded singleton instance
let _supabaseStorageService: SupabaseStorageService | null = null;

export const supabaseStorageService = {
  get instance(): SupabaseStorageService {
    if (!_supabaseStorageService) {
      _supabaseStorageService = new SupabaseStorageService();
    }
    return _supabaseStorageService;
  }
};
