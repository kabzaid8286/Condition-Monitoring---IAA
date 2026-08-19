from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.equipment import Equipment, EquipmentType
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate, EquipmentResponse
from app.models.user import User
from app.utils.dependencies import get_current_active_user, require_role

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.get("/", response_model=List[EquipmentResponse])
async def list_equipment(
    status: Optional[str] = None,
    type_id: Optional[int] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    query = select(Equipment)
    if status:
        query = query.where(Equipment.status == status)
    if type_id:
        query = query.where(Equipment.type_id == type_id)
    if location:
        query = query.where(Equipment.location == location)
    if search:
        query = query.where(
            or_(
                Equipment.name.ilike(f"%{search}%"),
                Equipment.description.ilike(f"%{search}%"),
                Equipment.serial_number.ilike(f"%{search}%")
            )
        )
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    equipment_in: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["engineer", "admin"]))
) -> Any:
    equipment = Equipment(**equipment_in.model_dump())
    db.add(equipment)
    await db.commit()
    await db.refresh(equipment)
    return equipment

@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(
        select(Equipment)
        .options(selectinload(Equipment.sensors))
        .where(Equipment.id == equipment_id)
    )
    equipment = result.scalar_one_or_none()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment

@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: int,
    equipment_in: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["engineer", "admin"]))
) -> Any:
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalar_one_or_none()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    update_data = equipment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(equipment, field, value)
    
    await db.commit()
    await db.refresh(equipment)
    return equipment

@router.delete("/{equipment_id}")
async def delete_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
) -> Any:
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalar_one_or_none()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    await db.delete(equipment)
    await db.commit()
    return {"message": "Equipment deleted successfully"}

@router.get("/{equipment_id}/health")
async def get_equipment_health(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Placeholder for actual health score logic
    return {"equipment_id": equipment_id, "health_score": 85.5, "status": "healthy"}

@router.get("/types/")
async def list_equipment_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(select(EquipmentType))
    return result.scalars().all()

@router.post("/types/")
async def create_equipment_type(
    type_in: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["engineer", "admin"]))
) -> Any:
    eq_type = EquipmentType(**type_in)
    db.add(eq_type)
    await db.commit()
    await db.refresh(eq_type)
    return eq_type
