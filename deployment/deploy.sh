#!/bin/bash

# EPWX Task Platform Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Deploying EPWX Task Platform..."

# Pull latest code
echo "📥 Pulling latest code from repository..."
git pull origin main

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

echo "✅ Deployment complete!"
echo "Backend: http://localhost:4000"
echo "Frontend: http://localhost:3000"
