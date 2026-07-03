#!/bin/bash

# EPWX Task Platform Deployment Script
# Usage: ./deploy.sh

set -e

APP_ROOT="$(pwd)"
FRONTEND_DIR="$APP_ROOT/frontend"
MAINTENANCE_FLAG="$FRONTEND_DIR/.maintenance"
NGINX_SOURCE_CONFIG="$APP_ROOT/deployment/nginx.conf"
NGINX_TARGET_CONFIG="/etc/nginx/sites-available/epwx-tasks"
FRONTEND_HEALTHCHECK_URL="http://127.0.0.1:3000/"
POST_DEPLOY_SMOKE_REPO="${POST_DEPLOY_SMOKE_REPO:-epwx/epwx_task_hub}"
POST_DEPLOY_SMOKE_EVENT="${POST_DEPLOY_SMOKE_EVENT:-post-deploy-smoke}"
POST_DEPLOY_SMOKE_FRONTEND_URL="${POST_DEPLOY_SMOKE_FRONTEND_URL:-https://tasks.epowex.com}"
POST_DEPLOY_SMOKE_API_BASE_URL="${POST_DEPLOY_SMOKE_API_BASE_URL:-https://api.epowex.com}"

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

	sed "s|__APP_ROOT__|$APP_ROOT|g" "$NGINX_SOURCE_CONFIG" > "$NGINX_TARGET_CONFIG"
	nginx -t
	systemctl reload nginx
	echo "🌐 Nginx config reloaded"
}

wait_for_frontend_ready() {
	echo "⏳ Waiting for frontend to become ready..."

	for attempt in $(seq 1 60); do
		response=$(curl -fsS "$FRONTEND_HEALTHCHECK_URL" || true)

		if [ -n "$response" ] && [[ "$response" != *"Warmup Page"* ]] && [[ "$response" != *"<body></body>"* ]]; then
			echo "✅ Frontend is ready"
			return 0
		fi

		sleep 2
	done

	echo "❌ Frontend did not become ready in time"
	return 1
}

trigger_post_deploy_smoke() {
	if [ -z "$GITHUB_TOKEN" ]; then
		echo "⚠️  Skipping post-deploy smoke trigger (GITHUB_TOKEN not set)"
		return 0
	fi

	echo "🧪 Triggering post-deploy smoke workflow..."

	payload=$(cat <<EOF
{
  "event_type": "$POST_DEPLOY_SMOKE_EVENT",
  "client_payload": {
    "frontend_url": "$POST_DEPLOY_SMOKE_FRONTEND_URL",
    "api_base_url": "$POST_DEPLOY_SMOKE_API_BASE_URL"
  }
}
EOF
)

	response_code=$(curl -sS -o /tmp/epwx_smoke_dispatch_response.txt -w "%{http_code}" \
		-X POST "https://api.github.com/repos/$POST_DEPLOY_SMOKE_REPO/dispatches" \
		-H "Accept: application/vnd.github+json" \
		-H "Authorization: Bearer $GITHUB_TOKEN" \
		-H "X-GitHub-Api-Version: 2022-11-28" \
		-d "$payload" || true)

	if [ "$response_code" = "204" ]; then
		echo "✅ Post-deploy smoke workflow triggered"
		return 0
	fi

	echo "⚠️  Failed to trigger post-deploy smoke workflow (HTTP $response_code)"
	if [ -f /tmp/epwx_smoke_dispatch_response.txt ]; then
		echo "GitHub response: $(cat /tmp/epwx_smoke_dispatch_response.txt)"
	fi

	return 0
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

wait_for_frontend_ready

disable_maintenance_mode
trigger_post_deploy_smoke
trap - EXIT

echo "✅ Deployment complete!"
echo "Backend: http://localhost:4000"
echo "Frontend: http://localhost:3000"
