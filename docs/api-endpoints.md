# API Endpoints Documentation

## Overview
This document describes the REST API endpoints for the Google Drive clone backend service. The API provides file storage, management, and sharing capabilities through Supabase integration.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Health Check
**GET** `/health`
- **Description**: Check if the server is running and healthy
- **Authentication**: None required
- **Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### Supabase Connection Test
**GET** `/test-connection`
- **Description**: Test the connection to Supabase database
- **Authentication**: None required
- **Response**:
```json
{
  "success": true,
  "message": "Supabase connection successful"
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "Database connection failed"
}
```

### Storage Initialization
**GET** `/init-storage`
- **Description**: Initialize the storage bucket if it doesn't exist
- **Authentication**: None required
- **Response**:
```json
{
  "success": true,
  "message": "Storage bucket initialized"
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "Failed to initialize storage bucket"
}
```

### File Upload (Single)
**POST** `/files/upload`
- **Description**: Upload a single file to storage
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `file`: The file to upload (required)
  - `folderPath`: Optional folder path for organization
- **Response**:
```json
{
  "success": true,
  "data": {
    "path": "users/123/1704067200000-abc123-document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "url": "https://storage.supabase.co/object/public/files/users/123/1704067200000-abc123-document.pdf"
  }
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "File upload failed"
}
```

### File Upload (Multiple)
**POST** `/files/upload-multiple`
- **Description**: Upload multiple files to storage
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `files`: Array of files to upload (required)
  - `folderPath`: Optional folder path for organization
- **Response**:
```json
{
  "success": true,
  "files": [
    {
      "name": "document1.pdf",
      "path": "users/123/1704067200000-abc123-document1.pdf",
      "size": 1024000,
      "success": true
    },
    {
      "name": "document2.pdf",
      "path": "users/123/1704067200000-def456-document2.pdf",
      "size": 2048000,
      "success": true
    }
  ]
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "Multiple file upload failed"
}
```

### Get File URL
**GET** `/files/:fileId/url`
- **Description**: Get a public or signed URL for a file
- **Authentication**: Required
- **Query Parameters**:
  - `signed`: Set to 'true' for signed URLs (optional)
  - `expiresIn`: Expiration time in seconds for signed URLs (optional, default: 3600)
- **Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://storage.supabase.co/object/public/files/users/123/document.pdf",
    "signed": false,
    "expiresIn": null
  }
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "Failed to get file URL"
}
```

### File Download
**GET** `/files/:fileId/download`
- **Description**: Download a file from storage
- **Authentication**: Required
- **Response**: File content as binary data
- **Headers**:
  - `Content-Type`: Based on file type
  - `Content-Disposition`: `attachment; filename="filename.ext"`
- **Error Response**:
```json
{
  "success": false,
  "error": "File download failed"
}
```

### File Serve
**GET** `/files/:fileId/serve`
- **Description**: Serve a file for inline viewing
- **Authentication**: Required
- **Query Parameters**:
  - `inline`: Set to 'true' for inline display (optional)
- **Response**: File content as binary data
- **Headers**:
  - `Content-Type`: Based on file type
  - `Content-Disposition`: `inline; filename="filename.ext"`
- **Error Response**:
```json
{
  "success": false,
  "error": "File serve failed"
}
```

### File Delete
**DELETE** `/files/:fileId`
- **Description**: Delete a file from storage
- **Authentication**: Required
- **Response**:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "File deletion failed"
}
```

### List Files
**GET** `/files`
- **Description**: List files in storage with optional filtering
- **Authentication**: Required
- **Query Parameters**:
  - `folder`: Folder path to list (optional, default: root)
  - `limit`: Maximum number of files to return (optional, default: 100)
  - `offset`: Number of files to skip (optional, default: 0)
- **Response**:
```json
{
  "success": true,
  "files": [
    {
      "name": "document.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "path": "users/123/document.pdf"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 1
  }
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "Failed to list files"
}
```

### Storage Usage
**GET** `/storage/usage`
- **Description**: Get overall storage usage statistics
- **Authentication**: Required
- **Response**:
```json
{
  "success": true,
  "usage": {
    "totalSize": 5120000,
    "fileCount": 25
  }
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "Failed to get storage usage"
}
```

### Search Files
**GET** `/search`
- **Description**: Search for files by name or content
- **Authentication**: Required
- **Query Parameters**:
  - `q`: Search query (required)
  - `sort`: Sort field (optional: name, size, created_at, updated_at)
  - `order`: Sort order (optional: asc, desc)
  - `page`: Page number (optional, default: 1)
  - `limit`: Results per page (optional, default: 50)
- **Response**:
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file123",
        "name": "document.pdf",
        "size": 1024000,
        "mimeType": "application/pdf",
        "path": "users/123/document.pdf",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "folders": [],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "pages": 1
    }
  }
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "Search failed"
}
```

### Folder Operations

#### List Folder Contents
**GET** `/folders/:folderId/children`
- **Description**: List files and subfolders in a specific folder
- **Authentication**: Required
- **Query Parameters**:
  - `sort`: Sort field (optional: name, size, created_at, updated_at)
  - `order`: Sort order (optional: asc, desc)
- **Response**:
```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "id": "folder123",
        "name": "Documents",
        "has_children": true
      }
    ],
    "files": [
      {
        "id": "file123",
        "name": "document.pdf",
        "size": 1024000,
        "mimeType": "application/pdf"
      }
    ]
  }
}
```

#### Root Folder
**GET** `/folders/root`
- **Description**: List contents of the root folder
- **Authentication**: Required
- **Query Parameters**: Same as folder children
- **Response**: Same structure as folder children

### File Management Operations

#### Move Files
**POST** `/files/move`
- **Description**: Move one or more files to a different folder
- **Authentication**: Required
- **Body**:
```json
{
  "ids": ["file1", "file2"],
  "destination_folder_id": "folder123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Files moved successfully"
}
```

#### Copy Files
**POST** `/files/copy`
- **Description**: Copy a file to a different location
- **Authentication**: Required
- **Body**:
```json
{
  "id": "file123",
  "destination_folder_id": "folder123"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "file456",
    "path": "folder123/copied-file.pdf"
  }
}
```

#### Duplicate Files
**POST** `/files/:fileId/duplicate`
- **Description**: Create a duplicate of a file
- **Authentication**: Required
- **Body**:
```json
{
  "destination_folder_id": "folder123"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "file456",
    "path": "folder123/document-copy.pdf"
  }
}
```

### Authentication Endpoints

#### Refresh Token
**POST** `/auth/refresh-token`
- **Description**: Refresh an expired JWT token
- **Authentication**: None required (uses refresh token from cookies)
- **Response**:
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token"
  }
}
```

#### Get Current User
**GET** `/auth/me`
- **Description**: Get information about the currently authenticated user
- **Authentication**: Required
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created (for upload operations)
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (missing or invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (file or folder doesn't exist)
- **413**: Payload Too Large (file size exceeds limit)
- **500**: Internal Server Error (server-side error)

### Common Error Messages
- `"No file provided"` - Missing file in upload request
- `"Authentication required"` - Missing or invalid JWT token
- `"File not found"` - Requested file doesn't exist
- `"Permission denied"` - User doesn't have access to the resource
- `"File too large"` - File size exceeds maximum allowed size
- `"Invalid file path"` - Malformed or unsafe file path

## Rate Limiting
Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## File Size Limits
- **Maximum file size**: 50MB (configurable via `MAX_FILE_SIZE` environment variable)
- **Maximum files per request**: 10 files for multiple uploads

## Supported File Types
All file types are supported by default. The system automatically detects MIME types and stores them with the file metadata.

## Security Considerations
- All file operations require valid JWT authentication
- File paths are validated to prevent directory traversal attacks
- Files are stored in user-specific directories to ensure isolation
- Signed URLs can be generated with expiration times for secure sharing

## Development Notes
- The API uses Supabase for storage and authentication
- File metadata is stored in Supabase storage
- User authentication is handled via JWT tokens
- The service automatically creates storage buckets if they don't exist
- Comprehensive error logging is implemented for debugging

## Testing
Integration tests are available in the `tests/` directory. Run tests with:
```bash
npm test
```

## Environment Variables
Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key
- `SUPABASE_STORAGE_BUCKET`: Storage bucket name (default: 'files')
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 52428800)
- `FRONTEND_URL`: Allowed CORS origin (default: http://localhost:3000)
- `PORT`: Server port (default: 5000)
