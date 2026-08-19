from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportResponse, ReportGenerateRequest
from app.models.user import User
from app.utils.dependencies import get_current_active_user, require_role
# Import celery tasks
# from app.tasks.report_tasks import generate_report_task

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/", response_model=List[ReportResponse])
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    query = select(Report).order_by(desc(Report.created_at))
    if current_user.role != "admin":
        query = query.where(Report.created_by == current_user.id)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_report(
    req: ReportGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    report = Report(
        name=req.name,
        type=req.type,
        parameters=req.parameters,
        created_by=current_user.id,
        status="pending"
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    # Trigger celery task
    # generate_report_task.delay(report.id)
    
    return report

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report_status(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if report.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    return report

@router.get("/{report_id}/download")
async def download_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if report.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if report.status != "completed" or not report.file_path:
        raise HTTPException(status_code=400, detail="Report is not ready yet")
        
    return FileResponse(path=report.file_path, filename=report.name + ".pdf")

@router.delete("/{report_id}")
async def delete_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if report.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    await db.delete(report)
    await db.commit()
    return {"message": "Report deleted successfully"}
