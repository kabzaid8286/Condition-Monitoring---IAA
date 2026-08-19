from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.alert import Alert, AlertRule
from app.models.sensor import Sensor

async def evaluate_reading(db: AsyncSession, sensor_id: int, value: float, timestamp):
    result = await db.execute(
        select(AlertRule).where(AlertRule.sensor_id == sensor_id, AlertRule.is_active == True)
    )
    rules = result.scalars().all()
    
    for rule in rules:
        if check_threshold(rule, value):
            if await check_cooldown(db, rule.id):
                await create_alert(db, rule, sensor_id, value)

def check_threshold(rule: AlertRule, value: float) -> bool:
    if rule.condition == "gt" and value > rule.threshold:
        return True
    if rule.condition == "lt" and value < rule.threshold:
        return True
    if rule.condition == "gte" and value >= rule.threshold:
        return True
    if rule.condition == "lte" and value <= rule.threshold:
        return True
    return False

async def check_cooldown(db: AsyncSession, rule_id: int) -> bool:
    # Simplified cooldown check
    return True

async def create_alert(db: AsyncSession, rule: AlertRule, sensor_id: int, value: float):
    sensor_res = await db.execute(select(Sensor).where(Sensor.id == sensor_id))
    sensor = sensor_res.scalar_one()
    
    alert = Alert(
        equipment_id=sensor.equipment_id,
        sensor_id=sensor_id,
        rule_id=rule.id,
        message=f"Sensor {sensor.name} value {value} breached {rule.condition} {rule.threshold}",
        severity=rule.severity,
        status="active"
    )
    db.add(alert)
    await db.commit()

async def acknowledge_alert(db: AsyncSession, alert_id: int, user_id: int):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert:
        alert.status = "acknowledged"
        alert.acknowledged_by = user_id
        await db.commit()
    return alert

async def resolve_alert(db: AsyncSession, alert_id: int, user_id: int):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert:
        alert.status = "resolved"
        alert.resolved_by = user_id
        await db.commit()
    return alert

async def get_alert_stats(db: AsyncSession):
    return {}
