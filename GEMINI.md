# Condition Monitoring App (IAA) — Project AI Memory & Rules

> **CRITICAL INSTRUCTION FOR ANY AI AGENT:** You MUST read this entire file before suggesting or writing any code for this project. This file acts as the persistent project memory across all chats and sessions to prevent hallucinations, strictly enforce the architecture, and ensure safe development.

## 1. Project Goal
Develop a condition monitoring system for test rigs / industrial assets (IAA - Institute of Drive and Automotive Engineering / HS Aalen). The system ingests sensor data (Vibration X/Y, Bearing Temperature, RPM) from a Raspberry Pi 5, stores it in TimescaleDB, applies ML anomaly detection/RUL prognostics, and displays it on a real-time responsive dashboard.

## 2. Architecture & Tech Stack
- **Frontend**: React SPA (`frontend-react/`) using Vite, React 19, Chart.js, and a Vanilla CSS design system. *(Note: The original Vanilla JS prototype was deprecated and removed)*.
- **Backend API**: Python (FastAPI on port 8000).
- **Database**: TimescaleDB (PostgreSQL on port 5432) via Docker.
- **Message Broker**: Eclipse Mosquitto (MQTT on port 1883) via Docker.
- **Gateway**: Python script (`gateway/rpi_publisher.py`) meant for Raspberry Pi 5 to publish local hardware data.
- **ML & Background Tasks**: Celery + Redis (Python) for anomaly detection and RUL prognostics.

## 3. Current Progress Snapshot
- **React Frontend (`frontend-react/`)**: Fully developed SPA. Includes Overview, Real-Time, Historical, ML Models, Alerts, Asset Comparison, Extended Analysis (charts + stats), Test Design (Component & System level), and complete Auth flow (Login, Register with OTP, Forgot Password).
- **Backend Infrastructure**: Docker containers (TimescaleDB, Redis, Mosquitto) are running.
- **Backend API (FastAPI)**: Implemented! Router endpoints exist for telemetry, models, and alerts. `TelemetryHub` WebSocket service is set up in `mqtt_service.py` to stream live MQTT data.

## 4. Current Phase: API Integration
- The next step is to replace the mock data inside the React Frontend with live data.
- **WebSocket:** React must connect to `ws://localhost:8000/api/v1/telemetry/ws` to receive real-time updates.
- **HTTP APIs:** React must fetch historical data from `/api/v1/telemetry/history` and other endpoints instead of hardcoded arrays.

## 5. Safety & Development Rules
- **No Destructive Overwrites**: Do not delete or overwrite existing working React components without explicit intention.
- **Single Source of Truth**: All AI Agents must consult this file and the `PROJECT_PLAN.md` before executing new code to ensure we don't build redundant systems or hallucinate new architectures.
