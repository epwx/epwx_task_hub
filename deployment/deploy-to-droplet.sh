#!/bin/bash
set -e

echo "🚀 EPWX Task Platform - Droplet Deployment Script"
echo "=================================================="
echo ""

# Configuration
REPO_URL="https://github.com/epwx/epwx_task_hub.git"
APP_DIR="/home/deployer/epwx_task_hub"
FRONTEND_PORT=3000
BACKEND_PORT=4000

echo "📦 Step 1: Installing dependencies..."
sudo apt-get update
sudo apt-get install -y nginx postgresql postgresql-contrib redis-server git curl

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

echo "📥 Step 2: Cloning repository..."
if [ -d "$APP_DIR" ]; then
    echo "Repository already exists, pulling latest changes..."
    cd $APP_DIR
    git pull origin main
else
    echo "Cloning repository..."
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

echo "🔧 Step 3: Setting up Backend..."
cd $APP_DIR/backend
npm install

# Create backend .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit backend/.env with your settings:"
    echo "   - DATABASE_URL"
    echo "   - VERIFIER_PRIVATE_KEY"
    echo "   - TASK_MANAGER_CONTRACT (already set: 0x792896b951380eBC7E52f370Ec6208c5D260A210)"
fi

echo "🔧 Step 4: Setting up Frontend..."
cd $APP_DIR/frontend
npm install

# Create frontend .env.local if not exists
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    # Update with production URLs
    sed -i 's|http://localhost:4000|https://api.epowex.com|g' .env.local
    sed -i 's|http://localhost:3000|https://tasks.epowex.com|g' .env.local
    echo "✅ Frontend .env.local created with production URLs"
fi

# Build frontend for production
echo "🏗️  Building frontend..."
npm run build

echo "🗄️  Step 5: Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE epwx_tasks;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER epwx WITH PASSWORD 'change_this_password';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE epwx_tasks TO epwx;" 2>/dev/null || true

echo "🌐 Step 6: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/epwx-tasks << 'NGINX_EOF'
# Frontend - tasks.epowex.com
server {
    listen 80;
    server_name tasks.epowex.com;

    location /_next/static/ {
        alias /home/deployer/epwx_task_hub/frontend/.next/static/;
        access_log off;
        expires 1h;
    }

    location = /maintenance.html {
        root /home/deployer/epwx_task_hub/frontend/public;
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    }

    location = /favicon.ico {
        root /home/deployer/epwx_task_hub/frontend/public;
        access_log off;
    }

    location = /logo.webp {
        root /home/deployer/epwx_task_hub/frontend/public;
        access_log off;
    }

    error_page 502 503 504 @frontend_maintenance;

    location @frontend_maintenance {
        root /home/deployer/epwx_task_hub/frontend/public;
        try_files /maintenance.html =503;
    }

    location / {
        if (-f /home/deployer/epwx_task_hub/frontend/.maintenance) {
            return 503;
        }

        proxy_intercept_errors on;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API - api.epowex.com
server {
    listen 80;
    server_name api.epowex.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    }
}
NGINX_EOF

sudo ln -sf /etc/nginx/sites-available/epwx-tasks /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "🚀 Step 7: Starting applications with PM2..."
cd $APP_DIR

# Start backend
pm2 start backend/src/index.js --name epwx-api --cwd $APP_DIR/backend

# Start frontend
cd frontend
pm2 start npm --name epwx-frontend -- start

# Save PM2 configuration
pm2 save
pm2 startup | tail -n 1 | sudo bash

echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure DNS A records:"
echo "   tasks.epowex.com  →  YOUR_DROPLET_IP"
echo "   api.epowex.com    →  YOUR_DROPLET_IP"
echo ""
echo "2. Edit configuration files:"
echo "   nano $APP_DIR/backend/.env"
echo "   - Set DATABASE_URL=postgresql://epwx:change_this_password@localhost:5432/epwx_tasks"
echo "   - Set VERIFIER_PRIVATE_KEY=0x..."
echo "   - Set JWT_SECRET=random_secret_here"
echo "   - Add Twitter API keys (optional for now)"
echo ""
echo "3. Install SSL certificates:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d tasks.epowex.com -d api.epowex.com"
echo ""
echo "4. Restart apps after config changes:"
echo "   pm2 restart epwx-api"
echo "   pm2 restart epwx-frontend"
echo ""
echo "5. Check status:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "Access your apps:"
echo "  Frontend: http://tasks.epowex.com"
echo "  Backend:  http://api.epowex.com"
echo ""
