# Production Deployment Guide

This guide covers deploying your Google Drive Clone with Supabase to production.

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js 18+** and **npm 8+**
- **Docker** and **Docker Compose**
- **PM2** (for process management)
- **Nginx** (for reverse proxy)
- **SSL Certificate** (Let's Encrypt recommended)
- **Domain Name** pointing to your server

### 2. Environment Setup

```bash
# Copy production environment template
cp env.production .env.production

# Edit with your production values
nano .env.production
```

### 3. Deploy

```bash
# Full deployment
npm run deploy:production

# Or step by step
npm run build:production
npm run docker:compose
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80/443)│────│  Frontend (3000)│────│   API (5000)    │
│   (Reverse Proxy)│    │  (Next.js)      │    │  (Express)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                        ┌─────────────────┐    ┌─────────────────┐
                        │   Redis (6379)  │    │  Supabase      │
                        │   (Caching)     │    │  (Database)    │
                        └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment | Yes | `production` |
| `SUPABASE_URL` | Supabase project URL | Yes | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anonymous key | Yes | `eyJ...` |
| `SUPABASE_SERVICE_KEY` | Service role key | Yes | `eyJ...` |
| `JWT_SECRET` | JWT signing secret | Yes | `super-secret-key` |
| `FRONTEND_URL` | Frontend domain | Yes | `https://yourdomain.com` |
| `MAX_FILE_SIZE` | Max file upload size | No | `100MB` |

### Security Configuration

```bash
# Generate secure secrets
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # SESSION_SECRET

# Set file permissions
chmod 600 .env.production
chown www-data:www-data .env.production
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build production image
npm run docker:build

# Run with environment file
npm run docker:run

# Or use Docker Compose
npm run docker:compose
```

### Docker Compose Services

- **API**: Express.js backend with Supabase
- **Frontend**: Next.js frontend
- **Nginx**: Reverse proxy with SSL
- **Redis**: Caching and sessions
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboard

## 📊 Process Management (PM2)

### Start/Stop Services

```bash
# Start production cluster
npm run pm2:start

# Monitor processes
npm run pm2:monitor

# View logs
npm run pm2:logs

# Graceful reload
npm run pm2:reload
```

### PM2 Configuration

- **Cluster Mode**: Multiple worker processes
- **Auto-restart**: On crashes or memory limits
- **Log Management**: Rotated log files
- **Health Checks**: Built-in monitoring

## 🔒 Security Hardening

### 1. Firewall Configuration

```bash
# UFW firewall rules
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 5000/tcp    # API (if external)
ufw enable
```

### 2. SSL/TLS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Nginx Security

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

## 📈 Monitoring & Observability

### 1. Health Checks

```bash
# API health check
curl -f http://localhost:5000/health

# Automated monitoring
npm run health:check
```

### 2. Metrics Collection

- **Prometheus**: Time-series metrics
- **Grafana**: Visualization dashboards
- **Custom Metrics**: Business KPIs

### 3. Log Management

```bash
# View application logs
tail -f logs/app.log

# View PM2 logs
npm run pm2:logs

# Log rotation
logrotate /etc/logrotate.d/google-drive-clone
```

## 🧪 Testing in Production

### 1. Test Suite

```bash
# Run all tests
npm run test:ci

# Test production build
npm run test:build

# Integration tests
npm run test:integration
```

### 2. Load Testing

```bash
# Install Artillery
npm install -g artillery

# Run load test
npm run performance:test
```

### 3. Security Testing

```bash
# Security audit
npm run security:audit

# Vulnerability scan
npm run security:check
```

## 🔄 Deployment Process

### 1. Automated Deployment

```bash
# Full deployment
npm run deploy:production

# Rollback if needed
npm run deploy:rollback

# Health check
npm run deploy:health
```

### 2. Blue-Green Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Test staging
npm run test:staging

# Promote to production
npm run deploy:production
```

### 3. Zero-Downtime Updates

- **PM2 Cluster Mode**: Multiple workers
- **Graceful Reloads**: No connection drops
- **Health Checks**: Automatic rollback

## 📦 Backup & Recovery

### 1. Database Backups

```bash
# Automated backups
npm run backup:database

# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. File Storage Backups

```bash
# Backup Supabase storage
npm run backup:files

# Sync to backup location
rsync -avz /app/uploads/ /backup/uploads/
```

### 3. Disaster Recovery

```bash
# Restore from backup
npm run restore:database backup_20231201_120000.sql

# Full system restore
npm run restore:system
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using port 5000
   sudo netstat -tlnp | grep :5000
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   pm2 monit
   
   # Increase memory limit
   pm2 restart google-drive-clone-api --max-memory-restart 2G
   ```

3. **Database Connection**
   ```bash
   # Test Supabase connection
   npm run test-supabase
   
   # Check environment variables
   echo $SUPABASE_URL
   ```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=supabase:*
export LOG_LEVEL=debug

# Start with debug
npm run dev
```

## 📚 Additional Resources

- [Supabase Production Guide](https://supabase.com/docs/guides/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Security](https://nginx.org/en/docs/http/ngx_http_core_module.html)

## 🆘 Support

- **Documentation**: Check this guide first
- **Issues**: Create GitHub issue
- **Community**: Supabase Discord
- **Emergency**: Rollback to previous version

---

**Remember**: Always test in staging before deploying to production!
