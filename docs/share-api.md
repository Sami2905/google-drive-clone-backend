# Sharing & Permissions API Documentation

## Overview

This document describes the sharing and permissions API endpoints for the Google Drive clone. The API supports:

- **Public Link Sharing**: Generate and revoke public links for files
- **User-to-User Sharing**: Share files with specific users with role-based permissions
- **Permission Management**: View and manage file permissions
- **Role-Based Access Control**: Three permission levels (viewer, editor, owner)

## Base URL

```
http://localhost:5000/api/shares
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Permission Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `viewer` | Can view and download files | Read access only |
| `editor` | Can view, download, and modify files | Read + Write access |
| `owner` | Full control over the file | Read + Write + Delete + Share |

## API Endpoints

### 1. Generate Public Link

**POST** `/api/shares/:fileId/public`

Generate a public link for a file that anyone can access.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Public link generated successfully",
  "data": {
    "shareable_link": "http://localhost:3000/public/abc123-def456",
    "public_token": "abc123-def456"
  }
}
```

**cURL Example:**
```bash
curl -X POST \
  http://localhost:5000/api/shares/file-uuid/public \
  -H "Authorization: Bearer your-jwt-token"
```

### 2. Revoke Public Link

**DELETE** `/api/shares/:fileId/public`

Revoke a public link for a file.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Public link revoked successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE \
  http://localhost:5000/api/shares/file-uuid/public \
  -H "Authorization: Bearer your-jwt-token"
```

### 3. Share with User

**POST** `/api/shares/:fileId/user`

Share a file with a specific user by email address.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "role": "viewer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File shared successfully",
  "data": {
    "id": "permission-uuid",
    "user_id": "user-uuid",
    "file_id": "file-uuid",
    "role": "viewer",
    "user_email": "user@example.com",
    "user_name": "John Doe",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST \
  http://localhost:5000/api/shares/file-uuid/user \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "role": "viewer"
  }'
```

### 4. Remove User Permission

**DELETE** `/api/shares/:fileId/user/:userId`

Remove a user's permission to access a file.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User permission removed successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE \
  http://localhost:5000/api/shares/file-uuid/user/user-uuid \
  -H "Authorization: Bearer your-jwt-token"
```

### 5. Get File Permissions

**GET** `/api/shares/:fileId/permissions`

Get all users who have access to a file.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "permission-uuid",
      "user_id": "user-uuid",
      "file_id": "file-uuid",
      "role": "viewer",
      "user_email": "user@example.com",
      "user_name": "John Doe",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET \
  http://localhost:5000/api/shares/file-uuid/permissions \
  -H "Authorization: Bearer your-jwt-token"
```

### 6. Check User Permission

**GET** `/api/shares/:fileId/access`

Check if the current user has access to a file and what their role is.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "role": "viewer"
  }
}
```

**cURL Example:**
```bash
curl -X GET \
  http://localhost:5000/api/shares/file-uuid/access \
  -H "Authorization: Bearer your-jwt-token"
```

### 7. Access Public File

**GET** `/api/shares/public/:token`

Access a file using its public token (no authentication required).

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "file-uuid",
      "name": "document.pdf",
      "size": 1024000,
      "mime_type": "application/pdf",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "download_url": "https://s3.amazonaws.com/..."
  }
}
```

**cURL Example:**
```bash
curl -X GET \
  http://localhost:5000/api/shares/public/abc123-def456
```

### 8. Get Shared Files

**GET** `/api/shares/shared`

Get all files shared with the current user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Shared files endpoint - to be implemented",
  "data": []
}
```

**cURL Example:**
```bash
curl -X GET \
  http://localhost:5000/api/shares/shared \
  -H "Authorization: Bearer your-jwt-token"
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "File not found"
}
```

### 400 Bad Request
```json
{
  "error": "Email and role are required"
}
```

## Security Features

### 1. Role-Based Access Control
- **Owner**: Full control (read, write, delete, share)
- **Editor**: Can read and modify files
- **Viewer**: Read-only access

### 2. Public Link Security
- Public links use secure UUID tokens
- Links can be revoked at any time
- No authentication required for public access

### 3. Permission Validation
- All file operations check user permissions
- Users can only access files they own or have been shared with
- Public files are accessible to everyone

## Integration with File Operations

The sharing system integrates with existing file operations:

### File Access
- `GET /api/files/:id` - Now checks permissions
- `GET /api/files/:id?withUrl=true` - Now checks permissions

### File Updates
- `PATCH /api/files/:id` - Only owners and editors can update

### File Deletion
- `DELETE /api/files/:id` - Only owners can delete
- `DELETE /api/files/:id/permanent` - Only owners can permanently delete

## Testing Examples

### 1. Share a file with a user
```bash
# First, upload a file
curl -X POST \
  http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer your-jwt-token" \
  -F "file=@document.pdf"

# Then share it
curl -X POST \
  http://localhost:5000/api/shares/file-uuid/user \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "colleague@company.com",
    "role": "editor"
  }'
```

### 2. Generate a public link
```bash
curl -X POST \
  http://localhost:5000/api/shares/file-uuid/public \
  -H "Authorization: Bearer your-jwt-token"
```

### 3. Access a public file
```bash
curl -X GET \
  http://localhost:5000/api/shares/public/abc123-def456
```

## Best Practices

1. **Always validate permissions** before performing file operations
2. **Use HTTPS** in production for secure communication
3. **Implement rate limiting** to prevent abuse
4. **Log sharing activities** for audit purposes
5. **Regularly review and clean up** unused permissions
6. **Use strong UUIDs** for public tokens
7. **Implement expiration** for public links (future feature)

## Future Enhancements

- [ ] Link expiration dates
- [ ] Password-protected public links
- [ ] Bulk sharing operations
- [ ] Sharing analytics and tracking
- [ ] Email notifications for shared files
- [ ] Advanced permission inheritance
- [ ] Sharing templates and presets
