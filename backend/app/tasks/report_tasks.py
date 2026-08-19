from app.tasks.celery_app import celery_app
from app.services.report_service import generate_report
import asyncio

@celery_app.task
def generate_report_task(report_id: int):
    # In a real app, this would use an async to sync wrapper to interact with the async db and service
    print(f"Generating report {report_id}")
    # asyncio.run(generate_report(db_session, report_id))
    return {"status": "completed", "report_id": report_id}
