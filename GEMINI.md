# Condition Monitoring App (IAA) — Project AI Memory & Rules

> **CRITICAL INSTRUCTION FOR ANY AI AGENT:** You MUST read this entire file before suggesting or writing any code for this project. This file acts as the persistent project memory across all chats and sessions to prevent hallucinations, strictly enforce the architecture, and ensure safe development.

## 1. Project Goal
Develop a complete industrial condition monitoring system for test rigs and rotational assets (IAA - Institute of Drive and Automotive Engineering / HS Aalen). The system ingests sensor data (Dual-axis Vibration X/Y, Bearing Temperature, Shaft RPM, Battery Level) from a custom battery-powered Seeed Studio XIAO sensor node, transmits through a Raspberry Pi 5 gateway over MQTT, stores time-series data in TimescaleDB, applies machine learning anomaly detection and RUL prognostics, and presents live telemetry on a high-performance React dashboard.

## 2. Architecture & Tech Stack
- **Hardware / Sensor Node**: Custom carrier board with a Seeed Studio XIAO microcontroller powered by dual coin-cell batteries, connected to MEMS vibration sensors and an industrial temperature probe. Runs C/C++ firmware (`firmware/xiao_condition_node/xiao_condition_node.ino`) operating on a low-power duty cycle (10-second burst acquisition every 5 minutes, followed by Deep Sleep).
- **Gateway**: Python daemon (`gateway/rpi_publisher.py`) reading USB serial telemetry from the Seeed Studio XIAO and publishing JSON/CSV payloads over MQTT (`sensors/test-rig-a/telemetry`).
- **Message Broker**: Eclipse Mosquitto (MQTT on port 1883) via Docker.
- **Backend API**: Python FastAPI (port 8000) running `TelemetryHub` (bridges incoming MQTT messages directly to connected WebSocket clients at `/api/v1/telemetry/ws` and exposes snapshot/historical endpoints).
- **Database**: TimescaleDB / PostgreSQL (port 5432) via Docker for persistent sensor readings, equipment profiles, and Argon2 user authentication.
- **Frontend SPA**: React 19 (`frontend-react/`) powered by Vite, Chart.js, Lucide icons, and a custom Vanilla CSS design system (Dark mode, glassmorphism, responsive).
- **ML & Background Tasks**: Celery + Redis (Python) for anomaly detection and RUL prognostics.

## 3. Completed Milestones
- **Phase 1: Architecture & Infrastructure (Completed)**: Mosquitto, TimescaleDB, Redis, and FastAPI core deployed in Docker.
- **Phase 2: React SPA Dashboard (Completed)**: Built views for Overview, Real-Time Gauges/FFT, Historical Trends, ML Predictions, Alerts, Asset Comparison, Extended Analysis, and Test Design.
- **Phase 3: Firmware & Direct Mac USB Streaming (Completed)**:
  - C/C++ sketch compiled and flashed onto Seeed Studio XIAO.
  - Flash memory retains code permanently. Connecting the board via USB immediately starts data acquisition without re-flashing.
  - USB serial reader with auto-reconnection and heartbeat detection in `gateway/rpi_publisher.py`.
- **Phase 4: Telemetry Stabilization & Custom Asset Persistence (Completed)**:
  - Rolling history pre-seeding (20 points) eliminates blank sparklines and chart glitches.
  - Hardware heartbeat detection dynamically displays `Live WS (RPi 5)` when streaming vs `Hardware Offline` when unplugged.
  - Custom test designs created in `Test Design` persist in `localStorage`, activate automatically, and run realistic virtual simulations (`Virtual Simulation` mode).
  - Cleaned all mock assets down to the active physical machine (`test-rig-a`).

## 4. Current Phase & Next Milestones
- **Phase 5: Physical Raspberry Pi 5 Gateway Deployment (Current)**:
  - Deploy `gateway/rpi_publisher.py` to the physical Raspberry Pi 5 mounted on the test rig.
  - Connect the Seeed Studio XIAO via USB to the Raspberry Pi 5.
  - Configure `rpi_publisher.py` as a systemd service for automatic reboot recovery and headless execution.
  - Route MQTT traffic across the local LAN / Wi-Fi to the central server/broker.
- **Phase 6: Machine Learning Pipeline (Celery + Redis)**:
  - Implement rolling-window anomaly scoring with LSTM Autoencoders and XGBoost.
  - Wire ML inference results into TimescaleDB and live WebSocket broadcasts.
- **Phase 7: Cloud / Production Deployment**:
  - Deploy frontend to Vercel/Cloudflare edge.
  - Containerize backend stack for cloud hosting.

## 5. Development & Safety Rules
- **Microcontroller Flash Permanence**: The Seeed Studio XIAO already has the active sketch flashed in its non-volatile memory. Do NOT ask the user to re-flash or re-verify unless firmware changes are explicitly required. Simply plugging in the USB cable starts telemetry.
- **Single Source of Truth**: All AI Agents must consult this file and `PROJECT_PLAN.md` before writing code to prevent hallucinations, redundant systems, or ghost assets.
- **No Destructive Overwrites**: Preserve existing working React components, Vanilla CSS design tokens, and authentication states.
- **Industrial Design Standard**: Clean, professional UI. No emojis before headings.
