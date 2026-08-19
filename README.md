# IAA Condition Monitoring App

A full-stack application for industrial condition monitoring, featuring real-time telemetry, equipment management, and predictive maintenance capabilities.

## Architecture

- **Backend**: FastAPI with async SQLAlchemy
- **Database**: TimescaleDB (PostgreSQL) for time-series data
- **Caching/Queue**: Redis
- **Message Broker**: Eclipse Mosquitto (MQTT/WebSockets)
- **Frontend**: React + TypeScript + Vite (to be implemented)

## Getting Started

### 1. Infrastructure Setup

```bash
# Copy environment file
cp .env.example .env

# Start infrastructure (Database, Redis, MQTT)
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations (once configured)
# alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000
```

### API Documentation
Once the backend is running, access the interactive API docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
