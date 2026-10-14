# Condition Monitoring App (IAA) — Project AI Memory & Rules

> **CRITICAL INSTRUCTION FOR ANY AI AGENT:** You MUST read this entire file before suggesting or writing any code for this project. This file acts as the persistent project memory across all chats and sessions to prevent hallucinations, strictly enforce the architecture, and ensure safe development.

## 1. Project Goal
Develop a condition monitoring system for test rigs / industrial assets (IAA - Institute of Drive and Automotive Engineering / HS Aalen). The system ingests sensor data (Vibration X/Y, Bearing Temperature, RPM) from a Raspberry Pi 5, stores it in TimescaleDB, applies ML anomaly detection/RUL prognostics, and displays it on a real-time responsive dashboard.

## 2. Architecture & Tech Stack
- **Frontend**: React SPA (`frontend-react/`) using Vite, React 19, Chart.js, and a Vanilla CSS design system.
- **Backend API**: Python (FastAPI on port 8000).
- **Database**: TimescaleDB (PostgreSQL on port 5432) via Docker.
- **Message Broker**: Eclipse Mosquitto (MQTT on port 1883) via Docker.
- **Hardware / Sensor Node**: Custom carrier board with a Seeed Studio XIAO microcontroller powered by dual coin-cell batteries, connected to MEMS vibration sensors and an industrial temperature probe. Runs C/C++ firmware operating on a duty-cycle (10-second burst acquisition every 5 minutes, followed by Deep Sleep to maximize battery life).
- **Gateway**: Python script (`gateway/rpi_publisher.py`) on Raspberry Pi 5 to ingest serial data from the sensor node and publish to MQTT.
- **ML & Background Tasks**: Celery + Redis (Python) for anomaly detection and RUL prognostics.

## 3. Current Progress Snapshot
- **React Frontend (`frontend-react/`)**: Fully developed SPA. Includes Overview, Real-Time, Historical, ML Models, Alerts, Asset Comparison, Extended Analysis, Test Design, and complete Auth flow.
- **Real-Time WebSocket Integration**: React `useSensorData` hook connects to `ws://localhost:8000/api/v1/telemetry/ws` with dynamic status pill (`Live WS (RPi 5)` vs `Simulated` fallback).
- **Backend Infrastructure**: Docker containers (TimescaleDB, Redis, Mosquitto) and FastAPI are running.
- **End-to-End Pipeline**: Tested and verified from MQTT $\rightarrow$ FastAPI $\rightarrow$ WebSocket $\rightarrow$ React frontend.

## 4. Current Phase: API Integration & Microcontroller Firmware
- **HTTP APIs**: Wire `/api/v1/telemetry/history` to Historical and Analysis charts.
- **Authentication**: Wire Login/Register to PostgreSQL `users` table via FastAPI `/api/v1/auth/`.
- **Microcontroller Firmware**: C/C++ sketch for Seeed Studio XIAO with 5-minute deep sleep timer and 10-second burst acquisition.

## 5. Safety & Development Rules
- **No Destructive Overwrites**: Do not delete or overwrite existing working React components without explicit intention.
- **Single Source of Truth**: All AI Agents must consult this file and the `PROJECT_PLAN.md` before executing new code to ensure we don't build redundant systems or hallucinate new architectures.
