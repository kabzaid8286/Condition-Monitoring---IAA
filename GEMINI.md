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
- **Phase 4: Telemetry Stabilization & Multi-Sensor Hardware Auto-Detection (Completed)**:
  - Rolling history pre-seeding (20 points) eliminates blank sparklines and chart glitches.
  - Hardware heartbeat detection dynamically displays `Live WS (RPi 5)` when streaming vs `Hardware Offline` when unplugged.
  - Multi-Sensor Silicon Auto-Detection: XIAO firmware reads native silicon hardware chip ID (`xiao_nrf54l15::Ficr::deviceId()`), allowing identical twin boards (`xiao-xxxx`) to connect and stream concurrently without collisions.
  - Synchronous Zero/Null Render Isolation: Switching dropdown to any offline machine immediately renders pure 0/null values without transient 1-second glitches.
  - Custom test designs created in `Test Design` persist in `localStorage`, activate automatically, and support live sensor renaming.
- **Phase 5: Wireless Bluetooth (BLE) & Multi-Node Concurrent Streaming (Completed)**:
  - Dual-mode firmware (BLE + USB Serial): Transmits telemetry wirelessly over Nordic UART Service (NUS) using atomic single-chunk buffers and Apple/Linux compliant intervals.
  - Microcontroller Flash Permanence: Sketch runs permanently from flash memory; coin-cell battery power enables 100% cable-free transmission.
  - Multi-Node BLE Ingestion Daemon: `gateway/rpi_publisher.py` concurrently discovers, connects to, and streams from multiple Seeed Studio XIAO sensor nodes (`IAA-*`) simultaneously using asynchronous client pooling.
  - Verified live physical sensor streaming with hardware node `IAA-xiao-bafdedc8` (`Sensor Node (BAFDEDC8)`) delivering real-time dual-axis vibration, temperature, and RPM telemetry.
  - Purged `test-rig-a` and all mock data; dashboard defaults dynamically to discovered hardware sensors.
  - Verified complete physical lifecycle: battery connection auto-detection, battery disconnect zero-isolation, Test Design soft-delete persistence, and automatic resurrection upon battery re-insertion.
  - Integrated full-stack lifecycle into `./start.sh` and `./stop.sh` with 100% offline-ready local network execution.
  - Restored clean default login view (`useState(false)`) without storage sync conflicts.
- **Phase 5.6: Physics Kinematics & High-Bandwidth 12.8 kHz Ingestion (Completed)**:
  - Converted vibration units from legacy mm/s to standard SI m/s across the entire stack.
  - Updated ISO 10816 vibration severity thresholds (<0.0028 m/s Good, >0.0045 m/s Warning, >0.0071 m/s Critical).
  - Implemented discrete numerical derivative $a = \frac{dv}{dt}$ in gateway and backend, displaying live Acceleration (m/s² and g) alongside Velocity (m/s).
  - Reconfigured FFT spectrum analyzer for 12.8 kHz high-rate sampling (6.4 kHz Nyquist bandwidth) with bearing defect harmonic bands.
  - Implemented ADXL382 SPI register interface with internal thermal sensor (0.1 °C/LSB) in firmware, replacing synthetic mock sine waves with physical sensor telemetry.

## 4. Current Phase & Next Milestones
- **Phase 5.5: Physical Raspberry Pi 5 Dedicated Gateway Deployment (Next Milestone)**:
  - Deploy `gateway/rpi_publisher.py` directly to the physical Raspberry Pi 5 mounted on the test rig.
  - Configure `condition-monitor-gateway.service` as a systemd background daemon on the Pi 5 for headless boot recovery.
  - The Raspberry Pi 5 ingests BLE from all wireless sensor nodes (e.g. `IAA-xiao-bafdedc8`) and publishes over the local network (LAN / Wi-Fi) to the central MQTT broker (`192.168.0.102:1883`).
  - Completely decouples the Mac from Bluetooth and local gateway processes; dashboard on the Mac (or any LAN device) simply streams live telemetry over WebSocket.
- **Phase 6: Machine Learning Pipeline (Celery + Redis)**:
  - Implement rolling-window anomaly scoring with LSTM Autoencoders and XGBoost.
  - Wire ML inference results into TimescaleDB and live WebSocket broadcasts.
- **Phase 7: Cloud / Production Deployment**:
  - Deploy frontend to Vercel/Cloudflare edge.
  - Containerize backend stack for cloud hosting.

## 5. Development & Safety Rules (Antigravity v5.5 Protocol)
- **Pre-flight Code Inspection**: Always inspect the existing codebase before proposing or writing changes. Never guess file contents or assumptions.
- **Zero Bloat & Zero Duplicate Code**: Strictly forbid temporary buffer code, duplicate state handlers, or verbose boilerplates. Write short, surgical, high-precision code only.
- **No Bluffing & Explicit Confirmation**: Never hallucinate; ground all findings in live tool output. Always ask for user confirmation before executing structural or architectural changes.
- **Continuous Hard-Saving (Git & Memory)**: Always persist milestone progress into Git commits and update `GEMINI.md` / `PROJECT_PLAN.md` so state is permanently preserved across sessions without re-explaining.
- **Token Efficiency**: Do not redundantly reread large files or re-scan directories repeatedly. Protect token bandwidth with targeted, minimal operations.
- **Microcontroller Flash Permanence**: The Seeed Studio XIAO already has the active sketch flashed in its non-volatile memory. Do NOT ask the user to re-flash or re-verify unless firmware changes are explicitly required. Simply plugging in the USB cable starts telemetry.
- **Single Source of Truth**: All AI Agents must consult this file and `PROJECT_PLAN.md` before writing code to prevent hallucinations, redundant systems, or ghost assets.
- **No Destructive Overwrites**: Preserve existing working React components, Vanilla CSS design tokens, and authentication states.
- **Daily Excel & Thesis Changelog**: Keep `docs/DEVELOPMENT_LOG.xlsx` and `docs/DEVELOPMENT_LOG.csv` updated after each milestone (tracking Date, Section, What Was Removed, What Was Added/Updated, and Thesis Context) for ongoing master thesis documentation.
- **Industrial Design Standard**: Clean, professional UI. No emojis before headings.
