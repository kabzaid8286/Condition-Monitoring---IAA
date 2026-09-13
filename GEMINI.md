# Condition Monitoring App (IAA) — Project AI Memory & Rules

> **CRITICAL INSTRUCTION FOR ANY AI AGENT:** You MUST read this entire file before suggesting or writing any code for this project. This file acts as the persistent project memory across all chats and sessions to prevent hallucinations, strictly enforce the architecture, and ensure safe development.

## 1. Project Goal
Develop a condition monitoring system for test rigs / industrial assets (IAA - Institute of Drive and Automotive Engineering / HS Aalen). The system ingests sensor data (Vibration X/Y, Bearing Temperature, RPM), stores it in TimescaleDB, applies ML anomaly detection/RUL prognostics, and displays it on a real-time responsive dashboard.

## 2. Architecture & Tech Stack
- **Frontend (Dual Stacks)**:
  1. **Vanilla JS SPA**: `frontend/index.html` (Standalone, zero-build, complete reference).
  2. **React SPA**: `frontend-react/` (Vite, React 19, Chart.js, Vanilla CSS design system).
- **Backend API**: Python (FastAPI).
- **Database**: TimescaleDB (PostgreSQL) via Docker.
- **Message Broker**: Eclipse Mosquitto (MQTT) via Docker.
- **ML & Background Tasks**: Celery + Redis (Python) for anomaly detection and RUL prognostics.

## 3. Current Progress Snapshot
- **React Frontend (`frontend-react/`) Status**:
  - `Header.jsx`: IAA & HS Aalen branding, PDF Report generation (`exportReport.js` using html2canvas & jsPDF), Alarm bell modal with manual trigger & audio alarm, Asset selector (Test Rig A, Test Rig B, Motor 01, Gearbox 02).
  - `Sidebar.jsx`: Navigation sections (Monitoring, Analytics, Assistant), active badges, and `🚪 Sign Out` footer button that returns to `LoginPage`.
  - `OverviewView.jsx`: 4 Asset KPI cards, live trend chart, sensor table with live timestamps.
  - `LiveTelemetryView.jsx`: Real-time dial gauges (vibration, temp, RPM), multi-channel feed, Frequency Spectrum (FFT) canvas with 60 bins (0-500 Hz).
  - `MlModelsView.jsx`: Model selection tabs (LSTM, Random Forest, XGBoost, 1D-CNN), 4-metric grid, Anomaly Score bar with 0.70 threshold, RUL bar, Fault tags, 24-hour Model Confidence chart, Performance Comparison table.
  - `ComparisonView.jsx`: 4-asset comparison cards with horizontal progress bars for Vibration, Temperature, RPM, Anomaly score, and Comparative Vibration Trend chart for all assets.
  - `AiAssistantView.jsx`: Quick prompt pill buttons, message thread with user & AI avatars, markdown & table rendering, animated typing indicator, and responsive answer generator.
  - `AlertsView.jsx`: Active badge counter, "✓ Acknowledge All" button, Filter tabs (All, Critical, Warning, Info, Acknowledged), alert list with severity icons, metadata, and per-item Acknowledge buttons.
  - `HistoricalDataView.jsx`.
- **Vanilla JS Frontend (`frontend/index.html`)**: Complete 1:1 reference UI.
- **Vite Server**: Runs locally on `http://localhost:5173`.
- **Vanilla Server**: Runs locally on `http://localhost:8080`.

## 4. Safety & Development Rules
- **Direct Reference**: Whenever matching UI features between React and Vanilla JS, treat `frontend/index.html` as the source of truth for design, formulas, and CSS classes.
- **No Destructive Overwrites**: Do not delete or overwrite `frontend/index.html` or existing working components without explicit intention.
- **Token Efficiency**: This file (`GEMINI.md`) contains the core context. Agents should consult it first instead of reading the entire directory.
