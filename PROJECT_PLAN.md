# Condition Monitoring App (IAA) — Master Project Plan & Roadmap

## Phase 1: Frontend Development (Completed)
- [x] Build initial UI prototype and evaluate dashboard layout.
- [x] Set up React SPA structure (`frontend-react/`) with Vite and React 19.
- [x] Implement all operational views:
  - Overview (KPI sparklines, main trend chart, active alerts, sensor status table).
  - Real-Time Monitoring (Dial gauges, 1 Hz multi-channel feed, FFT frequency spectrum).
  - Historical Trends (1D, 7D, 30D rolling telemetry from FastAPI).
  - ML Models & Predictions (Live anomaly score, RUL prognosis, fault matrix).
  - Alerts & Incidents (Severity filtering and alert acknowledgment).
  - Asset Comparison & Extended Statistical Analysis (Mean, min, max, std dev).
  - Test Design (Custom component configuration and system load profiling).
  - Authentication (Login, Register, Forgot Password with persistent session).
- [x] Establish custom Vanilla CSS design system (Dark mode, glassmorphism, responsive).

## Phase 2: Backend Infrastructure & API (Completed)
- [x] Deploy Mosquitto MQTT Broker (port 1883) via Docker.
- [x] Deploy TimescaleDB / PostgreSQL (port 5432) and Redis (port 6379) via Docker.
- [x] Build FastAPI Backend (`backend/app/main.py`) with telemetry and equipment routers.
- [x] Implement WebSocket `TelemetryHub` in FastAPI for real-time bi-directional streaming.
- [x] Implement PostgreSQL database models with Argon2 password hashing for admin/user roles.

## Phase 3: Hardware Ingestion & Direct USB Streaming (Completed)
- [x] **C/C++ Firmware Sketch**: Authored `firmware/xiao_condition_node/xiao_condition_node.ino` with 5-minute deep sleep timer and 10-second burst acquisition (vibration, temp, battery level).
- [x] **Flashing & Verification**: Compiled and flashed sketch to Seeed Studio XIAO microcontroller. The program is stored in non-volatile flash memory and runs immediately upon USB connection without re-flashing.
- [x] **Gateway USB Serial Ingestion**: Created `gateway/rpi_publisher.py` with auto-reconnecting serial reader (`pyserial`) supporting macOS (`/dev/cu.usbmodem*`) and Linux (`/dev/ttyACM*`).
- [x] **End-to-End Live Verification**: Verified live streaming from Seeed Studio XIAO $\rightarrow$ USB Serial $\rightarrow$ `rpi_publisher.py` $\rightarrow$ Mosquitto MQTT $\rightarrow$ FastAPI WebSocket $\rightarrow$ React SPA dashboard.

## Phase 4: Telemetry Stabilization & Custom Asset Persistence (Completed)
- [x] **Glitch Resolution**: Pre-seeded rolling buffers with 20 baseline points to eliminate blank sparklines and chart dropouts.
- [x] **Hardware Heartbeat Watchdog**: Dashboard dynamically displays `Live WS (RPi 5)` when live packets stream and `Hardware Offline` when the microcontroller is unplugged.
- [x] **Custom Asset Persistence**: Custom test designs created in `Test Design` persist in `localStorage` across reloads and execute virtual telemetry simulations with their configured baseline parameters.
- [x] **Code Cleanliness**: Pruned all mock machine profiles down to the single active test rig (`test-rig-a`).

---

## Phase 5: Physical Raspberry Pi 5 Gateway Deployment (Next Milestone)
*Goal: Move gateway from development Mac to the physical Raspberry Pi 5 mounted on the test rig.*
- [ ] Transfer `gateway/rpi_publisher.py` and its dependencies to the Raspberry Pi 5 OS (Debian Bookworm).
- [ ] Connect the Seeed Studio XIAO sensor node to the Raspberry Pi 5 via USB-C.
- [ ] Configure `rpi_publisher.py` as a `systemd` daemon (`condition-monitor-gateway.service`) for auto-start on boot.
- [ ] Configure network routing so the Raspberry Pi 5 publishes MQTT telemetry over Wi-Fi/Ethernet to the backend server.
- [ ] Test wireless/remote streaming from Raspberry Pi 5 to the centralized dashboard.

## Phase 6: Machine Learning Pipeline & Background Processing
*Goal: Transition from baseline anomaly rules to automated ML inference on live telemetry batches.*
- [ ] Configure Celery background workers connected to Redis task broker.
- [ ] Implement inference worker for LSTM Autoencoder (unsupervised reconstruction error anomaly detection).
- [ ] Implement XGBoost classifier for multi-fault identification (Bearing Defect, Misalignment, Imbalance, Looseness).
- [ ] Compute Remaining Useful Life (RUL) estimation curve based on degradation trajectory.
- [ ] Stream ML predictions and trigger automated alerts in TimescaleDB and the React UI.

## Phase 7: Production Cloud / On-Premises Deployment
*Goal: Package and deploy the application for multi-user access across HS Aalen.*
- [ ] Dockerize the React SPA (Nginx multi-stage build) or deploy to Vercel/Cloudflare Pages edge.
- [ ] Containerize full backend stack with production Docker Compose (FastAPI, Mosquitto, TimescaleDB, Redis, Celery).
- [ ] Configure reverse proxy (Nginx or Caddy) with TLS/SSL encryption for HTTPS and WSS.
- [ ] Handover documentation, user manual, and operational guides for researchers and operators.
