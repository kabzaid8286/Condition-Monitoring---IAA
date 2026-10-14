#!/usr/bin/env bash

# ==============================================================================
# Condition Monitoring App (IAA) — All-in-One Startup Script
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=================================================="
echo "🚀 Starting IAA Condition Monitoring System"
echo "=================================================="

# 1. Start Docker Containers (TimescaleDB, Mosquitto MQTT, Redis)
echo ""
echo "[1/3] 🐳 Ensuring Docker containers are running..."
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed or not in PATH. Please start Docker Desktop."
else
    docker compose up -d
fi

# 2. Function to clean up background processes on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Stopping FastAPI Backend and Vite Frontend..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Start Backend (FastAPI on Port 8000)
echo ""
echo "[2/3] ⚙️  Starting FastAPI Backend (http://localhost:8000)..."
(cd backend && ../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

# 4. Start Frontend (React + Vite on Port 5173)
echo ""
echo "[3/3] 💻 Starting React Frontend (http://localhost:5173)..."
(cd frontend-react && npm run dev -- --host) &
FRONTEND_PID=$!

echo ""
echo "=================================================="
echo "✅ All systems are running!"
echo "🌐 React Dashboard: http://localhost:5173"
echo "📖 Swagger API Docs: http://localhost:8000/docs"
echo "🛑 Press Ctrl+C in this terminal to stop the web app."
echo "=================================================="

# Keep the script running to stream logs
wait
