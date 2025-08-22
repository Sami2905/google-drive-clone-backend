# Folder Management API Documentation

## Overview

The Folder API provides comprehensive folder management functionality including CRUD operations, hierarchical folder structures, soft deletion (trash), and recursive operations. All endpoints require authentication.

## Base URL

```
http://localhost:5000/api/folders
```

## Authentication

All endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Folder CRUD Endpoints

### 1. Create Folder

**POST** `/`

Create a new folder in the specified parent folder or root.

#### Request Body

```json
{
  "name": "My New Folder",
  "parent_id": "optional-parent-folder-uuid"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "message": "Folder created successfully",
  "data": {
    "id": "folder-uuid",
    "name": "My New Folder",
    "user_id": "user-uuid",
    "parent_id": "parent-folder-uuid",
    "is_deleted": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid folder name or parent folder not found
- **401 Unauthorized**: Missing or invalid token
- **409 Conflict**: Folder with same name already exists in location

---

### 2. Get User's Folders

**GET** `/`

Get all folders for the authenticated user with optional filtering.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `parentId` | String | null | Filter by parent folder ID |
| `includeDeleted` | Boolean | false | Include deleted folders |
| `limit` | Number | 50 | Number of folders to return |
| `offset` | Number | 0 | Number of folders to skip |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "folder-uuid",
      "name": "My Folder",
      "user_id": "user-uuid",
      "parent_id": null,
      "is_deleted": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Root Contents

**GET** `/root`

Get all files and folders that are not inside any folder (root level).

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "id": "folder-uuid",
        "name": "My Folder",
        "user_id": "user-uuid",
        "parent_id": null,
        "is_deleted": false,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "files": [
      {
        "id": "file-uuid",
        "name": "document.pdf",
        "size": 1024000,
        "mime_type": "application/pdf",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 4. Search Folders

**GET** `/search?q=query`

Search folders by name.

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
      "id": "folder-uuid",
      "name": "My Folder",
      "user_id": "user-uuid",
      "parent_id": null,
      "is_deleted": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 5. Get Trash Contents

**GET** `/trash`

Get all deleted folders (trash).

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | Number | 50 | Number of folders to return |
| `offset` | Number | 0 | Number of folders to skip |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "folder-uuid",
      "name": "Deleted Folder",
      "user_id": "user-uuid",
      "parent_id": null,
      "is_deleted": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Single Folder Operations

### 6. Get Folder by ID

**GET** `/:id`

Get a specific folder by ID.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "folder-uuid",
    "name": "My Folder",
    "user_id": "user-uuid",
    "parent_id": null,
    "is_deleted": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 7. Get Folder Contents

**GET** `/:id/contents`

Get all files and subfolders within a specific folder.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "id": "subfolder-uuid",
        "name": "Subfolder",
        "user_id": "user-uuid",
        "parent_id": "folder-uuid",
        "is_deleted": false,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "files": [
      {
        "id": "file-uuid",
        "name": "document.pdf",
        "size": 1024000,
        "mime_type": "application/pdf",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 8. Get Folder Path (Breadcrumb)

**GET** `/:id/path`

Get the complete path from root to the specified folder (breadcrumb navigation).

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "root-folder-uuid",
      "name": "Root",
      "user_id": "user-uuid",
      "parent_id": null,
      "is_deleted": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "parent-folder-uuid",
      "name": "Parent Folder",
      "user_id": "user-uuid",
      "parent_id": "root-folder-uuid",
      "is_deleted": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "current-folder-uuid",
      "name": "Current Folder",
      "user_id": "user-uuid",
      "parent_id": "parent-folder-uuid",
      "is_deleted": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 9. Rename Folder

**PATCH** `/:id`

Rename a folder.

#### Request Body

```json
{
  "name": "New Folder Name"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Folder renamed successfully",
  "data": {
    "id": "folder-uuid",
    "name": "New Folder Name",
    "user_id": "user-uuid",
    "parent_id": null,
    "is_deleted": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 10. Soft Delete Folder (Move to Trash)

**DELETE** `/:id`

Move a folder and all its contents to trash (soft delete).

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Folder moved to trash successfully"
}
```

**Note**: This operation recursively marks all subfolders and files as deleted.

---

### 11. Permanently Delete Folder

**DELETE** `/:id/permanent`

Permanently delete a folder and all its contents from the database and S3.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Folder permanently deleted"
}
```

**Warning**: This operation cannot be undone and will permanently remove all files from S3.

---

### 12. Restore Folder from Trash

**POST** `/:id/restore`

Restore a folder from trash.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Folder restored successfully",
  "data": {
    "id": "folder-uuid",
    "name": "Restored Folder",
    "user_id": "user-uuid",
    "parent_id": null,
    "is_deleted": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Health Check

### 13. Folder Routes Health Check

**GET** `/health`

Check if folder routes are working.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Folder routes are working",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## File Management Updates

The file management API has been enhanced with the following additional operations:

### 14. Rename File

**PATCH** `/api/files/:id`

Rename a file.

#### Request Body

```json
{
  "name": "new-filename.pdf"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "File updated successfully",
  "data": {
    "id": "file-uuid",
    "name": "new-filename.pdf",
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

---

### 15. Move File to Folder

**PATCH** `/api/files/:id`

Move a file to a different folder.

#### Request Body

```json
{
  "folder_id": "target-folder-uuid"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "File updated successfully",
  "data": {
    "id": "file-uuid",
    "name": "document.pdf",
    "size": 1024000,
    "mime_type": "application/pdf",
    "storage_path": "uploads/user-id/timestamp-document.pdf",
    "user_id": "user-uuid",
    "folder_id": "target-folder-uuid",
    "is_deleted": false,
    "version": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

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

- **400 Bad Request**: Invalid folder name, parent folder not found, duplicate name
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Folder not found or access denied
- **409 Conflict**: Folder with same name already exists in location
- **500 Internal Server Error**: Server error or database operation failure

---

## Testing Examples

### cURL Examples

#### Create Folder
```bash
curl -X POST http://localhost:5000/api/folders \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "My New Folder", "parent_id": "optional-parent-uuid"}'
```

#### Get Folder Contents
```bash
curl -X GET http://localhost:5000/api/folders/folder-uuid/contents \
  -H "Authorization: Bearer <your-token>"
```

#### Rename Folder
```bash
curl -X PATCH http://localhost:5000/api/folders/folder-uuid \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Folder Name"}'
```

#### Move Folder to Trash
```bash
curl -X DELETE http://localhost:5000/api/folders/folder-uuid \
  -H "Authorization: Bearer <your-token>"
```

#### Restore Folder from Trash
```bash
curl -X POST http://localhost:5000/api/folders/folder-uuid/restore \
  -H "Authorization: Bearer <your-token>"
```

#### Search Folders
```bash
curl -X GET "http://localhost:5000/api/folders/search?q=project" \
  -H "Authorization: Bearer <your-token>"
```

---

## Folder Hierarchy Features

### Nested Folder Support

- **Unlimited Depth**: Create folders within folders with unlimited nesting
- **Path Validation**: Ensures parent folders exist and belong to the user
- **Recursive Operations**: Deleting a folder affects all subfolders and files
- **Breadcrumb Navigation**: Get complete path from root to any folder

### Soft Delete (Trash) System

- **Recursive Soft Delete**: When a folder is moved to trash, all contents are also marked as deleted
- **Restore Capability**: Folders can be restored from trash (if parent still exists)
- **Permanent Delete**: Option to permanently delete folders and all contents
- **Trash Management**: Separate endpoint to view all deleted folders

### Security Features

- **User Isolation**: Users can only access their own folders
- **Parent Validation**: Ensures parent folders exist and belong to the user
- **Name Uniqueness**: Prevents duplicate folder names in the same location
- **Authentication Required**: All operations require valid JWT token

---

## Database Schema Updates

The folder table has been enhanced with:

```sql
-- Added to folders table
ALTER TABLE folders ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
-- parent_id already exists from Day 1
```

This enables:
- Soft deletion (trash functionality)
- Hierarchical folder structures
- Recursive operations
- Trash management

---

## Performance Considerations

- **Indexed Queries**: Database queries are optimized with proper indexing
- **Pagination**: Large folder lists support pagination with limit/offset
- **Efficient Recursion**: Recursive operations are optimized for performance
- **Caching Ready**: API responses are structured for easy caching implementation

---

## Integration with File System

The folder API integrates seamlessly with the file management system:

- **File Organization**: Files can be uploaded directly to specific folders
- **Bulk Operations**: Move multiple files between folders
- **Hierarchical Search**: Search files within specific folder hierarchies
- **Unified Interface**: Consistent API patterns across files and folders
