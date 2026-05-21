module.exports = {
  apps: [
     {
      name: "epwx-api",
      script: "npm",
      args: "start",
      cwd: "/mnt/volume1_nyc3_1778885684099/epwx_task_hub/backend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      },
      error_file: "/home/deployer/.pm2/logs/epwx-api-error.log",
      out_file: "/home/deployer/.pm2/logs/epwx-api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    },
    {
      name: "epwx-frontend",
      script: "npm",
      args: "start",
      cwd: "/mnt/volume1_nyc3_1778885684099/epwx_task_hub/frontend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "/home/deployer/.pm2/logs/epwx-frontend-error.log",
      out_file: "/home/deployer/.pm2/logs/epwx-frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    },
    {
      name: "epwx-telegram-bot",
      script: "npm",
      args: "start",
      cwd: "/mnt/volume1_nyc3_1778885684099/epwx_task_hub/backend",
      instances: 1,
      exec_mode: "fork",
      env: {
        // Add any required environment variables here
      },
      error_file: "/home/deployer/.pm2/logs/epwx-telegram-bot-error.log",
      out_file: "/home/deployer/.pm2/logs/epwx-telegram-bot-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
   
    ]
  };
