# File Upload & Storage API Documentation

## Overview

The File API provides secure file upload, storage, and management functionality with AWS S3 integration. All endpoints require authentication.

## Base URL

```
http://localhost:5000/api/files
```

## Authentication

All endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## File Upload Endpoints

### 1. Upload Single File

**POST** `/upload`

Upload a single file to S3 and save metadata to database.

#### Headers

```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

#### Form Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The file to upload |
| `folderId` | String | No | ID of folder to upload to |

#### Response (201 Created)

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "uuid-here",
    "name": "document.pdf",
    "size": 1024000,
    "mime_type": "application/pdf",
    "storage_path": "uploads/user-id/timestamp-filename.pdf",
    "user_id": "user-uuid",
    "folder_id": null,
    "is_deleted": false,
    "version": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid file type, size, or format
- **401 Unauthorized**: Missing or invalid token
- **500 Internal Server Error**: Upload failed

---

### 2. Upload Multiple Files

**POST** `/upload/multiple`

Upload multiple files simultaneously.

#### Headers

```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

#### Form Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | File[] | Yes | Array of files to upload |
| `folderId` | String | No | ID of folder to upload to |

#### Response (201 Created)

```json
{
  "success": true,
  "message": "3 files uploaded successfully",
  "data": [
    {
      "id": "uuid-1",
      "name": "image1.jpg",
      "size": 512000,
      "mime_type": "image/jpeg",
      "storage_path": "uploads/user-id/timestamp-image1.jpg",
      "user_id": "user-uuid",
      "folder_id": null,
      "is_deleted": false,
      "version": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid-2",
      "name": "document.pdf",
      "size": 1024000,
      "mime_type": "application/pdf",
      "storage_path": "uploads/user-id/timestamp-document.pdf",
      "user_id": "user-uuid",
      "folder_id": null,
      "is_deleted": false,
      "version": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## File Management Endpoints

### 3. Get User's Files

**GET** `/`

Get all files for the authenticated user.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `folderId` | String | null | Filter by folder ID |
| `includeDeleted` | Boolean | false | Include deleted files |
| `limit` | Number | 50 | Number of files to return |
| `offset` | Number | 0 | Number of files to skip |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "document.pdf",
      "size": 1024000,
      "mime_type": "application/pdf",
      "storage_path": "uploads/user-id/timestamp-document.pdf",
      "user_id": "user-uuid",
      "folder_id": null,
      "is_deleted": false,
      "version": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4. Get Single File

**GET** `/:id`

Get a specific file by ID.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `withUrl` | Boolean | false | Include signed URL for download |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "document.pdf",
    "size": 1024000,
    "mime_type": "application/pdf",
    "storage_path": "uploads/user-id/timestamp-document.pdf",
    "user_id": "user-uuid",
    "folder_id": null,
    "is_deleted": false,
    "version": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "signed_url": "https://s3.amazonaws.com/..." // Only if withUrl=true
  }
}
```

---

### 5. Update File Metadata

**PUT** `/:id`

Update file name or folder location.

#### Request Body

```json
{
  "name": "new-filename.pdf",
  "folder_id": "folder-uuid"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "File updated successfully",
  "data": {
    "id": "uuid-here",
    "name": "new-filename.pdf",
    "size": 1024000,
    "mime_type": "application/pdf",
    "storage_path": "uploads/user-id/timestamp-document.pdf",
    "user_id": "user-uuid",
    "folder_id": "folder-uuid",
    "is_deleted": false,
    "version": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 6. Delete File (Soft Delete)

**DELETE** `/:id`

Mark file as deleted (soft delete).

#### Response (200 OK)

```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

### 7. Permanently Delete File

**DELETE** `/:id/permanent`

Permanently delete file from S3 and database.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "File permanently deleted"
}
```

---

### 8. Restore Deleted File

**POST** `/:id/restore`

Restore a soft-deleted file.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "File restored successfully",
  "data": {
    "id": "uuid-here",
    "name": "document.pdf",
    "size": 1024000,
    "mime_type": "application/pdf",
    "storage_path": "uploads/user-id/timestamp-document.pdf",
    "user_id": "user-uuid",
    "folder_id": null,
    "is_deleted": false,
    "version": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## File Statistics & Search

### 9. Get File Statistics

**GET** `/stats`

Get file statistics for the authenticated user.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "totalFiles": 25,
    "totalSize": 52428800,
    "fileTypes": {
      "image": 10,
      "application": 8,
      "text": 5,
      "video": 2
    }
  }
}
```

---

### 10. Search Files

**GET** `/search?q=query`

Search files by name.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | String | Yes | Search query |
| `limit` | Number | No | Number of results (default: 50) |
| `offset` | Number | No | Number of results to skip (default: 0) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "document.pdf",
      "size": 1024000,
      "mime_type": "application/pdf",
      "storage_path": "uploads/user-id/timestamp-document.pdf",
      "user_id": "user-uuid",
      "folder_id": null,
      "is_deleted": false,
      "version": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 11. Get Files by Type

**GET** `/type/:type`

Get files filtered by MIME type.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | String | MIME type (e.g., "image/jpeg", "application/pdf") |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | Number | 50 | Number of files to return |
| `offset` | Number | 0 | Number of files to skip |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "image.jpg",
      "size": 512000,
      "mime_type": "image/jpeg",
      "storage_path": "uploads/user-id/timestamp-image.jpg",
      "user_id": "user-uuid",
      "folder_id": null,
      "is_deleted": false,
      "version": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## File Verification & Metadata

### 12. Verify File Exists in S3

**GET** `/:id/verify`

Check if file exists in S3 storage.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "exists": true
  }
}
```

---

### 13. Get File S3 Metadata

**GET** `/:id/metadata`

Get detailed metadata from S3.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "size": 1024000,
    "mimeType": "application/pdf",
    "lastModified": "2024-01-01T00:00:00.000Z",
    "metadata": {
      "original-name": "document.pdf",
      "uploaded-by": "user-uuid",
      "upload-date": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Health Check

### 14. File Routes Health Check

**GET** `/health`

Check if file routes are working.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "File routes are working",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## File Upload Limits & Restrictions

### Supported File Types

- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Documents**: PDF, Word, Excel, PowerPoint
- **Text Files**: Plain text, CSV, HTML, CSS, JavaScript, JSON, XML
- **Archives**: ZIP, RAR, 7Z
- **Code Files**: All major programming languages

### File Size Limits

- **Maximum file size**: 100 MB
- **Maximum files per request**: 10 files
- **Maximum total upload size**: 1 GB per request

### Security Restrictions

- **Blocked extensions**: .exe, .bat, .cmd, .com, .pif, .scr, .vbs, .js
- **File validation**: MIME type and content validation
- **Access control**: User can only access their own files

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common error codes:

- **400 Bad Request**: Invalid file, size too large, unsupported type
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: File not found
- **500 Internal Server Error**: Server error or S3 upload failure

---

## Testing Examples

### cURL Examples

#### Upload Single File
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer <your-token>" \
  -F "file=@document.pdf" \
  -F "folderId=folder-uuid"
```

#### Upload Multiple Files
```bash
curl -X POST http://localhost:5000/api/files/upload/multiple \
  -H "Authorization: Bearer <your-token>" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "files=@document.pdf"
```

#### Get Files with Signed URLs
```bash
curl -X GET "http://localhost:5000/api/files/uuid-here?withUrl=true" \
  -H "Authorization: Bearer <your-token>"
```

#### Search Files
```bash
curl -X GET "http://localhost:5000/api/files/search?q=document" \
  -H "Authorization: Bearer <your-token>"
```

---

## Environment Variables

Required environment variables for file upload:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-file-storage-bucket
```

---

## AWS S3 Setup

1. **Create S3 Bucket**:
   - Bucket name: `your-file-storage-bucket`
   - Region: `us-east-1` (or your preferred region)
   - Block all public access: `Enabled`

2. **Create IAM User**:
   - Create user with programmatic access
   - Attach policy for S3 access
   - Generate access key and secret

3. **Bucket Policy** (optional for additional security):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PrivateAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::your-file-storage-bucket/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::YOUR-ACCOUNT-ID:user/YOUR-IAM-USER"
        }
      }
    }
  ]
}
```
