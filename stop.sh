#!/usr/bin/env bash

# ==============================================================================
# Condition Monitoring App (IAA) — Stop All Services Script
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "🛑 Stopping all IAA Condition Monitoring services..."

# 1. Kill any processes on port 8000 (FastAPI) and 5173 (Vite)
echo "Stopping web servers..."
lsof -ti :8000 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

# 2. Stop Docker containers
echo "Stopping Docker containers..."
docker compose stop

echo "✅ All services (Backend, Frontend, Docker) have been stopped cleanly."
