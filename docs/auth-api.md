# Authentication API Documentation

## Overview

The Authentication API provides secure user registration, login, and profile management functionality with JWT tokens and Google OAuth support.

## Base URL

```
http://localhost:5000/api/auth
```

## Authentication

Most endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. User Registration

**POST** `/signup`

Create a new user account.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "free",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid input data
- **409 Conflict**: Email already exists

---

### 2. User Login

**POST** `/login`

Authenticate user with email and password.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "free",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: Missing email or password
- **401 Unauthorized**: Invalid credentials

---

### 3. Get User Profile

**GET** `/profile`

Get current user's profile information.

#### Headers

```
Authorization: Bearer <jwt-token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "free",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses

- **401 Unauthorized**: Missing or invalid token

---

### 4. Update User Profile

**PUT** `/profile`

Update current user's profile information.

#### Headers

```
Authorization: Bearer <jwt-token>
```

#### Request Body

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid-here",
    "email": "updated@example.com",
    "name": "Updated Name",
    "plan": "free",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid token
- **409 Conflict**: Email already in use

---

### 5. Change Password

**PUT** `/change-password`

Change user's password.

#### Headers

```
Authorization: Bearer <jwt-token>
```

#### Request Body

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

#### Error Responses

- **400 Bad Request**: Invalid input or wrong current password
- **401 Unauthorized**: Missing or invalid token

---

### 6. Delete Account

**DELETE** `/account`

Delete user account permanently.

#### Headers

```
Authorization: Bearer <jwt-token>
```

#### Request Body

```json
{
  "password": "currentpassword123"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

#### Error Responses

- **400 Bad Request**: Wrong password
- **401 Unauthorized**: Missing or invalid token

---

### 7. Logout

**POST** `/logout`

Logout user (client-side token removal).

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 8. Refresh Token

**POST** `/refresh-token`

Get a new JWT token with extended expiration.

#### Headers

```
Authorization: Bearer <jwt-token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "free",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 9. Google OAuth

#### Initiate Google Login

**GET** `/google`

Redirects user to Google OAuth consent screen.

#### Response

Redirects to Google OAuth URL.

#### Callback

**GET** `/google/callback`

Google OAuth callback endpoint.

#### Response

Redirects to frontend with token:
```
http://localhost:3000/auth/success?token=<jwt-token>
```

---

### 10. Health Check

**GET** `/health`

Check if auth routes are working.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Auth routes are working",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

## JWT Token Format

JWT tokens are returned in the format:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<signature>
```

### Token Payload

```json
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "iat": 1640995200,
  "exp": 1641600000,
  "iss": "google-drive-clone",
  "aud": "google-drive-clone-users"
}
```

### Token Expiration

- **Default**: 7 days
- **Refresh**: Use `/refresh-token` endpoint

## Validation Rules

### Email
- Must be valid email format
- Must be unique across all users

### Password
- Minimum 6 characters
- Maximum 100 characters
- Stored as bcrypt hash

### Name
- Minimum 2 characters
- Maximum 50 characters

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Signed with secret key
- **CORS**: Configured for frontend origin
- **Input Validation**: Comprehensive validation middleware
- **Rate Limiting**: Recommended for production
- **HTTPS**: Required in production

## Testing

### cURL Examples

#### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Get Profile
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <your-token>"
```

## Environment Variables

Required environment variables:

```env
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```
