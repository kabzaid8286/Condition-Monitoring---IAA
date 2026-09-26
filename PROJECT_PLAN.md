# Project Plan & Roadmap

## Phase 1: Frontend Development (Completed)
- [x] Build Vanilla JS Prototype (`frontend/index.html`)
- [x] Set up React SPA structure (`frontend-react/`)
- [x] Migrate all views (Overview, Live Telemetry, Historical, ML Models, AI Assistant, Alerts, Comparison)
- [x] Establish Design System (Vanilla CSS, Glassmorphism)

## Phase 2: Backend & Infrastructure Setup (Completed)
- [x] Deploy Mosquitto MQTT Broker (Docker)
- [x] Deploy TimescaleDB & Redis (Docker)
- [x] Initialize FastAPI Backend (`backend/app/main.py`)
- [x] Create Python publisher script for Raspberry Pi 5 (`gateway/rpi_publisher.py`)
- [x] Implement WebSocket `TelemetryHub` in FastAPI for real-time streaming

## Phase 3: API Integration & Authentication (Current Phase)
- [ ] Connect React `useSensorData` hook to FastAPI WebSockets.
- [ ] Replace hardcoded historical data in React with Axios API calls to `/api/v1/telemetry/history`.
- [ ] Verify End-to-End flow by running `rpi_publisher.py` locally and watching React charts update automatically.
- [ ] Implement robust reconnection logic for WebSockets in React.
- [ ] **Authentication**: Update `LoginPage.jsx` to support real User/Admin custom ID and password login.
- [ ] **Authentication**: Create PostgreSQL `users` table schema and FastAPI endpoints for login/session generation.

## Phase 4: Machine Learning & Analytics (Upcoming)
- [ ] Set up Celery background workers.
- [ ] Integrate actual ML models (LSTM, Random Forest) for anomaly detection on incoming MQTT data.
- [ ] Plumb ML anomaly scores through WebSockets to the React frontend.

## Phase 5: Hardware Deployment (Upcoming)
- [ ] Move `rpi_publisher.py` to physical Raspberry Pi 5.
- [ ] Wire physical vibration (accelerometer) and temperature sensors.
- [ ] Verify cloud/network connection to the backend.

## Phase 6: Cloud Hosting & Production Deployment (Upcoming)
- [ ] Find and setup a custom Domain (e.g., cheap domain via Namecheap/Cloudflare).
- [ ] Deploy Frontend (React/Vite) for FREE on Vercel, Netlify, or Cloudflare Pages.
- [ ] Deploy Backend (FastAPI, PostgreSQL, MQTT) on cheap/free tier cloud infrastructure (e.g., Render, Railway, or a $5/month Hetzner/DigitalOcean VPS for hosting the entire Docker compose stack).
