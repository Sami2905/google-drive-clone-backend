module.exports = {
  apps: [
    {
      name: 'google-drive-clone-api',
      script: 'dist/supabase-server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Production optimizations
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Health checks
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Monitoring
      pmx: true,
      monitor: true,
      
      // Security
      uid: 'www-data',
      gid: 'www-data',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/google-drive-clone.git',
      path: '/var/www/google-drive-clone',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.production.js --env production',
      'pre-setup': '',
    },
  },
};
