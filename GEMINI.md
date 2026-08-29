# Condition Monitoring App (IAA) — Project AI Memory & Rules

> **CRITICAL INSTRUCTION FOR ANY AI AGENT:** You MUST read this entire file before suggesting or writing any code for this project. This file acts as the persistent memory to prevent hallucinations, strictly enforce the architecture, and ensure safe development.

## 1. Project Goal
Develop a demonstrable pilot for condition monitoring of a test rig/asset (not a generalized industrial platform). The system must securely ingest high-frequency sensor data (Vibration, Temperature, RPM), store it, run machine learning anomaly detection, and display it on a real-time dashboard.

## 2. Strict Architectural Constraints
- **Frontend (Current)**: **Vanilla JS, HTML, CSS ONLY.** (Stored in `frontend/index.html`). 
  - *FLEXIBILITY RULE*: We are currently using a standalone SPA (Vanilla JS) to avoid complex build tools on the host machine. Do NOT attempt to force a transition to React, Vite, or Node.js without explicit manual approval from the user. 
  - However, if the user explicitly requests to scale up to React/Node.js in the future, you are permitted to assist with that migration. Until then, fiercely protect and build upon the existing `index.html` file.
- **Backend API**: **Python (FastAPI)**.
- **Database**: **TimescaleDB (PostgreSQL)** via Docker.
- **Message Broker**: **Eclipse Mosquitto (MQTT)** via Docker.
- **ML/Background Tasks**: **Celery + Redis** (Python) for anomaly detection, RUL predictions, and health scores.

## 3. Current Progress (As of Milestone 1)
- **Frontend (100% Complete)**: The MVP dashboard (`frontend/index.html`) is fully built and currently uses a javascript simulation engine to generate fake telemetry data at 1Hz, trigger anomaly spikes, and simulate the ML/AI UI.
- **MQTT Broker (Configured)**: `mosquitto/mosquitto.conf` is configured for anonymous local connections and WebSockets.
- **Git**: Repository is initialized and connected to remote origin.

## 4. Next Immediate Steps (Phase 2)
The next phase is strictly Backend & Data Engineering:
1. Boot up the `docker-compose.yml` stack (TimescaleDB, Mosquitto, Redis).
2. Create the TimescaleDB database schema for storing sensors, assets, and measurements.
3. Write the FastAPI routes (`backend/app/api/`) to ingest data from Mosquitto and serve historical data to the frontend.
4. Replace the javascript simulation in the frontend with real `fetch()` calls and WebSockets connected to the FastAPI backend.

## 5. Safety & Development Rules
- **No Hallucinations**: Do not assume external APIs or complex cloud services are available unless explicitly requested.
- **No Destructive Changes**: Do not delete or overwrite the working `frontend/index.html` without explicit user permission. It contains thousands of lines of critical UI code.
- **Execution Environment**: Always assume the user prefers to run background tasks natively via Python or via the provided `docker-compose.yml`.

## 6. How to Run (Currently)
- **Frontend**: Simply open `frontend/index.html` in a web browser (e.g., via macOS `open frontend/index.html` or a python local server).
- **Backend**: (Pending) Will be run via `docker-compose up -d`.
