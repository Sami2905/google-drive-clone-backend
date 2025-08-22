# google-drive-clone-frontend

A comprehensive frontend implementation for a Google Drive clone with file storage, sharing, and collaboration features.

## 🚀 Features

### ✅ Day 1: Project Setup & Planning
- Node.js/Express/TypeScript backend
- PostgreSQL database with TypeORM
- User authentication system
- Basic file and folder models
- Project structure and configuration

### ✅ Day 2: Authentication System
- JWT-based email/password authentication
- Google OAuth integration via Passport.js
- Password hashing with bcrypt
- Authentication middleware for route protection
- Secure session management

### ✅ Day 3: File Upload & Storage
- AWS S3 integration for file storage
- Secure file upload with Multer
- File metadata management in PostgreSQL
- Signed URL generation for secure access
- File type validation and security checks

### ✅ Day 4: File Management APIs
- Complete CRUD operations for files and folders
- Hierarchical folder structure support
- Soft delete (trash) functionality
- Recursive folder operations
- File renaming and moving capabilities

### ✅ Day 5: Sharing & Permissions
- **Public Link Sharing**: Generate and revoke secure public links
- **User-to-User Sharing**: Share files with specific users by email
- **Role-Based Access Control**: Three permission levels (viewer, editor, owner)
- **Permission Management**: View and manage file access permissions
- **Secure File Access**: Integration with existing file operations

### ✅ Day 6: Search & Optimization
- **Full-Text Search**: Search files and folders by name with case-insensitive matching
- **Pagination**: Efficient handling of large result sets with limit/offset
- **Sorting**: Multiple sort options (name, size, date) with ascending/descending order
- **Advanced Filtering**: Filter by file type, size range, date range, and more
- **Search Suggestions**: Autocomplete functionality for better UX
- **File Discovery**: Advanced file discovery features for better organization

### ✅ Day 7: Testing & Deployment of Backend
- **Comprehensive Testing Suite**: Unit tests, integration tests, and API tests with Jest
- **Robust Error Handling**: Custom error classes and middleware for production
- **Security Hardening**: Rate limiting, security headers, and input validation
- **Production Deployment**: Docker, PM2, and deployment configurations
- **Monitoring & Logging**: Request logging and error tracking
- **Performance Optimization**: Database optimization and caching strategies

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT, bcrypt, Passport.js (Google OAuth)
- **File Storage**: AWS S3
- **Security**: Helmet.js, CORS, input validation
- **Development**: ts-node-dev, ESLint, Prettier
- **Testing**: Jest, ts-jest, Supertest
- **Deployment**: Docker, PM2, Docker Compose

## 📁 Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── authController.ts
│   ├── fileController.ts
│   ├── folderController.ts
│   └── shareController.ts
├── services/            # Business logic
│   ├── authService.ts
│   ├── fileService.ts
│   ├── folderService.ts
│   ├── shareService.ts
│   ├── s3Service.ts
│   └── passport.ts
├── middleware/          # Custom middleware
│   ├── authMiddleware.ts
│   ├── permissionMiddleware.ts
│   └── upload.ts
├── routes/             # API routes
│   ├── authRoutes.ts
│   ├── fileRoutes.ts
│   ├── folderRoutes.ts
│   ├── shareRoutes.ts
│   └── userRoutes.ts
├── models/             # Database entities
│   ├── User.ts
│   ├── File.ts
│   ├── Folder.ts
│   └── Permission.ts
├── utils/              # Utility functions
│   ├── jwt.ts
│   └── validation.ts
├── tests/              # Test files
│   ├── setup.ts
│   ├── auth.test.ts
│   ├── file.test.ts
│   ├── share.test.ts
│   ├── search.test.ts
│   └── api.test.ts
├── data-source.ts      # TypeORM configuration
└── index.ts           # Server entry point
```

## 🔐 Authentication & Authorization

### JWT Authentication
- Secure token-based authentication
- Token expiration and refresh
- Protected route middleware

### Google OAuth
- Google OAuth 2.0 integration
- Automatic user creation for new Google users
- Seamless login experience

### Role-Based Access Control
- **Owner**: Full control (read, write, delete, share)
- **Editor**: Can read and modify files
- **Viewer**: Read-only access

## 📁 File Management

### File Operations
- Upload single/multiple files
- Download with signed URLs
- Rename and move files
- Soft delete (trash) and permanent delete
- File search and filtering

### Folder Operations
- Create nested folder hierarchies
- List folder contents
- Rename and move folders
- Recursive delete operations
- Folder path navigation

## 🔗 Sharing & Permissions

### Public Link Sharing
```bash
# Generate public link
POST /api/shares/:fileId/public

# Access public file
GET /api/shares/public/:token

# Revoke public link
DELETE /api/shares/:fileId/public
```

### User-to-User Sharing
```bash
# Share with user
POST /api/shares/:fileId/user
{
  "email": "user@example.com",
  "role": "viewer"
}

# Remove user permission
DELETE /api/shares/:fileId/user/:userId
```

### Permission Management
```bash
# Get file permissions
GET /api/shares/:fileId/permissions

# Check user access
GET /api/shares/:fileId/access
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- AWS S3 bucket (for file storage)
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd google-drive-clone
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp env.example .env
```

4. **Configure environment variables**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name

# JWT
JWT_SECRET=your_jwt_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

5. **Database setup**
```bash
# Run the database setup script
psql -U your_db_user -d your_db_name -f scripts/setup-db.sql
```

6. **Start development server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

- [Authentication API](docs/auth-api.md)
- [File Management API](docs/file-api.md)
- [Folder Management API](docs/folder-api.md)
- [Sharing & Permissions API](docs/share-api.md)

## 🧪 Testing

### Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Test Coverage
- **Unit Tests**: Authentication, file operations, sharing, search
- **Integration Tests**: Database operations, service interactions
- **API Tests**: HTTP endpoints with supertest
- **Code Coverage**: >80% coverage threshold

### API Testing Examples

#### Authentication
```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

#### File Upload
```bash
# Upload file
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer your-jwt-token" \
  -F "file=@document.pdf"
```

#### File Sharing
```bash
# Share file with user
curl -X POST http://localhost:5000/api/shares/file-uuid/user \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"email":"colleague@company.com","role":"editor"}'

# Generate public link
curl -X POST http://localhost:5000/api/shares/file-uuid/public \
  -H "Authorization: Bearer your-jwt-token"
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Cross-origin resource sharing protection
- **Helmet.js**: Security headers middleware
- **Role-Based Access**: Granular permission control
- **Signed URLs**: Secure file access via AWS S3

## 📈 Performance Considerations

- **Database Indexing**: Optimized queries with proper indexes
- **File Streaming**: Efficient file upload/download handling
- **Caching**: Opportunities for Redis integration
- **Connection Pooling**: Database connection optimization

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker
docker build -t google-drive-backend .
docker run -p 5000:5000 google-drive-backend

# Deploy with Docker Compose
docker-compose up -d
```

### PM2 Deployment
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
npm run build
pm2 start ecosystem.config.js --env production

# Monitor processes
pm2 monit
```

### Production Considerations
- Use HTTPS in production
- Set up proper environment variables
- Configure database connection pooling
- Implement rate limiting
- Set up monitoring and logging
- Use a process manager (PM2)
- Configure Docker containers
- Set up CI/CD pipelines

### Environment Variables
```env
NODE_ENV=production
PORT=5000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Roadmap

### Completed Days
- ✅ Day 1: Project Setup & Planning
- ✅ Day 2: Authentication System
- ✅ Day 3: File Upload & Storage
- ✅ Day 4: File Management APIs
- ✅ Day 5: Sharing & Permissions
- ✅ Day 6: Search & Optimization
- ✅ Day 7: Testing & Deployment of Backend

### Future Days
- 🔄 Day 7: Real-time Collaboration
- 🔄 Day 8: Advanced Sharing Features
- 🔄 Day 9: File Preview & Editing
- 🔄 Day 10: Mobile API Support
- 🔄 Day 11: Analytics & Reporting
- 🔄 Day 12: Advanced Security
- 🔄 Day 13: Performance Optimization
- 🔄 Day 14: Production Deployment

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the development team.
