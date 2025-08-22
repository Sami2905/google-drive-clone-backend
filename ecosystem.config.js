module.exports = {
  apps: [
    {
      name: 'google-drive-backend',
      script: 'dist/index.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoring
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Memory and CPU limits
      max_memory_restart: '1G',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health check
      health_check_grace_period: 3000,
      
      // Environment variables
      env_file: '.env',
      
      // Watch mode (development only)
      watch: process.env.NODE_ENV === 'development' ? ['src'] : false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      
      // Source map support
      source_map_support: true,
      
      // Node options
      node_args: '--max-old-space-size=1024',
    },
  ],
  
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/google-drive-clone.git',
      path: '/var/www/google-drive-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
