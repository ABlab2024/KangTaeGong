from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.api import deps
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate
from app.core.security import get_password_hash
from app.db.session import get_db

router = APIRouter()


class UserOpenCreate(BaseModel):
    """Schema for open registration (includes full_name)."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None


@router.post("/open", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user_open(
    user_in: UserOpenCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create new user without authentication (open registration).
    """
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        preferences=[],
        security_score=0,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
