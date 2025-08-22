#!/bin/bash

# 🚀 Production Deployment Script for Google Drive Clone
# This script deploys the application with enhanced logging and monitoring

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="drive-clone"
DEPLOYMENT_DIR="/opt/drive-clone"
BACKUP_DIR="/opt/backups/drive-clone"
LOG_DIR="/var/log/drive-clone"
ENV_FILE=".env.production"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root for production deployment"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        log "Docker found - will use containerized deployment"
        USE_DOCKER=true
    else
        log "Docker not found - will use direct deployment"
        USE_DOCKER=false
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        warn "PM2 not found - installing globally"
        npm install -g pm2
    fi
    
    log "Prerequisites check completed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p "$DEPLOYMENT_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$LOG_DIR/archive"
    
    # Set proper permissions
    chown -R www-data:www-data "$DEPLOYMENT_DIR"
    chown -R www-data:www-data "$LOG_DIR"
    chmod 755 "$DEPLOYMENT_DIR"
    chmod 755 "$LOG_DIR"
    
    log "Directories created successfully"
}

# Backup existing deployment
backup_existing() {
    if [ -d "$DEPLOYMENT_DIR/app" ]; then
        log "Backing up existing deployment..."
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$DEPLOYMENT_DIR" app
        log "Backup created: $BACKUP_NAME"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing production dependencies..."
    
    # Remove dev dependencies
    npm ci --only=production
    
    # Install PM2 globally if not present
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    log "Dependencies installed successfully"
}

# Build production code
build_production() {
    log "Building production code..."
    
    # Clean previous build
    rm -rf dist/
    
    # Build TypeScript
    npm run build:production
    
    # Verify build output
    if [ ! -d "dist" ]; then
        error "Build failed - dist directory not found"
    fi
    
    log "Production build completed successfully"
}

# Configure enhanced logging
configure_logging() {
    log "Configuring enhanced logging..."
    
    # Create logrotate configuration
    cat > /etc/logrotate.d/drive-clone << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 10
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload $APP_NAME
    endscript
}
EOF
    
    # Create logs directory with proper permissions
    mkdir -p "$LOG_DIR"
    chown www-data:www-data "$LOG_DIR"
    chmod 755 "$LOG_DIR"
    
    # Set up log monitoring
    cat > /etc/systemd/system/drive-clone-log-monitor.service << EOF
[Unit]
Description=Drive Clone Log Monitor
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
ExecStart=/usr/bin/tail -f $LOG_DIR/app.log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable drive-clone-log-monitor
    
    log "Logging configuration completed"
}

# Deploy with Docker
deploy_docker() {
    log "Deploying with Docker..."
    
    # Build production image
    docker build -f Dockerfile.production -t "$APP_NAME:latest" .
    
    # Stop existing container
    docker stop "$APP_NAME" 2>/dev/null || true
    docker rm "$APP_NAME" 2>/dev/null || true
    
    # Run new container with logging
    docker run -d \
        --name "$APP_NAME" \
        --restart unless-stopped \
        -p 5000:5000 \
        -v "$LOG_DIR:/app/logs" \
        -v "$DEPLOYMENT_DIR:/app/data" \
        --env-file "$ENV_FILE" \
        -e LOG_LEVEL=info \
        -e LOG_FORMAT=json \
        -e METRICS_ENABLED=true \
        -e NODE_ENV=production \
        "$APP_NAME:latest"
    
    log "Docker deployment completed"
}

# Deploy with PM2
deploy_pm2() {
    log "Deploying with PM2..."
    
    # Copy built application
    cp -r dist/* "$DEPLOYMENT_DIR/app/"
    cp package*.json "$DEPLOYMENT_DIR/"
    cp ecosystem.config.production.js "$DEPLOYMENT_DIR/"
    
    cd "$DEPLOYMENT_DIR"
    
    # Install production dependencies
    npm ci --only=production
    
    # Start/restart with PM2
    pm2 delete "$APP_NAME" 2>/dev/null || true
    pm2 start ecosystem.config.production.js --env production
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    log "PM2 deployment completed"
}

# Configure monitoring
configure_monitoring() {
    log "Configuring monitoring..."
    
    # Create health check script
    cat > "$DEPLOYMENT_DIR/health-check.sh" << 'EOF'
#!/bin/bash
curl -f http://localhost:5000/api/health || exit 1
EOF
    
    chmod +x "$DEPLOYMENT_DIR/health-check.sh"
    
    # Create monitoring dashboard
    cat > "$DEPLOYMENT_DIR/monitoring-setup.md" << 'EOF'
# Monitoring Setup

## Health Check
- Endpoint: http://localhost:5000/api/health
- Script: ./health-check.sh

## Log Monitoring
- Logs: /var/log/drive-clone/
- Real-time: tail -f /var/log/drive-clone/app.log | jq '.'

## Performance Metrics
- PM2: pm2 monit
- System: htop, iotop

## Error Alerting
- Monitor error rates: grep -c "level.*error" /var/log/drive-clone/app.log
- Set up alerts for high error rates
EOF
    
    log "Monitoring configuration completed"
}

# Run health checks
health_check() {
    log "Running health checks..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        log "Health check passed"
    else
        error "Health check failed - application not responding"
    fi
    
    # Check log files
    if [ -f "$LOG_DIR/app.log" ]; then
        log "Logging is working correctly"
    else
        warn "Log file not found - check logging configuration"
    fi
    
    log "Health checks completed"
}

# Main deployment function
main() {
    log "Starting production deployment..."
    
    check_root
    check_prerequisites
    create_directories
    backup_existing
    install_dependencies
    build_production
    configure_logging
    configure_monitoring
    
    if [ "$USE_DOCKER" = true ]; then
        deploy_docker
    else
        deploy_pm2
    fi
    
    health_check
    
    log "Production deployment completed successfully!"
    log "Application is running at: http://localhost:5000"
    log "Logs are available at: $LOG_DIR"
    log "Use 'pm2 monit' or 'docker logs $APP_NAME' to monitor the application"
}

# Run main function
main "$@"
