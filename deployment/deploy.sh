#!/bin/bash

# EPWX Task Platform Deployment Script
# Usage: ./deploy.sh

set -e

APP_ROOT="$(pwd)"
FRONTEND_DIR="$APP_ROOT/frontend"
MAINTENANCE_FLAG="$FRONTEND_DIR/.maintenance"
NGINX_SOURCE_CONFIG="$APP_ROOT/deployment/nginx.conf"
NGINX_TARGET_CONFIG="/etc/nginx/sites-available/epwx-tasks"

enable_maintenance_mode() {
	touch "$MAINTENANCE_FLAG"
	echo "🛠️  Maintenance mode enabled"
}

disable_maintenance_mode() {
	rm -f "$MAINTENANCE_FLAG"
	echo "✅ Maintenance mode disabled"
}

sync_nginx_config() {
	if [ ! -f "$NGINX_SOURCE_CONFIG" ]; then
		echo "⚠️  Skipping Nginx sync because $NGINX_SOURCE_CONFIG was not found"
		return
	fi

	cp "$NGINX_SOURCE_CONFIG" "$NGINX_TARGET_CONFIG"
	nginx -t
	systemctl reload nginx
	echo "🌐 Nginx config reloaded"
}

handle_deploy_exit() {
	exit_code=$?

	if [ $exit_code -ne 0 ]; then
		echo "❌ Deployment failed. Maintenance mode is still enabled."
		exit $exit_code
	fi
}

trap handle_deploy_exit EXIT

echo "🚀 Deploying EPWX Task Platform..."

# Pull latest code
echo "📥 Pulling latest code from repository..."
git pull origin main

echo "🌐 Syncing Nginx configuration..."
sync_nginx_config

enable_maintenance_mode

# Install dependencies
echo "📦 Installing dependencies..."

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
npm run build
cd ..

# Restart services with PM2
echo "🔄 Restarting services..."

# Stop existing processes
pm2 delete epwx-backend || true
pm2 delete epwx-frontend || true

# Start backend
cd backend
pm2 start src/index.js --name epwx-backend
cd ..

# Start frontend
cd frontend
pm2 start npm --name epwx-frontend -- start
cd ..

# Save PM2 configuration
pm2 save

disable_maintenance_mode
trap - EXIT

echo "✅ Deployment complete!"
echo "Backend: http://localhost:4000"
echo "Frontend: http://localhost:3000"
