#!/bin/bash

echo "🚀 Starting EPWX Task Hub - Local Development"
echo "=============================================="
echo ""

# Start Backend
echo "📡 Starting Backend API on port 4000..."
cd /workspaces/epwx_task_hub/backend
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo "🌐 Starting Frontend on port 3000..."
cd /workspaces/epwx_task_hub/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting!"
echo ""
echo "Backend API:  http://localhost:4000"
echo "Frontend App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
