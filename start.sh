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
echo "[1/4] 🐳 Ensuring Docker Desktop is running..."
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed or not in PATH. Please install Docker."
else
    # Auto-launch Docker Desktop on macOS if not running
    if ! docker info &> /dev/null; then
        echo "⏳ Docker Desktop is closed. Launching Docker application..."
        open -a Docker 2>/dev/null || open -a "Docker Desktop" 2>/dev/null
        echo -n "Waiting for Docker daemon to become ready"
        while ! docker info &> /dev/null; do
            echo -n "."
            sleep 2
        done
        echo ""
        echo "✅ Docker daemon is ready!"
    fi
    docker compose up -d
    # Wait briefly for Mosquitto port 1883 to accept connections
    while ! nc -z localhost 1883 &> /dev/null; do
        sleep 1
    done
fi

# 2. Function to clean up background processes on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Stopping FastAPI Backend, Vite Frontend, and BLE Gateway..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill $GATEWAY_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Start Backend (FastAPI on Port 8000)
echo ""
echo "[2/4] ⚙️  Starting FastAPI Backend (http://localhost:8000)..."
(cd backend && ../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

# 4. Start Frontend (React + Vite on Port 5173)
echo ""
echo "[3/4] 💻 Starting React Frontend (http://localhost:5173)..."
(cd frontend-react && npm run dev -- --host) &
FRONTEND_PID=$!

# 5. Start Wireless BLE Ingestion Daemon
echo ""
echo "[4/4] 📡 Starting Bluetooth LE Gateway Ingestion..."
.venv/bin/python3 gateway/rpi_publisher.py --mode ble &
GATEWAY_PID=$!

echo ""
echo "=================================================="
echo "✅ All systems are running!"
echo "🌐 React Dashboard: http://localhost:5173"
echo "📖 Swagger API Docs: http://localhost:8000/docs"
echo "🛑 Press Ctrl+C in this terminal to stop the web app."
echo "=================================================="

# Keep the script running to stream logs
wait
