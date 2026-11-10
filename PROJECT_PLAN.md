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

## Phase 4: Telemetry Stabilization & Multi-Sensor Hardware Auto-Detection (Completed)
- [x] **Glitch Resolution**: Pre-seeded rolling buffers with 20 baseline points to eliminate blank sparklines and chart dropouts.
- [x] **Hardware Heartbeat Watchdog**: Dashboard dynamically displays `Live WS (RPi 5)` when live packets stream and `Hardware Offline` when the microcontroller is unplugged.
- [x] **Custom Asset Persistence**: Custom test designs created in `Test Design` persist in `localStorage` across reloads and execute virtual telemetry simulations with their configured baseline parameters.
- [x] **Multi-Sensor Hardware Auto-Detection**: Firmware natively reads the unique silicon chip ID (`xiao_nrf54l15::Ficr::deviceId()`) to dynamically identify twin Seeed Studio XIAO boards (`xiao-xxxx`) without firmware collisions.
- [x] **Per-Asset Zero/Null Isolation**: Synchronous state render isolation guarantees that unconnected machines instantly display pure 0/null values without transient 1-second switching glitches.
- [x] **Dynamic Routing & Renaming**: Gateway routes packets by board ID, and the React frontend auto-registers any newly detected sensor node into the machine dropdown and Test Design for live renaming.

---

## Phase 5: Wireless Bluetooth (BLE) & Multi-Node Concurrent Streaming (Completed)
- [x] **Firmware Dual-Mode (BLE + USB)**: Integrated Nordic UART Service (NUS) with `Bluefruit52Lib` in `xiao_condition_node.ino` for cable-free telemetry transmission with Apple/Linux compliant intervals.
- [x] **Silicon Device ID Auto-Detection**: Firmware queries hardware FICR registers (`xiao_nrf54l15::Ficr::deviceId()`), guaranteeing duplicate boards self-assign unique IDs without code collision.
- [x] **Gateway BLE Ingestion**: Implemented asynchronous Bluetooth LE scanner/receiver in `gateway/rpi_publisher.py` (via `bleak`), verified live wireless reception (`[BLE-WIRELESS]`) and MQTT forwarding.
- [x] **Multi-Node Concurrency**: Upgraded BLE gateway with asynchronous client pooling to stream from multiple wireless sensor nodes simultaneously.
- [x] **Microcontroller Flash Permanence**: Verified code retention across power cycles; sensors start transmitting wirelessly upon coin-cell battery insertion.
- [x] **Physical Sensor Verification**: Verified live streaming with physical coin-cell node `IAA-xiao-bafdedc8` (`Sensor Node (BAFDEDC8)`).
- [x] **Automation & Clean Auth**: Integrated BLE daemon into `start.sh` / `stop.sh` and set default clean login screen display.
- [x] **Purge Mock Defaults**: Purged `test-rig-a` and mock data entirely; live stream defaults dynamically to discovered hardware nodes (e.g. `Sensor Node (BAFDEDC8)`).
- [ ] **Backlog Feature**: Auto-focus switcher on newly discovered live sensor streams (saved for future phase).

---

## Phase 5.6: Physics Kinematics & 12.8 kHz Ingestion Pipeline (Completed)
- [x] **Unit Conversion (mm/s to m/s)**: Standardized SI velocity units across the gateway, backend WebSocket hub, and React SPA views (Overview, Real-Time Monitoring, Trends, Comparison, ML Models, and AI Assistant).
- [x] **ISO 10816 Standard Thresholds**: Updated threshold classification to ISO 10816 velocity limits (<0.0028 m/s Good, >0.0045 m/s Warning, >0.0071 m/s Critical).
- [x] **Numerical Derivative for Acceleration**: Implemented $a = \frac{dv}{dt}$ discrete differentiation in `gateway/rpi_publisher.py` and backend, rendering dual live Acceleration ($a_x, a_y$ in $\text{m/s}^2$ and $g$) and Velocity ($v_x, v_y$ in $\text{m/s}$) gauges and multi-channel feeds.
- [x] **12.8 kHz Sampling Rate & FFT**: Configured 12.8 kHz burst sampling capability with FFT spectrum analyzer displaying full 6.4 kHz Nyquist bandwidth and bearing defect harmonic frequency bands (BPFO, 1X, 2X, resonances).
- [x] **ADXL382 Hardware Interface**: Upgraded firmware sketch with SPI driver for the onboard ADXL382 accelerometer and internal temperature sensor register ($0.1\,^\circ\text{C}$/LSB), eliminating synthetic sine generation and hardcoded ADC defaults.

## Phase 5.5: Physical Raspberry Pi 5 Dedicated Gateway Deployment (Next Milestone)
*Goal: Deploy the gateway daemon to the Raspberry Pi 5 mounted on the test rig to decouple the system from the Mac completely.*
- [ ] **Transfer Gateway Code**: Sync `gateway/rpi_publisher.py` and requirements (`paho-mqtt`, `bleak`, `pyserial`) to the Raspberry Pi 5.
- [ ] **Systemd Headless Daemon**: Configure `condition-monitor-gateway.service` on the Pi 5 for automatic boot recovery and 24/7 background operation.
- [ ] **LAN/Wi-Fi MQTT Routing**: Configure the Pi 5 to publish ingested BLE sensor telemetry across the local LAN/Wi-Fi to the central server/broker (`192.168.0.102:1883`).
- [ ] **Verification**: Confirm the React dashboard streams live telemetry from the Raspberry Pi 5 gateway without any Bluetooth or Python processes running on the Mac.

## Phase 6: Machine Learning Pipeline & Background Processing
*Goal: Transition from baseline anomaly rules to automated ML inference on live telemetry batches.*
- [ ] Configure Celery background workers connected to Redis task broker.
- [ ] Implement inference worker for LSTM Autoencoder (unsupervised reconstruction error anomaly detection).
- [ ] Implement XGBoost classifier for multi-fault identification (Bearing Defect
, Misalignment, Imbalance, Looseness).
- [ ] Compute Remaining Useful Life (RUL) estimation curve based on degradation trajectory.
- [ ] Stream ML predictions and trigger automated alerts in TimescaleDB and the React UI.

## Phase 7: Production Cloud / On-Premises Deployment
*Goal: Package and deploy the application for multi-user access across HS Aalen.*
- [ ] Dockerize the React SPA (Nginx multi-stage build) or deploy to Vercel/Cloudflare Pages edge.
- [ ] Containerize full backend stack with production Docker Compose (FastAPI, Mosquitto, TimescaleDB, Redis, Celery).
- [ ] Configure reverse proxy (Nginx or Caddy) with TLS/SSL encryption for HTTPS and WSS.
- [ ] Handover documentation, user manual, and operational guides for researchers and operators.
