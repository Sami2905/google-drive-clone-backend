# Supabase Setup Guide for Google Drive Clone

This guide will help you set up Supabase for authentication, database, and storage in your Google Drive clone project.

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `google-drive-clone` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (usually takes 2-3 minutes)

### 2. Get Your Project Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)
   - **Service role key** (starts with `eyJ...`) - Keep this secret!

### 3. Set Up Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Update your `.env` file with your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_key_here
   SUPABASE_STORAGE_BUCKET=files
   ```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `scripts/setup-supabase.sql`
3. Paste it into the SQL editor and click "Run"
4. This will create all necessary tables, indexes, and security policies

### 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, enter your frontend URL (e.g., `http://localhost:3000`)
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`
4. Save changes

### 6. Set Up Google OAuth (Optional)

1. Go to **Authentication** → **Providers**
2. Click on **Google**
3. Enable Google provider
4. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Save changes

### 7. Configure Storage

1. Go to **Storage** → **Buckets**
2. The `files` bucket should be created automatically by the SQL script
3. If not, create it manually:
   - **Name**: `files`
   - **Public**: `false` (for security)
   - **File size limit**: `50MB`
   - **Allowed MIME types**: Leave empty for all types

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Public anonymous key | Yes |
| `SUPABASE_SERVICE_KEY` | Service role key (for admin operations) | Yes |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name | No (defaults to 'files') |
| `FRONTEND_URL` | Your frontend application URL | Yes |
| `JWT_SECRET` | Secret for custom JWT generation | Yes |

### Database Tables

The setup script creates the following tables:

- **`users`** - User profiles (extends Supabase auth.users)
- **`folders`** - Folder structure
- **`files`** - File metadata and storage info
- **`permissions`** - File/folder sharing permissions
- **`shares`** - Public sharing links
- **`file_versions`** - File versioning
- **`tags`** - File organization tags
- **`storage_usage`** - User storage tracking

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Policies** ensure users can only access their own data
- **Authentication** handled by Supabase Auth
- **Storage** secured with user-specific paths

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
# or
npm run dev-supabase
```

### Production Build

```bash
npm run build
npm start
```

## 📱 Frontend Integration

### 1. Install Supabase Client

```bash
cd drive-frontend
npm install @supabase/supabase-js
```

### 2. Create Supabase Client

Create `drive-frontend/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. Add Environment Variables

Add to `drive-frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Update Authentication Hooks

Replace your current auth hooks with Supabase equivalents:

```typescript
// Example: useAuth hook with Supabase
import { useAuthStateChange, useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useUser()
  
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }
  
  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })
    return { data, error }
  }
  
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }
  
  return {
    user,
    signIn,
    signUp,
    signOut,
    isLoading: !user
  }
}
```

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use different keys for development and production
- Rotate service keys regularly

### 2. Row Level Security
- All tables have RLS enabled
- Policies are automatically enforced
- Users can only access their own data

### 3. Storage Security
- Files are stored in user-specific paths
- Public access is disabled by default
- Use signed URLs for temporary access

### 4. API Security
- All routes (except auth) require authentication
- JWT tokens are validated on every request
- CORS is configured for your frontend domain

## 🧪 Testing

### 1. Test Authentication

```bash
# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test Protected Routes

```bash
# Get user profile (requires auth token)
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test File Upload

```bash
# Upload file (requires auth token)
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.txt" \
  -F "folderId=null"
```

## 🚨 Troubleshooting

### Common Issues

1. **"Missing Supabase configuration"**
   - Check your `.env` file
   - Ensure all required variables are set

2. **"Authentication failed"**
   - Verify your Supabase credentials
   - Check if the user exists in Supabase Auth

3. **"Storage bucket not found"**
   - Run the SQL setup script
   - Check bucket permissions

4. **"CORS error"**
   - Verify `FRONTEND_URL` in your environment
   - Check Supabase CORS settings

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
DEBUG=supabase:*
```

### Health Check

Visit `http://localhost:5000/health` to check server status and configuration.

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage-createbucket)

## 🔄 Migration from Existing Setup

If you're migrating from the current TypeORM setup:

1. **Backup your data** before making changes
2. **Export existing data** from your current database
3. **Run the Supabase setup script** to create new tables
4. **Import your data** into the new Supabase tables
5. **Update your frontend** to use Supabase client
6. **Test thoroughly** before deploying

## 🎯 Next Steps

After completing the setup:

1. **Test all authentication flows** (signup, login, OAuth)
2. **Verify file uploads** work with Supabase Storage
3. **Test sharing and permissions** functionality
4. **Deploy to production** with proper environment variables
5. **Monitor usage** in your Supabase dashboard

---

**Need help?** Check the [Supabase Discord](https://discord.supabase.com) or create an issue in this repository.
