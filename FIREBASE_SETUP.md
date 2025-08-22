# 🔥 Firebase Storage Setup Guide

This guide will help you set up Firebase Storage for your Google Drive clone project.

## 🚀 Quick Setup (Recommended)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `google-drive-clone` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Storage

1. In your Firebase project, go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)
5. Click "Done"

### Step 3: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and choose "Web" (</>)
4. Register app with name: `Google Drive Clone`
5. Copy the configuration object

### Step 4: Update Environment Variables

Add these to your `.env` file:

```env
# Firebase Configuration
FIREBASE_API_KEY=your-api-key-here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## 🔧 Storage Rules (Security)

Update your Firebase Storage rules in the Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload files
    match /uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Allow public read for shared files (optional)
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 📊 Firebase Storage Limits (Free Tier)

- **Storage**: 5GB
- **Download**: 1GB/day
- **Upload**: 20GB/day
- **Deletes**: 10,000/day

## 🧪 Testing Firebase Storage

After setup, restart your server and test file upload:

```bash
npm run dev-postgres
```

The server will automatically detect Firebase credentials and use Firebase Storage instead of mock storage.

## 🔍 Troubleshooting

### Issue: "Firebase Storage not initialized"
- Check that all Firebase environment variables are set
- Verify the API key and project ID are correct

### Issue: "Permission denied"
- Check Firebase Storage rules
- Ensure you're using the correct user authentication

### Issue: "Storage bucket not found"
- Verify the storage bucket name in your `.env` file
- Make sure Storage is enabled in your Firebase project

## 🎯 Benefits of Firebase Storage

✅ **Easy Setup**: Simple configuration and management
✅ **Free Tier**: Generous 5GB storage limit
✅ **Real-time**: Built-in real-time capabilities
✅ **Security**: Fine-grained security rules
✅ **CDN**: Global content delivery network
✅ **Scalability**: Automatic scaling

## 🔄 Migration from Mock Storage

When you add Firebase credentials to your `.env` file, the system will automatically:
1. Switch from mock storage to Firebase Storage
2. Upload new files to Firebase
3. Generate real download URLs
4. Handle file deletions in Firebase

Existing files in the database will continue to work, but new uploads will go to Firebase.

## 📝 Next Steps

1. Set up Firebase Authentication (optional)
2. Configure custom domain (optional)
3. Set up monitoring and analytics
4. Configure backup strategies

---

**Need help?** Check the [Firebase Documentation](https://firebase.google.com/docs/storage) for detailed guides.
