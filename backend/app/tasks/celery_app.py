from celery import Celery
from app.config import settings

celery_app = Celery(
    "condition_monitoring",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.ml_tasks", "app.tasks.report_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "run-anomaly-detection": {
            "task": "app.tasks.ml_tasks.run_anomaly_detection",
            "schedule": 300.0,  # every 5 minutes
        },
        "calculate-health-scores": {
            "task": "app.tasks.ml_tasks.calculate_health_scores",
            "schedule": 60.0,  # every minute
        },
    },
)
