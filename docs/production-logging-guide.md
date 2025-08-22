# 🚀 Production Logging & Monitoring Guide

This guide covers setting up comprehensive logging and monitoring for your Google Drive Clone in production.

## 📊 Enhanced Logging Features

Our enhanced logging system provides:

- **Structured Logging**: JSON-formatted logs with metadata
- **Request Logging**: All API requests with timing and context
- **Error Tracking**: Detailed error information with stack traces
- **Performance Monitoring**: Request duration and resource usage
- **Security Logging**: Authentication and authorization events
- **File Operation Logging**: Upload, download, and storage events

## 🔧 Environment Configuration

### Production Logging Variables

Add these to your `.env.production` file:

```env
# Enhanced Logging Configuration
LOG_LEVEL=info                    # debug, info, warn, error
LOG_FORMAT=json                   # json or text
LOG_FILE_PATH=./logs/app.log      # Log file path
LOG_MAX_SIZE=100MB                # Max log file size
LOG_MAX_FILES=10                  # Number of log files to keep
LOG_ROTATION=true                 # Enable log rotation

# Monitoring Configuration
METRICS_ENABLED=true              # Enable metrics collection
HEALTH_CHECK_INTERVAL=30000       # Health check interval (ms)
PERFORMANCE_MONITORING=true       # Enable performance tracking
ERROR_ALERTING=true               # Enable error alerting

# External Monitoring
SENTRY_DSN=your_sentry_dsn        # Sentry error tracking
LOGTAIL_TOKEN=your_logtail_token  # Logtail log aggregation
DATADOG_API_KEY=your_datadog_key  # Datadog monitoring
```

## 🚀 Deployment with Enhanced Logging

### 1. Docker Deployment

```bash
# Build with logging enabled
docker build -f Dockerfile.production -t drive-clone:latest .

# Run with logging configuration
docker run -d \
  --name drive-clone \
  -p 5000:5000 \
  -v ./logs:/app/logs \
  -e LOG_LEVEL=info \
  -e LOG_FORMAT=json \
  -e METRICS_ENABLED=true \
  drive-clone:latest
```

### 2. PM2 Deployment

```bash
# Start with logging configuration
pm2 start ecosystem.config.production.js \
  --env production \
  --log ./logs/app.log \
  --max-memory-restart 1G \
  --node-args="--max-old-space-size=2048"
```

### 3. Manual Deployment

```bash
# Set environment variables
export LOG_LEVEL=info
export LOG_FORMAT=json
export METRICS_ENABLED=true

# Start production server
npm run start:production
```

## 📊 Log Analysis & Monitoring

### 1. Real-time Log Monitoring

```bash
# Watch logs in real-time
tail -f logs/app.log | jq '.'

# Filter by log level
tail -f logs/app.log | jq 'select(.level == "error")'

# Filter by endpoint
tail -f logs/app.log | jq 'select(.context.type == "request")'
```

### 2. Log Aggregation with Logtail

```bash
# Install Logtail CLI
npm install -g @logtail/cli

# Stream logs to Logtail
tail -f logs/app.log | logtail stream your_token
```

### 3. Error Tracking with Sentry

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Upload source maps
sentry-cli releases files v1.0.0 upload-sourcemaps ./dist
```

## 🔍 Log Examples

### Request Log Example

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "API Request",
  "context": {
    "type": "request",
    "method": "POST",
    "url": "/api/files/upload",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "userId": "user_123",
    "duration": 1250,
    "statusCode": 200
  },
  "metadata": {
    "fileSize": "2.5MB",
    "fileType": "application/pdf",
    "uploadId": "upload_456"
  }
}
```

### Error Log Example

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "error",
  "message": "File upload failed",
  "context": {
    "type": "error",
    "errorCode": "STORAGE_ERROR",
    "endpoint": "/api/files/upload",
    "userId": "user_123",
    "requestId": "req_789"
  },
  "error": {
    "message": "Storage bucket not accessible",
    "stack": "Error: Storage bucket not accessible...",
    "code": "BUCKET_ACCESS_DENIED"
  },
  "metadata": {
    "fileSize": "2.5MB",
    "fileType": "application/pdf",
    "attempt": 1
  }
}
```

## 📈 Performance Monitoring

### 1. Request Duration Tracking

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Performance Metric",
  "context": {
    "type": "performance",
    "endpoint": "/api/files/upload",
    "method": "POST",
    "duration": 1250,
    "memoryUsage": "45.2MB",
    "cpuUsage": "12.5%"
  }
}
```

### 2. Storage Usage Monitoring

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Storage Usage Update",
  "context": {
    "type": "storage",
    "userId": "user_123",
    "totalUsage": "2.5GB",
    "fileCount": 150,
    "quota": "10GB"
  }
}
```

## 🚨 Alerting & Notifications

### 1. Error Rate Alerts

```bash
# Monitor error rates
tail -f logs/app.log | jq 'select(.level == "error")' | \
  awk '{print $1}' | sort | uniq -c | \
  awk '$1 > 10 {print "HIGH ERROR RATE: " $1 " errors in last minute"}'
```

### 2. Performance Alerts

```bash
# Monitor slow requests
tail -f logs/app.log | jq 'select(.context.duration > 5000)' | \
  jq -r '"SLOW REQUEST: " + .context.endpoint + " took " + (.context.duration|tostring) + "ms"'
```

### 3. Storage Quota Alerts

```bash
# Monitor storage usage
tail -f logs/app.log | jq 'select(.context.type == "storage")' | \
  jq 'select(.context.totalUsage > .context.quota * 0.9)' | \
  jq -r '"STORAGE QUOTA WARNING: " + .context.userId + " at " + (.context.totalUsage|tostring)'
```

## 🔧 Log Rotation & Maintenance

### 1. Automatic Log Rotation

```bash
# Install logrotate
sudo apt-get install logrotate

# Configure logrotate
sudo nano /etc/logrotate.d/drive-clone
```

```conf
/path/to/your/app/logs/*.log {
    daily
    missingok
    rotate 10
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload drive-clone
    endscript
}
```

### 2. Manual Log Cleanup

```bash
# Clean old logs
find ./logs -name "*.log.*" -mtime +30 -delete

# Compress old logs
find ./logs -name "*.log.*" -exec gzip {} \;

# Archive logs monthly
tar -czf logs-$(date +%Y-%m).tar.gz logs/*.log.*
```

## 📊 Dashboard & Visualization

### 1. Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Drive Clone Production Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_errors_total[5m])",
            "legendFormat": "{{errorCode}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

### 2. Custom Metrics

```typescript
// Example custom metric
import { logger } from '../lib/logger';

export const trackFileOperation = (operation: string, duration: number, success: boolean) => {
  logger.info('File Operation Metric', {
    context: {
      type: 'metric',
      operation,
      duration,
      success
    }
  });
};
```

## 🆘 Troubleshooting

### Common Logging Issues

1. **Logs not appearing**: Check file permissions and disk space
2. **High log volume**: Adjust log level and implement filtering
3. **Performance impact**: Use async logging and buffer writes
4. **Log rotation failures**: Check logrotate configuration and permissions

### Debug Commands

```bash
# Check log file permissions
ls -la logs/

# Monitor disk space
df -h logs/

# Check logrotate status
sudo logrotate -d /etc/logrotate.d/drive-clone

# Test logging configuration
curl -X POST http://localhost:5000/api/debug/logs
```

## 📚 Additional Resources

- **Logging Best Practices**: [Node.js Logging Guide](https://nodejs.org/en/docs/guides/logging/)
- **Structured Logging**: [Winston Documentation](https://github.com/winstonjs/winston)
- **Performance Monitoring**: [Node.js Performance Hooks](https://nodejs.org/api/perf_hooks.html)
- **Error Tracking**: [Sentry Documentation](https://docs.sentry.io/)

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Production Ready
