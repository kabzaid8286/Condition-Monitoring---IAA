import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
from app.services.mqtt_service import hub
from app.routers import (
    auth,
    telemetry,
    alerts,
    sensors,
    equipment,
    predictions,
    dashboard,
    reports,
    users
)
from app.utils.exceptions import CustomException, custom_exception_handler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (creates tables and TimescaleDB hypertable)
    await init_db()
    
    # Start MQTT Background Service for Raspberry Pi 5 telemetry
    loop = asyncio.get_running_loop()
    hub.start_mqtt(broker_host="localhost", broker_port=1883, loop=loop)
    
    yield
    
    # Cleanup on shutdown
    hub.stop_mqtt()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Industrial Condition Monitoring App (IAA / HS Aalen)",
    version="1.0.0",
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Exception handlers
app.add_exception_handler(CustomException, custom_exception_handler)

# CORS middleware for both React (5173) and Vanilla (8080)
origins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 Routers
app.include_router(telemetry.router, prefix=settings.API_V1_PREFIX)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)
app.include_router(sensors.router, prefix=settings.API_V1_PREFIX)
app.include_router(equipment.router, prefix=settings.API_V1_PREFIX)
app.include_router(predictions.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "version": "1.0.0", "service": "IAA Condition Monitoring Backend"}
