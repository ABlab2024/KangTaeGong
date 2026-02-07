from datetime import timedelta
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.token import Token
from app.schemas.user import UserCreate, User as UserSchema

router = APIRouter()


@router.post("/login/email")
async def login_with_email(
    email: str,
    age_group: Optional[str] = None,
    gender: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    이메일 전용 로그인/가입.
    이메일이 존재하면 로그인, 없으면 자동 가입 후 로그인.
    설문조사 완료 여부를 함께 반환합니다.
    """
    # 1. Check if user exists
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        # 2. Create new user (email-only signup)
        user = User(
            email=email,
            age_group=age_group,
            gender=gender,
            hashed_password=None,  # No password for email-only login
            preferences="[]",
            security_score=0
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # 3. Check onboarding status
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = profile_result.scalar_one_or_none()
    onboarding_completed = profile.onboarding_completed if profile else False
    
    # 4. Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "onboarding_completed": onboarding_completed,
        "redirect_to": "/dashboard" if onboarding_completed else "/onboarding"
    }


@router.post("/admin/login")
async def admin_login(
    email: str,
    password: str,
) -> Any:
    """
    관리자 로그인.
    환경변수에 설정된 관리자 계정으로만 접근 가능.
    """
    if email != settings.ADMIN_EMAIL or password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )
    
    # Create admin token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        "admin", expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": True,
        "redirect_to": "/admin/dashboard"
    }


# Legacy OAuth2 login (kept for backward compatibility)
@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login (legacy).
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # For email-only users, skip password check
    if user.hashed_password and not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/signup", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user (legacy - for backward compatibility).
    """
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password) if user_in.password else None,
        preferences=json.dumps(user_in.preferences) if user_in.preferences else "[]",
        security_score=0
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
