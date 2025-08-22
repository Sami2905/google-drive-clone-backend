# Search & Optimization API Documentation

## Overview

This document describes the search and optimization API endpoints for the Google Drive clone. The API supports:

- **Full-Text Search**: Search files and folders by name
- **Pagination**: Control large result sets with limit/offset
- **Sorting**: Sort by name, size, date, and other criteria
- **Advanced Filtering**: Filter by file type, size range, date range
- **Search Suggestions**: Autocomplete and search suggestions
- **Search Analytics**: Search statistics and insights

## Base URL

```
http://localhost:5000/api/search
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Search Files and Folders

**GET** `/api/search`

Search for both files and folders with pagination and sorting.

**Query Parameters:**
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `sort` (optional): Sort field - `name`, `size`, `created_at`, `updated_at` (default: `name`)
- `sortOrder` (optional): Sort order - `ASC` or `DESC` (default: `ASC`)
- `fileType` (optional): Filter by file type (e.g., `image`, `pdf`)
- `folderId` (optional): Filter by parent folder ID

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file-uuid",
        "name": "document.pdf",
        "size": 1024000,
        "mime_type": "application/pdf",
        "user_id": "user-uuid",
        "folder_id": "folder-uuid",
        "is_deleted": false,
        "version": 1,
        "created_at": "2024-01-15T10:30:00Z",
        "is_public": false,
        "public_token": null
      }
    ],
    "folders": [
      {
        "id": "folder-uuid",
        "name": "My Documents",
        "user_id": "user-uuid",
        "parent_id": null,
        "is_deleted": false,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "totalFiles": 15,
    "totalFolders": 3,
    "hasMore": true,
    "currentPage": 1,
    "totalPages": 3
  }
}
```

**cURL Example:**
```bash
curl -X GET \
  "http://localhost:5000/api/search?q=resume&page=1&limit=10&sort=name&sortOrder=ASC" \
  -H "Authorization: Bearer your-jwt-token"
```

### 2. Search Files Only

**GET** `/api/search/files`

Search for files only with pagination and sorting.

**Query Parameters:**
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `sort` (optional): Sort field - `name`, `size`, `created_at`, `updated_at` (default: `name`)
- `sortOrder` (optional): Sort order - `ASC` or `DESC` (default: `ASC`)
- `fileType` (optional): Filter by file type
- `folderId` (optional): Filter by parent folder ID

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [...],
    "total": 25,
    "hasMore": true,
    "currentPage": 1,
    "totalPages": 3
  }
}
```

### 3. Search Folders Only

**GET** `/api/search/folders`

Search for folders only with pagination and sorting.

**Query Parameters:**
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `sort` (optional): Sort field - `name`, `created_at`, `updated_at` (default: `name`)
- `sortOrder` (optional): Sort order - `ASC` or `DESC` (default: `ASC`)
- `folderId` (optional): Filter by parent folder ID

### 4. Get Search Suggestions

**GET** `/api/search/suggestions`

Get search suggestions for autocomplete functionality.

**Query Parameters:**
- `q` (required): Partial search query (minimum 2 characters)

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file-uuid",
        "name": "resume.pdf",
        "type": "file"
      }
    ],
    "folders": [
      {
        "id": "folder-uuid",
        "name": "Resume",
        "type": "folder"
      }
    ]
  }
}
```

### 5. Get Recent Searches

**GET** `/api/search/recent`

Get user's recent search queries.

**Response:**
```json
{
  "success": true,
  "data": [
    "resume",
    "project",
    "document"
  ]
}
```

### 6. Advanced Search with Filters

**GET** `/api/search/advanced`

Advanced search with multiple filters.

**Query Parameters:**
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `sort` (optional): Sort field
- `sortOrder` (optional): Sort order
- `fileType` (optional): Filter by file type
- `folderId` (optional): Filter by folder ID
- `dateStart` (optional): Start date (ISO format)
- `dateEnd` (optional): End date (ISO format)
- `sizeMin` (optional): Minimum file size in bytes
- `sizeMax` (optional): Maximum file size in bytes

**cURL Example:**
```bash
curl -X GET \
  "http://localhost:5000/api/search/advanced?q=document&fileType=pdf&dateStart=2024-01-01&dateEnd=2024-01-31&sizeMin=1024&sizeMax=10485760" \
  -H "Authorization: Bearer your-jwt-token"
```

### 7. Get Search Statistics

**GET** `/api/search/stats`

Get search analytics and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSearches": 150,
    "popularQueries": [
      "resume",
      "project",
      "document"
    ],
    "searchTrends": [
      {
        "date": "2024-01-15",
        "count": 25
      }
    ]
  }
}
```

## File Discovery Endpoints

### 8. Get Files by Size Range

**GET** `/api/files/by-size`

Get files within a specific size range.

**Query Parameters:**
- `minSize` (required): Minimum file size in bytes
- `maxSize` (required): Maximum file size in bytes
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**cURL Example:**
```bash
curl -X GET \
  "http://localhost:5000/api/files/by-size?minSize=1024&maxSize=10485760" \
  -H "Authorization: Bearer your-jwt-token"
```

### 9. Get Files by Date Range

**GET** `/api/files/by-date`

Get files created within a specific date range.

**Query Parameters:**
- `startDate` (required): Start date (ISO format)
- `endDate` (required): End date (ISO format)
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

### 10. Get Recently Modified Files

**GET** `/api/files/recent`

Get files modified within a specific number of days.

**Query Parameters:**
- `days` (optional): Number of days (default: 7)
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

### 11. Get Large Files

**GET** `/api/files/large`

Get files larger than a specific size threshold.

**Query Parameters:**
- `threshold` (optional): Size threshold in bytes (default: 10MB)
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

### 12. Get Duplicate Files

**GET** `/api/files/duplicates`

Get files that have the same name and size (potential duplicates).

**Query Parameters:**
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

### 13. Get File Search Statistics

**GET** `/api/files/search-stats`

Get comprehensive file statistics for search insights.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 150,
    "totalSize": 1073741824,
    "fileTypes": {
      "image": 45,
      "application": 80,
      "text": 25
    },
    "sizeDistribution": {
      "<1MB": 100,
      "1-10MB": 35,
      "10-100MB": 10,
      ">100MB": 5
    },
    "recentActivity": {
      "This Week": 25,
      "Last Week": 15,
      "2 Weeks Ago": 10,
      "3 Weeks Ago": 5
    }
  }
}
```

## Search Examples

### Basic Search
```bash
# Search for files containing "resume"
curl -X GET \
  "http://localhost:5000/api/search?q=resume" \
  -H "Authorization: Bearer your-jwt-token"
```

### Search with Pagination
```bash
# Get second page of results
curl -X GET \
  "http://localhost:5000/api/search?q=document&page=2&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

### Search with Sorting
```bash
# Sort by file size (largest first)
curl -X GET \
  "http://localhost:5000/api/search?q=image&sort=size&sortOrder=DESC" \
  -H "Authorization: Bearer your-jwt-token"
```

### Search by File Type
```bash
# Search for PDF files
curl -X GET \
  "http://localhost:5000/api/search?q=report&fileType=pdf" \
  -H "Authorization: Bearer your-jwt-token"
```

### Advanced Search
```bash
# Search with multiple filters
curl -X GET \
  "http://localhost:5000/api/search/advanced?q=project&fileType=pdf&dateStart=2024-01-01&dateEnd=2024-01-31&sizeMin=1024&sizeMax=10485760" \
  -H "Authorization: Bearer your-jwt-token"
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Search query is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Search failed"
}
```

## Performance Considerations

### 1. Pagination
- Always use pagination for large result sets
- Default limit is 20, maximum is 100
- Use `hasMore` flag to implement infinite scroll

### 2. Search Optimization
- Use `ILIKE` for case-insensitive search
- Consider adding database indexes for frequently searched fields
- Implement search result caching for popular queries

### 3. Query Optimization
- Use specific file type filters to reduce result set
- Combine multiple filters for more precise results
- Use date ranges to limit search scope

## Best Practices

### 1. Search Implementation
- Implement debouncing for real-time search (300ms delay)
- Show loading states during search
- Cache recent search results
- Provide search suggestions for better UX

### 2. Frontend Integration
```javascript
// Example React hook for search
const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const search = async (searchQuery, pageNum = 1) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${searchQuery}&page=${pageNum}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      
      if (pageNum === 1) {
        setResults(data.data.files);
      } else {
        setResults(prev => [...prev, ...data.data.files]);
      }
      
      setHasMore(data.data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return { query, setQuery, results, loading, hasMore, search };
};
```

### 3. Infinite Scroll Implementation
```javascript
// Example infinite scroll with React
useEffect(() => {
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop
      === document.documentElement.offsetHeight
    ) {
      if (hasMore && !loading) {
        search(query, page + 1);
      }
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [hasMore, loading, page, query]);
```

## Future Enhancements

- [ ] Full-text search with PostgreSQL FTS
- [ ] Search result highlighting
- [ ] Search filters by sharing status
- [ ] Search within file content (for supported file types)
- [ ] Search analytics and insights
- [ ] Search result export functionality
- [ ] Advanced search operators (AND, OR, NOT)
- [ ] Search result ranking and relevance scoring
