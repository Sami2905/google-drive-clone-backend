# ☁️ AWS S3 Setup Guide (Alternative)

This guide will help you set up AWS S3 for your Google Drive clone project.

## 🚀 Quick Setup

### Step 1: Create AWS Account

1. Go to [AWS Console](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Follow the registration process
4. Add a credit card (required, but free tier available)

### Step 2: Create S3 Bucket

1. Go to [S3 Console](https://console.aws.amazon.com/s3/)
2. Click "Create bucket"
3. Enter bucket name: `google-drive-clone-files` (must be globally unique)
4. Choose region (closest to your users)
5. Uncheck "Block all public access" (we'll handle security with IAM)
6. Click "Create bucket"

### Step 3: Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Add user"
3. Enter username: `google-drive-clone-user`
4. Select "Programmatic access"
5. Click "Next: Permissions"

### Step 4: Attach S3 Policy

1. Click "Attach existing policies directly"
2. Search for "S3" and select "AmazonS3FullAccess" (for simplicity)
3. Click "Next: Tags" → "Next: Review" → "Create user"
4. **Important**: Download the CSV file with Access Key ID and Secret Access Key

### Step 5: Update Environment Variables

Add these to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## 🔧 S3 Bucket Policy (Security)

Create a bucket policy in your S3 bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PrivateReadWrite",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/google-drive-clone-user"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

## 📊 AWS S3 Free Tier Limits

- **Storage**: 5GB
- **Requests**: 20,000 GET requests, 2,000 PUT requests
- **Data Transfer**: 15GB outbound
- **Duration**: 12 months

## 🧪 Testing S3 Storage

After setup, restart your server and test file upload:

```bash
npm run dev-postgres
```

The server will automatically detect AWS credentials and use S3 instead of mock storage.

## 🔍 Troubleshooting

### Issue: "Access Denied"
- Check IAM user permissions
- Verify bucket policy
- Ensure Access Key ID and Secret Access Key are correct

### Issue: "NoSuchBucket"
- Verify bucket name in environment variables
- Check bucket region matches your configuration

### Issue: "InvalidAccessKeyId"
- Verify Access Key ID is correct
- Check that the IAM user exists and is active

## 🎯 Benefits of AWS S3

✅ **Reliability**: 99.99% availability
✅ **Security**: Advanced encryption and access controls
✅ **Scalability**: Unlimited storage and requests
✅ **Integration**: Works with other AWS services
✅ **Analytics**: Detailed usage and cost analytics

## 🔄 Migration from Mock Storage

When you add AWS credentials to your `.env` file, the system will automatically:
1. Switch from mock storage to S3
2. Upload new files to S3
3. Generate signed URLs for secure access
4. Handle file deletions in S3

## 💰 Cost Optimization

- Use S3 Intelligent Tiering for automatic cost optimization
- Set up lifecycle policies to move old files to cheaper storage
- Monitor usage with AWS Cost Explorer
- Set up billing alerts

## 📝 Next Steps

1. Set up CloudFront CDN for faster global access
2. Configure S3 event notifications
3. Set up backup and disaster recovery
4. Implement monitoring and alerting

---

**Need help?** Check the [AWS S3 Documentation](https://docs.aws.amazon.com/s3/) for detailed guides.
