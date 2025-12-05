#!/bin/bash

# Initial Server Setup Script for Ubuntu
# Run this once on a fresh Digital Ocean droplet

set -e

echo "🔧 Setting up EPWX Task Platform server..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install nginx -y

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y

# Install Redis
echo "📦 Installing Redis..."
sudo apt install redis-server -y

# Install Certbot for SSL
echo "📦 Installing Certbot..."
sudo apt install certbot python3-certbot-nginx -y

# Setup PostgreSQL database
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE epwx_tasks;"
sudo -u postgres psql -c "CREATE USER epwx_user WITH PASSWORD 'CHANGE_THIS_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE epwx_tasks TO epwx_user;"

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Clone repository
echo "📥 Cloning repository..."
cd /var/www
sudo git clone https://github.com/epwx/epwx_task_hub.git epwx-tasks
sudo chown -R $USER:$USER epwx-tasks

# Setup Nginx
echo "🌐 Setting up Nginx..."
sudo cp epwx-tasks/deployment/nginx.conf /etc/nginx/sites-available/epwx-tasks
sudo ln -sf /etc/nginx/sites-available/epwx-tasks /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL (run after DNS is configured)
echo "🔐 To setup SSL certificates, run:"
echo "sudo certbot --nginx -d tasks.epowex.com -d www.tasks.epowex.com -d api.epowex.com"

# Setup PM2 startup
pm2 startup
pm2 save

echo "✅ Server setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env files in backend and frontend"
echo "2. Configure DNS A records to point to this server"
echo "3. Run SSL setup command above"
echo "4. Deploy the application using ./deployment/deploy.sh"
