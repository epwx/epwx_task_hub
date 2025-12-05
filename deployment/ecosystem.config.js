{
  "apps": [
    {
      "name": "epwx-backend",
      "script": "src/index.js",
      "cwd": "/var/www/epwx-tasks/backend",
      "instances": 2,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 4000
      },
      "error_file": "/var/log/pm2/epwx-backend-error.log",
      "out_file": "/var/log/pm2/epwx-backend-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z"
    },
    {
      "name": "epwx-frontend",
      "script": "npm",
      "args": "start",
      "cwd": "/var/www/epwx-tasks/frontend",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "error_file": "/var/log/pm2/epwx-frontend-error.log",
      "out_file": "/var/log/pm2/epwx-frontend-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
}
