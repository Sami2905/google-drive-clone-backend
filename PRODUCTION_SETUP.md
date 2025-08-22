# 🚀 Production Environment Setup Guide

## 📋 Prerequisites

Before setting up production, ensure you have:
- [ ] Supabase production project created
- [ ] Domain name configured (optional but recommended)
- [ ] SSL certificate (Let's Encrypt or purchased)
- [ ] Server with Node.js 18+ installed
- [ ] Docker installed (if using containerization)

## 🔧 Step 1: Configure Production Environment

### 1.1 Update Environment Variables

Edit your `.env.production` file with your actual values:

```bash
# Supabase Configuration (REQUIRED - Get these from your Supabase project)
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_KEY=your_actual_service_role_key_here
SUPABASE_STORAGE_BUCKET=files

# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com  # or your server IP

# Security (REQUIRED - Generate strong secrets)
JWT_SECRET=generate-a-very-long-random-string-here-min-32-characters
SESSION_SECRET=generate-another-very-long-random-string-here-min-32-characters

# File Upload Configuration
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=image/*,application/pdf,text/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Optional: Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_PASSWORD=your_grafana_password

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Optional: SSL/TLS
SSL_KEY_PATH=./ssl/private.key
SSL_CERT_PATH=./ssl/certificate.crt

# Optional: Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Performance
CLUSTER_MODE=true
WORKER_PROCESSES=4
MAX_OLD_SPACE_SIZE=2048
```

### 1.2 Generate Secure Secrets

```bash
# Generate JWT Secret (run this command)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Session Secret (run this command)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🗄️ Step 2: Supabase Production Setup

### 2.1 Create Production Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `google-drive-clone-prod`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select appropriate plan

### 2.2 Run Database Migration

1. Go to your project's SQL Editor
2. Copy the contents of `scripts/setup-supabase.sql`
3. Paste and execute the SQL script
4. Verify all tables are created successfully

### 2.3 Configure Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `files`
3. Set bucket to public (for file sharing)
4. Configure CORS if needed

### 2.4 Set Up Row Level Security (RLS)

The SQL script should have set up RLS policies. Verify they're working:
- Users can only access their own files
- Public files are accessible to everyone
- Shared files respect permissions

## 🐳 Step 3: Deployment Options

### Option A: Docker Deployment (Recommended)

```bash
# Build production image
npm run docker:build

# Run with production environment
npm run docker:run

# Or use Docker Compose
npm run docker:compose
```

### Option B: PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start production process
npm run pm2:start

# Monitor process
npm run pm2:monitor
```

### Option C: Manual Deployment

```bash
# Build production code
npm run build:production

# Start production server
npm start
```

## 🔒 Step 4: Security Configuration

### 4.1 Firewall Setup

```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 5000  # Your app port (if not behind reverse proxy)
sudo ufw enable
```

### 4.2 SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4.3 Nginx Reverse Proxy (Optional but Recommended)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 Step 5: Testing Production Setup

### 5.1 Health Check

```bash
# Test if server is running
curl -f http://localhost:5000/health

# Test with production environment
curl -f https://yourdomain.com/health
```

### 5.2 Test File Upload

1. Create a test user account
2. Upload a small test file
3. Verify file is stored in Supabase
4. Test file download and sharing

### 5.3 Monitor Logs

```bash
# View application logs
npm run pm2:logs

# Monitor system resources
npm run pm2:monitor
```

## 📊 Step 6: Monitoring & Maintenance

### 6.1 Set Up Monitoring

- **Uptime Monitoring**: Use UptimeRobot or similar
- **Error Tracking**: Consider Sentry for error monitoring
- **Performance Monitoring**: Use PM2's built-in monitoring

### 6.2 Backup Strategy

```bash
# Database backup (Supabase handles this automatically)
# File backup (Supabase Storage handles this automatically)
# Configuration backup
cp .env.production ./backups/env.production.$(date +%Y%m%d)
```

### 6.3 Update Strategy

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build and restart
npm run build:production
npm run pm2:restart
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check Supabase credentials
   - Verify network access
   - Check RLS policies

2. **File Upload Fails**
   - Verify storage bucket exists
   - Check bucket permissions
   - Verify file size limits

3. **Authentication Issues**
   - Check JWT secret configuration
   - Verify Supabase auth settings
   - Check CORS configuration

### Emergency Procedures

```bash
# Quick rollback
npm run deploy:rollback

# Restart services
npm run pm2:restart

# Check health
npm run deploy:health
```

## ✅ Final Checklist

- [ ] Environment variables configured
- [ ] Supabase project set up
- [ ] Database migration completed
- [ ] Storage bucket configured
- [ ] Security secrets generated
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Health checks passing
- [ ] File upload/download working
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Team trained on deployment

---

**Next Steps**: After completing this setup, run the test suites to ensure everything is working correctly before going live.
