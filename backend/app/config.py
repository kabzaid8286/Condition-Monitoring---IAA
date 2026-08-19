from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://app:changeme@localhost:5432/condition_monitoring"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # MQTT
    MQTT_BROKER_URL: str = "mqtt://localhost:1883"
    
    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-key"
    JWT_REFRESH_SECRET_KEY: str = "your-refresh-secret-key"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"
    
    # API
    API_PORT: int = 8000
    PROJECT_NAME: str = "IAA Condition Monitoring"
    API_V1_PREFIX: str = "/api/v1"
    
    class Config:
        env_file = ".env"

settings = Settings()
