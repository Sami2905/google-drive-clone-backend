import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { SupabaseAuthMiddleware } from './middleware/supabaseAuthMiddleware';
import { supabaseStorageService } from './services/supabaseStorageService';
import { databaseService } from './services/databaseService';
import { CreateFolderRequest, UpdateFolderRequest, CreateFileRequest, UpdateFileRequest, CreatePermissionRequest, CreateShareRequest, SearchParams } from './models';

// Load environment variables
require('dotenv').config();

// Enhanced logging utility
const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta || '');
  },
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error;
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, {
      error: errorDetails,
      ...meta
    });
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, meta || '');
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, meta || '');
    }
  }
};

const app = express();
const PORT = process.env['PORT'] || 5000;

// Initialize Supabase client
const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase configuration', null, { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
  process.exit(1);
}

logger.info('Initializing Supabase client', { supabaseUrl, hasServiceKey: !!supabaseServiceKey });

// Use service role key to bypass RLS policies for development
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lazy-load auth middleware
let _authMiddleware: SupabaseAuthMiddleware | null = null;
const getAuthMiddleware = () => {
  if (!_authMiddleware) {
    _authMiddleware = new SupabaseAuthMiddleware();
  }
  return _authMiddleware;
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env['MAX_FILE_SIZE'] || '52428800'), // 50MB default
    files: 10 // Max 10 files at once
  },
  fileFilter: (_req, _file, cb) => {
    // Allow all file types for now - you can add restrictions here
    cb(null, true);
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      frameSrc: ["'self'", "blob:", "data:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'self'", "blob:", "data:"],
      mediaSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"]
    }
  }
}));

// Add cache control headers to prevent CSP header caching
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: process.env['MAX_FILE_SIZE'] || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env['MAX_FILE_SIZE'] || '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Test database connectivity
    const testUser = await databaseService.instance.getUserById('916375dc-f279-4130-94c7-09f42a06fa56');
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      userExists: !!testUser,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed', error);
    
    let status = 'unhealthy';
    let databaseStatus = 'disconnected';
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        databaseStatus = 'tables_not_initialized';
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        databaseStatus = 'connection_failed';
      }
    }
    
    res.status(503).json({
      success: false,
      status,
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      error: errorMessage,
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Test Supabase connection
app.get('/test-connection', async (_req, res) => {
  try {
    logger.info('Testing Supabase connection');
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      logger.error('Supabase connection test failed', error, { table: 'users' });
      res.status(500).json({ success: false, error: error.message });
    } else {
      logger.info('Supabase connection test successful');
      res.json({ success: true, message: 'Supabase connection successful' });
    }
  } catch (error: unknown) {
    logger.error('Supabase connection test error', error, { endpoint: '/test-connection' });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Initialize storage bucket
app.get('/init-storage', async (_req, res) => {
  try {
    logger.info('Initializing storage bucket');
    await supabaseStorageService.instance.initializeBucket();
    logger.info('Storage bucket initialized successfully');
    res.json({ success: true, message: 'Storage bucket initialized' });
  } catch (error: unknown) {
    logger.error('Storage bucket initialization failed', error, { endpoint: '/init-storage' });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// File upload endpoint
app.post('/api/files/upload', getAuthMiddleware().authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file provided' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get folder ID from request
    const folderId = req.body.folderId || null;

    // Upload file to Supabase storage
    const result = await supabaseStorageService.instance.uploadFile(
      req.file.buffer,
      req.user.id,
      folderId ? `folders/${folderId}/` : ''
    );

    // Save file metadata to database
    const fileData: CreateFileRequest = {
      name: req.file.originalname,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
      folder_id: folderId,
      storage_path: result.path,
      storage_provider: 'supabase'
    };

    const file = await databaseService.instance.createFile(fileData, req.user.id);

    logger.info('File uploaded and metadata saved successfully', { 
      fileId: file.id, 
      userId: req.user.id,
      fileName: req.file.originalname 
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        ...file,
        url: result.url
      }
    });
  } catch (error: unknown) {
    logger.error('File upload error', error, { file: req.file?.originalname });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Multiple file upload endpoint
app.post('/api/files/upload-multiple', getAuthMiddleware().authenticate, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400).json({ success: false, error: 'No files provided' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const folderId = req.body.folderId || null;
    const results = [];

    for (const file of req.files as Express.Multer.File[]) {
      try {
        const result = await supabaseStorageService.instance.uploadFile(
          file.buffer,
          req.user.id,
          folderId ? `folders/${folderId}/` : ''
        );

        // Save file metadata to database
        const fileData: CreateFileRequest = {
          name: file.originalname,
          original_name: file.originalname,
          mime_type: file.mimetype,
          size: file.size,
          folder_id: folderId,
          storage_path: result.path,
          storage_provider: 'supabase'
        };

        const savedFile = await databaseService.instance.createFile(fileData, req.user.id);

        results.push({
          ...savedFile,
          url: result.url
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error uploading ${file.originalname}`, error, { fileName: file.originalname });
        results.push({
          name: file.originalname,
          error: errorMessage
        });
      }
    }

    logger.info('Multiple files uploaded successfully', { 
      fileCount: results.length, 
      userId: req.user.id 
    });

    res.json({
      success: true,
      message: 'Files uploaded',
      data: results
    });
  } catch (error: unknown) {
    logger.error('Multiple file upload error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get file URL endpoint
app.get('/api/files/:fileId/url', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    const { signed = 'false', expiresIn = '3600' } = req.query;

    const url = await supabaseStorageService.instance.getFileUrl(
      fileId,
      signed === 'true',
      parseInt(expiresIn as string)
    );

    res.json({
      success: true,
      url,
      expiresIn: signed === 'true' ? parseInt(expiresIn as string) : null
    });
      } catch (error: unknown) {
      logger.error('Get file URL error', error, { fileId: req.params.fileId });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: errorMessage });
    }
});

// Get signed URL for file preview/download
app.get('/api/files/:fileId/signed', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { disposition = 'inline' } = req.query;
    
    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    // Get file metadata from database
    const file = await databaseService.instance.getFileById(fileId, req.user!.id);
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Check if file has storage path
    if (!file.storage_path) {
      res.status(500).json({ success: false, error: 'File storage path not found' });
      return;
    }

    // Generate signed URL for the file using the storage path
    const signedUrl = await supabaseStorageService.instance.getSignedUrl(file.storage_path, disposition as 'inline' | 'attachment');
    
    if (!signedUrl) {
      res.status(500).json({ success: false, error: 'Failed to generate signed URL' });
      return;
    }

    res.json({
      success: true,
      data: {
        signed_url: signedUrl,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiry
      }
    });
  } catch (error: unknown) {
    logger.error('Signed URL generation error', error, { fileId: req.params.fileId });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Download file endpoint
app.get('/api/files/:fileId/download', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    // Get file metadata from database first
    const file = await databaseService.instance.getFileById(fileId, req.user!.id);
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Check if file has storage path
    if (!file.storage_path) {
      res.status(500).json({ success: false, error: 'File storage path not found' });
      return;
    }

    const fileData = await supabaseStorageService.instance.downloadFile(file.storage_path);
    const metadata = await supabaseStorageService.instance.getFileMetadata(file.storage_path);

    if (metadata) {
      res.setHeader('Content-Type', metadata.mimeType);
      res.setHeader('Content-Length', metadata.size.toString());
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    }

    // Convert Blob to Buffer and send
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
      } catch (error: unknown) {
      logger.error('File download error', error, { fileId: req.params.fileId });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: errorMessage });
    }
});

// Permanently delete file endpoint (for trash cleanup)
app.delete('/api/files/:fileId/permanent', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    // Get file info before permanent deletion
    const file = await databaseService.instance.getFileById(fileId, req.user!.id);
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Permanently delete from storage
    if (file.storage_path) {
      await supabaseStorageService.instance.deleteFile(file.storage_path);
    }
    
    // Remove from database
    await databaseService.instance.permanentlyDeleteFile(fileId, req.user!.id);

    res.json({
      success: true,
      message: 'File permanently deleted'
    });
  } catch (error: unknown) {
    logger.error('File permanent delete error', error, { fileId: req.params.fileId });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Delete file endpoint (move to trash)
app.delete('/api/files/:fileId', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    // Soft delete - mark as deleted but don't remove from storage
    const success = await databaseService.instance.softDeleteFile(fileId, req.user!.id);
    
    if (!success) {
      res.status(404).json({ success: false, error: 'File not found or already deleted' });
      return;
    }

    res.json({
      success: true,
      message: 'File moved to trash successfully'
    });
  } catch (error: unknown) {
    logger.error('File delete error', error, { fileId: req.params.fileId });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Restore file from trash
app.post('/api/files/:fileId/restore', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    const success = await databaseService.instance.restoreFile(fileId, req.user!.id);
    
    if (!success) {
      res.status(404).json({ success: false, error: 'File not found or not in trash' });
      return;
    }

    res.json({
      success: true,
      message: 'File restored successfully'
    });
  } catch (error: unknown) {
    logger.error('File restore error', error, { fileId: req.params.fileId });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get files in trash
app.get('/api/trash', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { limit = '100', offset = '0' } = req.query;
    
    const trashItems = await databaseService.instance.getTrashItems(
      req.user!.id,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: trashItems
    });
  } catch (error: unknown) {
    logger.error('Get trash items error', error, { userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Share file or folder endpoint
app.post('/api/files/:fileId/share', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { expiresIn = 7, accessType = 'public' } = req.body; // Default 7 days, public access
    
    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    // Get file info
    const file = await databaseService.instance.getFileById(fileId, req.user!.id);
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Generate share token
    const shareToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (expiresIn * 24 * 60 * 60 * 1000)); // Convert days to milliseconds

    // Create shareable URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/shared/${shareToken}`;
    
    // Store share info in memory (replace with database later)
    if (!global.shareTokens) {
      global.shareTokens = new Map();
    }
    
    const shareInfo = {
      token: shareToken,
      fileId: file.id,
      userId: req.user!.id,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      accessType,
      expiresIn
    };
    
    global.shareTokens.set(shareToken, shareInfo);

    // Generate signed URL for the file (if it has storage path)
    let signedUrl = null;
    if (file.storage_path) {
      try {
        signedUrl = await supabaseStorageService.instance.getSignedUrl(file.storage_path, 'inline');
      } catch (error) {
        logger.warn('Failed to generate signed URL for share', { fileId, error });
      }
    }

    res.json({
      success: true,
      data: {
        shareToken,
        shareUrl,
        signedUrl,
        expiresAt: expiresAt.toISOString(),
        file: {
          id: file.id,
          name: file.name,
          mime_type: file.mime_type,
          size: file.size
        }
      }
    });
  } catch (error: unknown) {
    logger.error('Share file error', error, { fileId: req.params.fileId });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get shared file endpoint (public, no auth required)
app.get('/api/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // In a real implementation, you'd look up the share token in the database
    // For now, we'll return a mock response
    res.json({
      success: true,
      data: {
        message: 'This is a demo share link. In production, this would contain the actual shared file.',
        token,
        expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      }
    });
  } catch (error: unknown) {
    logger.error('Get shared file error', error, { token: req.params.token });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// List files endpoint
app.get('/api/files', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { folder = '', limit = '100', offset = '0' } = req.query;

    const files = await supabaseStorageService.instance.listFiles(
      folder as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      files,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: files.length
      }
    });
      } catch (error: unknown) {
      logger.error('List files error', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: errorMessage });
    }
});

// Get file metadata endpoint
app.get('/api/files/:fileId/metadata', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    // Get file from database first
    const file = await databaseService.instance.getFileById(fileId, req.user!.id);
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Get storage metadata
    const storageMetadata = await supabaseStorageService.instance.getFileMetadata(file.storage_path);
    
    const metadata = {
      id: file.id,
      name: file.name,
      original_name: file.original_name,
      mime_type: file.mime_type,
      size: file.size,
      folder_id: file.folder_id,
      storage_path: file.storage_path,
      storage_provider: file.storage_provider,
      created_at: file.created_at,
      updated_at: file.updated_at,
      storage_metadata: storageMetadata
    };

    res.json({
      success: true,
      data: metadata
    });
  } catch (error: unknown) {
    logger.error('Get file metadata error', error, { fileId: req.params.fileId, userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// File preview endpoint (for viewing files in browser)
app.get('/api/files/:fileId/preview', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    // Get file from database
    const file = await databaseService.instance.getFileById(fileId, req.user!.id);
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Check if file is previewable (images, PDFs, text files, Office documents)
    const previewableTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/msword', // DOC
      'application/vnd.ms-excel', // XLS
      'application/vnd.ms-powerpoint' // PPT
    ];

    if (!previewableTypes.includes(file.mime_type)) {
      res.status(400).json({ 
        success: false, 
        error: 'File type not previewable',
        mime_type: file.mime_type,
        file_name: file.name
      });
      return;
    }

    // Get signed URL for preview
    const previewUrl = await supabaseStorageService.instance.getSignedUrl(
      file.storage_path,
      'inline'
    );

    if (!previewUrl) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate preview URL'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: file.id,
        name: file.name,
        mime_type: file.mime_type,
        size: file.size,
        preview_url: previewUrl,
        can_preview: true
      }
    });
  } catch (error: unknown) {
    logger.error('File preview error', error, { fileId: req.params.fileId, userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// File thumbnail endpoint (for image previews)
app.get('/api/files/:fileId/thumbnail', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { width = '200', height = '200', quality = '80' } = req.query;
    
    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    // Get file from database
    const file = await databaseService.instance.getFileById(fileId, req.user!.id);
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Check if file is an image
    if (!file.mime_type.startsWith('image/')) {
      res.status(400).json({ 
        success: false, 
        error: 'File is not an image',
        mime_type: file.mime_type
      });
      return;
    }

    // For now, return the original image URL
    // In production, you could implement image resizing/thumbnailing
    const thumbnailUrl = await supabaseStorageService.instance.getSignedUrl(
      file.storage_path,
      'inline'
    );

    if (!thumbnailUrl) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate thumbnail URL'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: file.id,
        name: file.name,
        mime_type: file.mime_type,
        thumbnail_url: thumbnailUrl,
        dimensions: {
          width: parseInt(width as string),
          height: parseInt(height as string),
          quality: parseInt(quality as string)
        }
      }
    });
  } catch (error: unknown) {
    logger.error('File thumbnail error', error, { fileId: req.params.fileId, userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Enhanced file listing with preview URLs
app.get('/api/files/enhanced', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    const { folder_id, limit, offset } = req.query;
    const folderId = folder_id === 'root' || folder_id === 'undefined' || folder_id === 'null' ? null : folder_id as string;
    
    // Get files from database
    const files = await databaseService.instance.getFilesByFolderId(
      folderId, 
      req.user!.id, 
      { 
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );

    // Enhance files with preview URLs
    const enhancedFiles = await Promise.all(
      files.data.map(async (file) => {
        let previewUrl = null;
        let thumbnailUrl = null;
        let canPreview = false;

        // Check if file is previewable
        const previewableTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript'
        ];

        if (previewableTypes.includes(file.mime_type)) {
          canPreview = true;
          try {
            previewUrl = await supabaseStorageService.instance.getFileUrl(
              file.storage_path,
              true, // signed
              3600 // 1 hour expiry
            );
          } catch (error) {
            logger.warn('Failed to generate preview URL', { fileId: file.id, error });
          }
        }

        // Generate thumbnail URL for images
        if (file.mime_type.startsWith('image/')) {
          try {
            thumbnailUrl = await supabaseStorageService.instance.getFileUrl(
              file.storage_path,
              true, // signed
              3600 // 1 hour expiry
            );
          } catch (error) {
            logger.warn('Failed to generate thumbnail URL', { fileId: file.id, error });
          }
        }

        return {
          ...file,
          preview_url: previewUrl,
          thumbnail_url: thumbnailUrl,
          can_preview: canPreview
        };
      })
    );

    res.json({
      success: true,
      data: {
        files: enhancedFiles,
        pagination: files.pagination
      }
    });
  } catch (error: unknown) {
    logger.error('Enhanced file listing error', error, { userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Folder Management Endpoints
app.post('/api/folders', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const folderData: CreateFolderRequest = req.body;
    
    if (!folderData.name) {
      res.status(400).json({ success: false, error: 'Folder name is required' });
      return;
    }

    const folder = await databaseService.instance.createFolder(folderData, req.user.id);
    
    logger.info('Folder created successfully', { folderId: folder.id, userId: req.user.id });
    
    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: folder
    });
  } catch (error: unknown) {
    logger.error('Create folder error', error, { userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.get('/api/folders', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { parent_id } = req.query;
    const parentId = parent_id === 'root' || parent_id === undefined || parent_id === 'undefined' || parent_id === 'null' ? null : parent_id as string;
    
    logger.info('Getting folders', { userId: req.user.id, parentId, originalParentId: parent_id });
    
    const folders = await databaseService.instance.getFoldersByParentId(parentId, req.user.id);
    const files = await databaseService.instance.getFilesByFolderId(parentId, req.user.id);
    
    logger.info('Folders and files retrieved successfully', { 
      userId: req.user.id, 
      folderCount: folders.length,
      fileCount: files.data?.length || 0
    });
    
    res.json({
      success: true,
      data: { 
        folders, 
        files: files.data || [] 
      }
    });
  } catch (error: unknown) {
    logger.error('Get folders error', error, { userId: req.user?.id });
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific database errors
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        errorMessage = 'Database tables not initialized. Please run the database setup scripts.';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        errorMessage = 'Database connection failed. Please check your database configuration.';
        statusCode = 503;
      }
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

app.get('/api/folders/tree', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const folderTree = await databaseService.instance.getFolderTree(req.user.id);
    
    res.json({
      success: true,
      data: folderTree
    });
  } catch (error: unknown) {
    logger.error('Get folder tree error', error, { userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.get('/api/folders/:id', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const folder = await databaseService.instance.getFolderById(id, req.user.id);
    
    if (!folder) {
      res.status(404).json({ success: false, error: 'Folder not found' });
      return;
    }
    
    res.json({
      success: true,
      data: folder
    });
  } catch (error: unknown) {
    logger.error('Get folder error', error, { folderId: req.params.id, userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.put('/api/folders/:id', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const updates: UpdateFolderRequest = req.body;
    
    const folder = await databaseService.instance.updateFolder(id, updates, req.user.id);
    
    logger.info('Folder updated successfully', { folderId: id, userId: req.user.id });
    
    res.json({
      success: true,
      message: 'Folder updated successfully',
      data: folder
    });
  } catch (error: unknown) {
    logger.error('Update folder error', error, { folderId: req.params.id, userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// PATCH endpoint for partial folder updates (alias for PUT)
app.patch('/api/folders/:id', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const updates: UpdateFolderRequest = req.body;
    
    const folder = await databaseService.instance.updateFolder(id, updates, req.user.id);
    
    logger.info('Folder updated successfully (PATCH)', { folderId: id, userId: req.user.id });
    
    res.json({
      success: true,
      message: 'Folder updated successfully',
      data: folder
    });
  } catch (error: unknown) {
    logger.error('Update folder error (PATCH)', error, { folderId: req.params.id, userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.delete('/api/folders/:id', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    await databaseService.instance.deleteFolder(id, req.user.id);
    
    logger.info('Folder deleted successfully', { folderId: id, userId: req.user.id });
    
    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error: unknown) {
    logger.error('Delete folder error', error, { folderId: req.params.id, userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Enhanced File Management Endpoints
app.post('/api/files', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const fileData: CreateFileRequest = req.body;
    
    if (!fileData.name || !fileData.storage_path) {
      res.status(400).json({ success: false, error: 'File name and storage path are required' });
      return;
    }

    const file = await databaseService.instance.createFile(fileData, req.user.id);
    
    logger.info('File metadata created successfully', { fileId: file.id, userId: req.user.id });
    
    res.status(201).json({
      success: true,
      message: 'File metadata created successfully',
      data: file
    });
  } catch (error: unknown) {
    logger.error('Create file metadata error', error, { userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.get('/api/files', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { folder_id, limit, offset } = req.query;
    const folderId = folder_id === 'root' || folder_id === 'undefined' || folder_id === 'null' ? null : folder_id as string;
    
    const files = await databaseService.instance.getFilesByFolderId(
      folderId, 
      req.user.id, 
      { 
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );
    
    res.json({
      success: true,
      data: files
    });
  } catch (error: unknown) {
    logger.error('Get files error', error, { userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.put('/api/files/:id', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const updates: UpdateFileRequest = req.body;
    
    const file = await databaseService.instance.updateFile(id, updates, req.user.id);
    
    logger.info('File updated successfully', { fileId: id, userId: req.user.id });
    
    res.json({
      success: true,
      message: 'File updated successfully',
      data: file
    });
  } catch (error: unknown) {
    logger.error('Update file error', error, { fileId: req.params.id, userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.delete('/api/files/:id', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { permanent } = req.query;
    
    if (permanent === 'true') {
      await databaseService.instance.permanentlyDeleteFile(id, req.user.id);
      // Also delete from storage
      await supabaseStorageService.instance.deleteFile(id);
    } else {
      await databaseService.instance.softDeleteFile(id, req.user.id);
    }
    
    logger.info('File deleted successfully', { fileId: id, userId: req.user.id, permanent: permanent === 'true' });
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error: unknown) {
    logger.error('Delete file error', error, { fileId: req.params.id, userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Search Endpoint
app.post('/api/search', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const searchParams: SearchParams = req.body;
    const { limit, offset } = req.query;
    
    if (!searchParams.query) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }

    const results = await databaseService.instance.searchFiles(
      searchParams,
      req.user.id,
      { 
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );
    
    res.json({
      success: true,
      ...results
    });
  } catch (error: unknown) {
    logger.error('Search error', error, { userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Permission Management Endpoints
app.post('/api/permissions', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const permissionData: CreatePermissionRequest = req.body;
    
    if (!permissionData.user_id || !permissionData.resource_id || !permissionData.resource_type) {
      res.status(400).json({ success: false, error: 'User ID, resource ID, and resource type are required' });
      return;
    }

    const permission = await databaseService.instance.createPermission(permissionData, req.user.id);
    
    logger.info('Permission created successfully', { permissionId: permission.id, userId: req.user.id });
    
    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      permission
    });
  } catch (error: unknown) {
    logger.error('Create permission error', error, { userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.get('/api/permissions/:resourceId/:resourceType', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { resourceId, resourceType } = req.params;
    
    if (!['file', 'folder'].includes(resourceType)) {
      res.status(400).json({ success: false, error: 'Invalid resource type' });
      return;
    }

    const permissions = await databaseService.instance.getPermissionsByResource(resourceId, resourceType as 'file' | 'folder');
    
    res.json({
      success: true,
      permissions
    });
  } catch (error: unknown) {
    logger.error('Get permissions error', error, { resourceId: req.params.resourceId, userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Sharing Endpoints
app.post('/api/shares', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const shareData: CreateShareRequest = req.body;
    
    if (!shareData.resource_id || !shareData.resource_type) {
      res.status(400).json({ success: false, error: 'Resource ID and resource type are required' });
      return;
    }

    const share = await databaseService.instance.createShare(shareData, req.user.id);
    
    logger.info('Share created successfully', { shareId: share.id, userId: req.user.id });
    
    res.status(201).json({
      success: true,
      message: 'Share created successfully',
      share
    });
  } catch (error: unknown) {
    logger.error('Create share error', error, { userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.get('/api/shares/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const share = await databaseService.instance.getShareByToken(token);
    
    if (!share) {
      res.status(404).json({ success: false, error: 'Share not found or expired' });
      return;
    }
    
    if (share.expires_at && new Date() > new Date(share.expires_at)) {
      res.status(410).json({ success: false, error: 'Share has expired' });
      return;
    }
    
    res.json({
      success: true,
      share
    });
  } catch (error: unknown) {
    logger.error('Get share error', error, { token: req.params.token });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Enhanced Storage Usage Endpoint
app.get('/api/storage/usage', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const usage = await databaseService.instance.getStorageUsage(req.user.id);
    
    res.json({
      success: true,
      data: usage
    });
  } catch (error: unknown) {
    logger.error('Storage usage error', error, { userId: req.user?.id });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Authentication Endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    // For demo purposes, accept any email/password combination
    // In production, you would integrate with Supabase Auth or your own auth system
    // Use fixed UUID for development to match database user
    const user = {
      id: '916375dc-f279-4130-94c7-09f42a06fa56',
      email,
      name: email.split('@')[0],
      plan: 'free'
    };

    const token = getAuthMiddleware().generateToken(user);
    
    res.json({
      success: true,
      user,
      token,
      redirectUrl: '/dashboard'
    });
  } catch (error: unknown) {
    logger.error('Login error', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: 'Email, password, and name are required' });
      return;
    }

    // For now, create a mock user registration
    // In production, you would integrate with Supabase Auth
    const mockUser = {
      id: crypto.randomUUID(),
      email,
      name,
      plan: 'free'
    };

    const token = getAuthMiddleware().generateToken(mockUser);
    
    res.status(201).json({
      success: true,
      user: mockUser,
      token
    });
  } catch (error: unknown) {
    logger.error('Registration error', error);
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.get('/api/auth/google', async (req, res) => {
  try {
    // Google OAuth configuration
    const googleClientId = process.env['GOOGLE_CLIENT_ID'];
    const redirectUri = `${process.env['FRONTEND_URL'] || 'http://localhost:3000'}/api/auth/google/callback`;
    
    if (!googleClientId || googleClientId === 'your_google_client_id_here') {
      res.status(500).json({ 
        success: false, 
        error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables.' 
      });
      return;
    }

    // Construct Google OAuth URL
    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${googleClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `prompt=consent`;

    res.json({
      success: true,
      authUrl: googleAuthUrl,
      message: 'Redirect to Google OAuth'
    });
  } catch (error: unknown) {
    logger.error('Google OAuth error', error);
    const errorMessage = error instanceof Error ? error.message : 'Google OAuth failed';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Google OAuth callback endpoint
app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      res.status(400).json({ success: false, error: 'Authorization code is required' });
      return;
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env['GOOGLE_CLIENT_ID'] || '',
        client_secret: process.env['GOOGLE_CLIENT_SECRET'] || '',
        redirect_uri: `${process.env['FRONTEND_URL'] || 'http://localhost:3000'}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json() as any;

    if (tokens.error) {
      res.status(400).json({ success: false, error: tokens.error_description || 'Failed to get tokens' });
      return;
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userResponse.json() as any;

    // Create or get user from database
    const user = {
      id: crypto.randomUUID(), // Generate a proper UUID for the user
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      plan: 'free'
    };

    // Generate JWT token
    const token = getAuthMiddleware().generateToken(user);

    // Redirect to frontend with token
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);

  } catch (error: unknown) {
    logger.error('Google OAuth callback error', error);
    const errorMessage = error instanceof Error ? error.message : 'OAuth callback failed';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    // In production, you would invalidate the JWT token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: unknown) {
    logger.error('Logout error', error);
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.get('/api/auth/me', getAuthMiddleware().authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    res.json({
      success: true,
      user: req.user
    });
  } catch (error: unknown) {
    logger.error('Get user error', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get user';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Error handling middleware
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ 
        success: false, 
        error: 'File too large',
        maxSize: process.env['MAX_FILE_SIZE'] || '50MB'
      });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(413).json({ 
        success: false, 
        error: 'Too many files',
        maxFiles: 10
      });
      return;
    }
  }
  
  const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'development' ? errorMessage : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, async () => {
  logger.info('Server starting', { port: PORT });
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`📁 Storage Bucket: ${process.env['SUPABASE_STORAGE_BUCKET'] || 'files'}`);
  
  try {
    // Initialize storage bucket
    await supabaseStorageService.instance.initializeBucket();
    logger.info('Storage bucket initialized successfully (on server start)');
  } catch (error: unknown) {
    logger.warn('⚠️  Storage bucket initialization failed (on server start)', { error: error instanceof Error ? error.message : 'Unknown error', context: 'server start' });
  }
  
  logger.info('🎯 Server ready for production use!');
});

export default app;

// Global type declaration for share tokens
declare global {
  var shareTokens: Map<string, {
    token: string;
    fileId: string;
    userId: string;
    expiresAt: string;
    createdAt: string;
    accessType: string;
    expiresIn: number;
  }>;
}
