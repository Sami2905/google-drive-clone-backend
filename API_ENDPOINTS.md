# 🚀 API Endpoints Documentation

## 📋 Overview

This document describes all available API endpoints for the Google Drive Clone backend. The API is built with Express.js and integrates with Supabase for authentication and file storage.

**Base URL**: `http://localhost:5000` (development) or your production domain

**Authentication**: Most endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🔐 Authentication Endpoints

### Health Check
- **GET** `/health`
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

### Test Supabase Connection
- **GET** `/test-connection`
- **Description**: Test the connection to Supabase database
- **Authentication**: None required
- **Response**:
```json
{
  "success": true,
  "message": "Supabase connection successful"
}
```

### Initialize Storage Bucket
- **GET** `/init-storage`
- **Description**: Initialize the Supabase storage bucket
- **Authentication**: None required
- **Response**:
```json
{
  "success": true,
  "message": "Storage bucket initialized"
}
```

## 📁 File Management Endpoints

### Upload Single File
- **POST** `/api/files/upload`
- **Description**: Upload a single file to Supabase storage
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `file`: The file to upload (required)
  - `folderPath`: Optional folder path (string)
- **Response**:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "1704067200000-abc123-test-file.txt",
    "name": "test-file.txt",
    "size": 1024,
    "mimeType": "text/plain",
    "url": "https://test.supabase.co/storage/v1/object/public/files/1704067200000-abc123-test-file.txt",
    "path": "1704067200000-abc123-test-file.txt"
  }
}
```

### Upload Multiple Files
- **POST** `/api/files/upload-multiple`
- **Description**: Upload multiple files to Supabase storage
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `files`: Array of files to upload (required)
  - `folderPath`: Optional folder path (string)
- **Response**:
```json
{
  "success": true,
  "message": "Files uploaded",
  "files": [
    {
      "id": "1704067200000-abc123-file1.txt",
      "name": "file1.txt",
      "size": 1024,
      "mimeType": "text/plain",
      "url": "https://test.supabase.co/storage/v1/object/public/files/1704067200000-abc123-file1.txt",
      "path": "1704067200000-abc123-file1.txt"
    },
    {
      "id": "1704067200000-def456-file2.pdf",
      "name": "file2.pdf",
      "size": 2048,
      "mimeType": "application/pdf",
      "url": "https://test.supabase.co/storage/v1/object/public/files/1704067200000-def456-file2.pdf",
      "path": "1704067200000-def456-file2.pdf"
    }
  ]
}
```

### Get File URL
- **GET** `/api/files/:fileId/url`
- **Description**: Get a public or signed URL for a file
- **Authentication**: Required
- **Query Parameters**:
  - `signed`: Whether to generate a signed URL (boolean, default: false)
  - `expiresIn`: Expiration time in seconds for signed URLs (number, default: 3600)
- **Response**:
```json
{
  "success": true,
  "url": "https://test.supabase.co/storage/v1/object/public/files/test-file.txt",
  "expiresIn": null
}
```

### Download File
- **GET** `/api/files/:fileId/download`
- **Description**: Download a file from storage
- **Authentication**: Required
- **Response**: File content as binary data
- **Headers**:
  - `Content-Type`: File MIME type
  - `Content-Length`: File size in bytes
  - `Content-Disposition`: Attachment filename

### Delete File
- **DELETE** `/api/files/:fileId`
- **Description**: Delete a file from storage
- **Authentication**: Required
- **Response**:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### List Files
- **GET** `/api/files`
- **Description**: List files in a folder with pagination
- **Authentication**: Required
- **Query Parameters**:
  - `folder`: Folder path to list (string, default: root)
  - `limit`: Maximum number of files to return (number, default: 100)
  - `offset`: Number of files to skip (number, default: 0)
- **Response**:
```json
{
  "success": true,
  "files": [
    {
      "name": "file1.txt",
      "size": 1024,
      "mimeType": "text/plain",
      "path": "file1.txt"
    },
    {
      "name": "file2.pdf",
      "size": 2048,
      "mimeType": "application/pdf",
      "path": "file2.pdf"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 2
  }
}
```

### Get Storage Usage
- **GET** `/api/storage/usage`
- **Description**: Get storage usage statistics
- **Authentication**: Required
- **Response**:
```json
{
  "success": true,
  "usage": {
    "totalSize": 3072,
    "fileCount": 2
  }
}
```

## 🔒 Error Handling

All endpoints return consistent error responses:

### Authentication Error (401)
```json
{
  "success": false,
  "error": "No token provided"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "error": "No file provided"
}
```

### File Size Error (413)
```json
{
  "success": false,
  "error": "File too large",
  "maxSize": "50MB"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

## 📊 Rate Limiting

The API includes built-in rate limiting:
- **File Upload**: Maximum 10 files per request
- **File Size**: Maximum 50MB per file (configurable)
- **Request Size**: Maximum 50MB per request

## 🚀 Usage Examples

### cURL Examples

#### Upload a file:
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/file.txt" \
  -F "folderPath=documents"
```

#### Download a file:
```bash
curl -X GET http://localhost:5000/api/files/FILE_ID/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o downloaded_file.txt
```

#### List files in a folder:
```bash
curl -X GET "http://localhost:5000/api/files?folder=documents&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript/Node.js Examples

#### Upload file using FormData:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folderPath', 'documents');

const response = await fetch('/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Uploaded file:', result.file);
```

#### Download file:
```javascript
const response = await fetch(`/api/files/${fileId}/download`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = fileName;
a.click();
```

## 🔧 Configuration

### Environment Variables

The following environment variables can be configured:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_STORAGE_BUCKET=files

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# File Upload Limits
MAX_FILE_SIZE=52428800  # 50MB in bytes

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### File Type Restrictions

Currently, all file types are allowed. You can modify the `fileFilter` function in the server configuration to restrict specific file types.

## 📈 Monitoring and Logging

The API includes comprehensive logging:

- **Success Operations**: ✅ Green checkmarks for successful operations
- **Error Operations**: 🚨 Red error symbols with detailed context
- **Warning Operations**: ⚠️ Yellow warning symbols for non-critical issues

### Log Format

```json
{
  "level": "error",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "operation": "uploadFile",
  "userId": "user-123",
  "filePath": "documents/test.txt",
  "bucketName": "files",
  "errorCode": "FILE_TOO_LARGE",
  "message": "File size limit exceeded"
}
```

## 🔄 WebSocket Support

Currently, the API does not include WebSocket support for real-time updates. File operations are synchronous and return immediate responses.

## 🚨 Security Considerations

1. **JWT Tokens**: All authenticated endpoints require valid JWT tokens
2. **File Validation**: Files are validated for size and type before upload
3. **User Isolation**: Users can only access their own files
4. **Rate Limiting**: Built-in protection against abuse
5. **CORS**: Configurable CORS settings for frontend integration

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Multer File Upload](https://github.com/expressjs/multer)
- [JWT Authentication](https://jwt.io/)

## 🤝 Support

For API support or questions:
- Check the server logs for detailed error information
- Verify your authentication token is valid
- Ensure your Supabase configuration is correct
- Review the error response format for specific error details
