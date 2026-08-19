from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
from app.routers import auth
from app.utils.exceptions import CustomException, custom_exception_handler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (creates tables and hypertable)
    await init_db()
    yield
    # Cleanup on shutdown (e.g., closing connections if needed)
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Industrial Condition Monitoring App",
    version="1.0.0",
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Exception handlers
app.add_exception_handler(CustomException, custom_exception_handler)

# CORS middleware
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
