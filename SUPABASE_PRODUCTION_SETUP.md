# 🗄️ Supabase Production Setup Guide

## 📋 Prerequisites

Before setting up your production Supabase project, ensure you have:
- [ ] Supabase account (free tier available)
- [ ] Domain name (optional but recommended)
- [ ] SSL certificate (Let's Encrypt or purchased)

## 🔧 Step 1: Create Production Supabase Project

### 1.1 Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in with your account
3. Click "New Project"

### 1.2 Configure Project Settings

**Project Details:**
- **Name**: `google-drive-clone-prod` (or your preferred name)
- **Database Password**: Generate a strong password (save this securely!)
- **Region**: Choose closest to your users
- **Pricing Plan**: Start with free tier, upgrade as needed

**Important Notes:**
- Database password cannot be changed after creation
- Region affects latency for your users
- Free tier includes 500MB database and 1GB file storage

### 1.3 Wait for Project Setup

- Database setup: ~2-5 minutes
- Storage setup: ~1-2 minutes
- Total time: ~5-10 minutes

## 🗄️ Step 2: Database Setup

### 2.1 Access SQL Editor

1. In your project dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"

### 2.2 Run Database Migration

Copy and paste the entire contents of `scripts/setup-supabase.sql` into the SQL editor, then click "Run".

**Expected Output:**
- Tables created: `users`, `files`, `folders`, `permissions`, `shares`
- RLS policies enabled
- Indexes created
- Functions created

### 2.3 Verify Database Setup

Run this query to verify all tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

**Expected Tables:**
- `users`
- `files` 
- `folders`
- `permissions`
- `shares`

## 📁 Step 3: Storage Bucket Setup

### 3.1 Create Storage Bucket

1. Go to "Storage" in the left sidebar
2. Click "Create a new bucket"
3. **Bucket name**: `files`
4. **Public bucket**: ✅ Check this (for file sharing)
5. **File size limit**: 50MB (or your preferred limit)
6. Click "Create bucket"

### 3.2 Configure CORS (Optional)

If you need to upload files from your frontend domain:

1. Go to "Settings" → "API"
2. Find "Storage" section
3. Add your frontend domain to CORS origins:
   ```
   https://yourdomain.com
   http://localhost:3000 (for development)
   ```

## 🔐 Step 4: Authentication Setup

### 4.1 Configure Auth Settings

1. Go to "Authentication" → "Settings"
2. **Site URL**: Set to your frontend URL
3. **Redirect URLs**: Add your auth callback URLs:
   ```
   https://yourdomain.com/auth/callback
   http://localhost:3000/auth/callback (for development)
   ```

### 4.2 Enable Email Auth (Optional)

1. Go to "Authentication" → "Providers"
2. Enable "Email" provider
3. Configure email templates if needed

### 4.3 Enable Google OAuth (Optional)

1. Go to "Authentication" → "Providers"
2. Enable "Google" provider
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

## 🔑 Step 5: Get API Keys

### 5.1 Access API Settings

1. Go to "Settings" → "API"
2. Copy the following values:

**Required Values:**
- **Project URL**: `https://your-project-id.supabase.co`
- **anon public**: Your public anon key
- **service_role**: Your service role key (keep secret!)

### 5.2 Update Environment Variables

Update your `env.production` file with the real values:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_KEY=your_actual_service_role_key_here
SUPABASE_STORAGE_BUCKET=files

# Security (Generate new secrets!)
JWT_SECRET=your-actual-jwt-secret-here
SESSION_SECRET=your-actual-session-secret-here
```

## 🧪 Step 6: Test Your Setup

### 6.1 Test Database Connection

```bash
# Test the connection endpoint
curl http://localhost:5000/test-connection
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Supabase connection successful"
}
```

### 6.2 Test Storage Bucket

```bash
# Initialize storage bucket
curl http://localhost:5000/init-storage
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Storage bucket initialized"
}
```

### 6.3 Test File Upload (with auth)

```bash
# First, get a JWT token (you'll need to implement auth endpoints)
# Then test file upload
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-file.txt"
```

## 🔒 Step 7: Security Configuration

### 7.1 Row Level Security (RLS)

The SQL script should have enabled RLS. Verify these policies exist:

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 7.2 Storage Policies

Verify storage bucket policies:

1. Go to "Storage" → "Policies"
2. Ensure `files` bucket has appropriate policies
3. Default policy should allow authenticated users to upload

### 7.3 API Rate Limiting

Consider enabling rate limiting in your Supabase project:

1. Go to "Settings" → "API"
2. Configure rate limits as needed

## 📊 Step 8: Monitoring & Analytics

### 8.1 Database Monitoring

1. Go to "Reports" → "Database"
2. Monitor:
   - Query performance
   - Connection count
   - Storage usage

### 8.2 Storage Monitoring

1. Go to "Storage" → "Overview"
2. Monitor:
   - File count
   - Storage usage
   - Upload/download activity

### 8.3 Auth Monitoring

1. Go to "Authentication" → "Users"
2. Monitor:
   - User signups
   - Failed logins
   - Active sessions

## 🚨 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check your environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_KEY
```

**2. Storage Bucket Not Found**
```bash
# Verify bucket exists
curl -X GET "https://your-project.supabase.co/storage/v1/bucket/files" \
  -H "apikey: YOUR_ANON_KEY"
```

**3. RLS Policy Errors**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**4. CORS Issues**
- Verify CORS origins in Supabase settings
- Check browser console for CORS errors
- Ensure frontend URL matches configured origins

### Emergency Procedures

**Reset Project:**
1. Go to "Settings" → "General"
2. Click "Delete project" (⚠️ **DESTRUCTIVE**)
3. Create new project and re-run setup

**Rollback Database:**
1. Go to "Settings" → "Database"
2. Use "Point in time recovery" if available

## ✅ Final Checklist

- [ ] Supabase project created
- [ ] Database migration completed
- [ ] Storage bucket configured
- [ ] API keys copied
- [ ] Environment variables updated
- [ ] Database connection tested
- [ ] Storage bucket tested
- [ ] RLS policies verified
- [ ] CORS configured
- [ ] Auth providers configured
- [ ] Monitoring enabled

## 🎯 Next Steps

After completing this setup:

1. **Test your backend** with real Supabase credentials
2. **Deploy to production** using your preferred method
3. **Monitor performance** and adjust as needed
4. **Scale up** when you hit free tier limits

---

**Need Help?** Check the [Supabase Documentation](https://supabase.com/docs) or [Community Forum](https://github.com/supabase/supabase/discussions).
