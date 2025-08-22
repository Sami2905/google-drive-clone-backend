# google-drive-clone-backend

A comprehensive backend implementation for a Google Drive clone with file storage, sharing, and collaboration features. Built with Node.js, Express, TypeScript, and Supabase.

## 🚀 Features

### ✅ Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication system
- **Google OAuth Integration**: Seamless login via Google OAuth 2.0
- **Password Security**: bcrypt hashing for secure password storage
- **Role-Based Access Control**: Granular permission management
- **Session Management**: Secure session handling and token refresh

### ✅ File Management System
- **File Upload & Storage**: Secure file upload with Multer middleware
- **Supabase Storage Integration**: Cloud-based file storage solution
- **File Metadata Management**: Comprehensive file information tracking
- **File Type Validation**: Security checks for uploaded files
- **File Operations**: Upload, download, rename, move, and delete

### ✅ Folder Management
- **Hierarchical Structure**: Nested folder organization
- **CRUD Operations**: Complete folder management capabilities
- **Path Navigation**: Breadcrumb and tree structure support
- **Recursive Operations**: Efficient folder tree manipulation

### ✅ Sharing & Permissions
- **Public Link Sharing**: Generate and revoke secure public links
- **User-to-User Sharing**: Share files with specific users by email
- **Permission Levels**: Viewer, Editor, and Owner roles
- **Access Control**: Granular permission management
- **Secure File Access**: Integration with existing file operations

### ✅ Search & Optimization
- **Full-Text Search**: Search files and folders by name
- **Pagination**: Efficient handling of large result sets
- **Sorting Options**: Multiple sort criteria (name, size, date)
- **Advanced Filtering**: Filter by type, size, date range
- **Performance Optimization**: Database indexing and query optimization

### ✅ Security & Production Features
- **Security Headers**: Helmet.js integration for security
- **CORS Protection**: Cross-origin resource sharing configuration
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting for abuse prevention
- **Error Handling**: Robust error handling and logging
- **Production Ready**: Docker, PM2, and deployment configurations

## 🛠 Tech Stack

### **Core Technologies**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Language**: TypeScript for type safety
- **Database**: Supabase (PostgreSQL)

### **Authentication & Security**
- **JWT**: JSON Web Token authentication
- **Passport.js**: Authentication middleware
- **bcrypt**: Password hashing
- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing

### **File Handling**
- **Multer**: File upload middleware
- **Supabase Storage**: Cloud file storage
- **File Type Validation**: Security checks

### **Development & Testing**
- **ts-node-dev**: Development server with hot reload
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Supertest**: API testing

### **Deployment & DevOps**
- **Docker**: Containerization
- **PM2**: Process management
- **Docker Compose**: Multi-container orchestration

## 📁 Project Structure

```
src/
├── middleware/              # Custom middleware
│   └── supabaseAuthMiddleware.ts
├── models/                  # Database entities
│   ├── File.ts             # File model with metadata
│   ├── Folder.ts           # Folder model with hierarchy
│   ├── Permission.ts       # Permission model for sharing
│   ├── Share.ts            # Share model for file sharing
│   ├── User.ts             # User model with authentication
│   └── index.ts            # Model exports
├── services/                # Business logic layer
│   ├── databaseService.ts  # Database operations
│   └── supabaseStorageService.ts  # File storage operations
├── supabase-server.ts       # Main server file with Express setup
├── tests/                   # Test files
│   ├── file-operations.integration.test.ts
│   ├── logger.test.ts
│   ├── setup-supabase.ts
│   ├── supabase-service.test.ts
│   └── supabase-storage.test.ts
├── scripts/                 # Database and setup scripts
├── docs/                    # API documentation
└── ecosystem.config.js      # PM2 configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sami2905/google-drive-clone-backend.git
   cd google-drive-clone-backend
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Environment setup**
   ```bash
   cp backend.env.example .env
   ```

4. **Configure environment variables**
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_STORAGE_BUCKET=files
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/logout` - User logout

### File Management Endpoints
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Get file details
- `PUT /api/files/:id` - Update file
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/:id/download` - Download file

### Folder Management Endpoints
- `POST /api/folders` - Create folder
- `GET /api/folders/:id` - Get folder contents
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

### Sharing Endpoints
- `POST /api/shares` - Share file/folder
- `GET /api/shares/:id` - Get share details
- `DELETE /api/shares/:id` - Remove share

Detailed API documentation is available in the `docs/` directory.

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test suites
npm run test:supabase
```

### Test Coverage
- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: Database operations and API endpoints
- **API Tests**: HTTP endpoint testing with Supertest
- **Coverage Target**: >80% code coverage

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

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Cross-origin resource sharing protection
- **Security Headers**: Helmet.js for security headers
- **Role-Based Access**: Granular permission control
- **File Validation**: Secure file upload handling

## 📈 Performance Features

- **Database Indexing**: Optimized queries with proper indexes
- **File Streaming**: Efficient file upload/download handling
- **Connection Pooling**: Database connection optimization
- **Caching**: Opportunities for Redis integration
- **Pagination**: Efficient handling of large datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.



## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check the documentation in the `docs/` directory
- Review the test files for usage examples

## 🔗 Related Repositories

- **Frontend**: [google-drive-clone-frontend](https://github.com/Sami2905/google-drive-clone-frontend)
- **Backend**: [google-drive-clone-backend](https://github.com/Sami2905/google-drive-clone-backend)

---

**Built with ❤️ using Node.js, Express, TypeScript, and Supabase**
