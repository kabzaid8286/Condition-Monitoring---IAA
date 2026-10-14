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

## Phase 3: Hardware Ingestion Pipeline & System Readiness (Current Phase)
*Goal: Complete all backend, gateway, firmware sketch, and dashboard wiring so the platform is 100% ready the moment the microcontroller is plugged in.*
- [x] Connect React `useSensorData` hook to FastAPI WebSockets.
- [x] Implement robust reconnection logic for WebSockets in React (auto-fallback to local simulation when disconnected).
- [x] Verify End-to-End flow with `rpi_publisher.py` publishing over MQTT to FastAPI WebSocket broadcast.
- [x] **Gateway USB Serial Ingestion**: Upgraded `gateway/rpi_publisher.py` with plug-and-play USB Serial reader (`pyserial`) supporting macOS (`/dev/cu.usbmodem*`) and Linux (`/dev/ttyACM*`) to read incoming Seeed Studio XIAO data and publish to MQTT.
- [x] **C/C++ Firmware Sketch**: Created the ready-to-flash Arduino sketch (`firmware/xiao_condition_node/xiao_condition_node.ino`) with 5-minute deep sleep timer and 10-second burst acquisition (vibration, temp, battery level).
- [x] **Burst Telemetry & Battery UI**: Added battery percentage badge (`🔋 98%`) and low-power deep sleep status (`💤 Deep Sleep`) to the React header and dashboard.
- [ ] **Historical Telemetry API**: Replace hardcoded historical data in React with Axios API calls to `/api/v1/telemetry/history` backed by TimescaleDB.
- [ ] **Authentication**: Wire `LoginPage.jsx` & `RegisterPage.jsx` to FastAPI `/api/v1/auth/` and PostgreSQL `users` table.

## Phase 4: Microcontroller Plug-in, Flashing & Live Rig Streaming (Next Milestone)
*Goal: Connect the physical Seeed Studio XIAO board to Mac, flash the C code, and stream real sensor data.*
- [ ] Plug Seeed Studio XIAO board into Mac via USB-C cable.
- [ ] Compile and flash `firmware/xiao_condition_node/xiao_condition_node.ino` using Arduino IDE.
- [ ] Run `python gateway/rpi_publisher.py --serial` on Mac to ingest real sensor telemetry over USB and verify live dashboard streaming.

## Phase 5: Machine Learning & Analytics (Upcoming)
- [ ] Set up Celery background workers.
- [ ] Integrate actual ML models (LSTM, Random Forest) for anomaly detection on incoming MQTT data.
- [ ] Plumb ML anomaly scores through WebSockets to the React frontend.

## Phase 6: Physical Deployment to Raspberry Pi 5 & Cloud Hosting (Upcoming)
- [ ] Move `rpi_publisher.py` to physical Raspberry Pi 5 on the test rig.
- [ ] Deploy Frontend (React/Vite) for FREE on Vercel or Cloudflare Pages.
- [ ] Deploy Backend (FastAPI, PostgreSQL, MQTT) on cheap/free tier cloud infrastructure.
