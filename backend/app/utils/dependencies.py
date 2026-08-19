from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, JWTError
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.schemas.user import TokenPayload
from app.utils.exceptions import UnauthorizedException, ForbiddenException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException("Could not validate credentials")
        token_data = TokenPayload(**payload)
    except JWTError:
        raise UnauthorizedException("Could not validate credentials")
        
    result = await db.execute(select(User).filter(User.id == token_data.sub))
    user = result.scalars().first()
    
    if not user:
        raise UnauthorizedException("User not found")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise UnauthorizedException("Inactive user")
    return current_user

def require_role(*allowed_roles):
    async def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role not in allowed_roles:
            raise ForbiddenException("Not enough permissions")
        return current_user
    return role_checker
