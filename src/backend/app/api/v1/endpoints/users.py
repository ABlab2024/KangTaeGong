from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr

from app.api import deps
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.simulation import SimulationResult
from app.schemas.user import User as UserSchema, UserCreate
from app.core.security import get_password_hash
from app.db.session import get_db

router = APIRouter()


class UserOpenCreate(BaseModel):
    """Schema for open registration (includes full_name)."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class RankingResponse(BaseModel):
    """Response model for user ranking."""
    age_group_rank: int
    age_group_total: int
    overall_rank: int
    overall_total: int
    defense_rate: float
    caught_count: int
    defended_count: int
    vulnerability_summary: Optional[str] = None
    last_caught_type: Optional[str] = None


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


class UserUpdate(BaseModel):
    """Schema for updating user info."""
    email: Optional[EmailStr] = None
    age_group: Optional[str] = None
    gender: Optional[str] = None


@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update current user's information.
    """
    if user_update.email is not None:
        # Check if email is already taken by another user
        result = await db.execute(
            select(User).where(User.email == user_update.email, User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        current_user.email = user_update.email
    
    if user_update.age_group is not None:
        current_user.age_group = user_update.age_group
    
    if user_update.gender is not None:
        current_user.gender = user_update.gender
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.get("/ranking", response_model=RankingResponse)
async def get_user_ranking(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get user's ranking (age group and overall) and defense stats.
    """
    user_id = current_user.id
    user_age_group = current_user.age_group
    
    # Get user's simulation results
    sim_result = await db.execute(
        select(SimulationResult).where(SimulationResult.user_id == user_id)
    )
    simulations = sim_result.scalars().all()
    
    total_sims = len(simulations)
    defended_count = sum(1 for s in simulations if s.is_defended)
    caught_count = total_sims - defended_count
    defense_rate = (defended_count / total_sims * 100) if total_sims > 0 else 100.0
    
    # Get last caught simulation for type info
    last_caught_type = None
    caught_sims = [s for s in simulations if not s.is_defended]
    if caught_sims:
        last_sim = sorted(caught_sims, key=lambda x: x.sent_at, reverse=True)[0]
        last_caught_type = last_sim.email_subject or "알 수 없는 유형"
    
    # Get vulnerability summary from profile
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()
    
    # Use the pre-generated summary, or extract first line as fallback
    vulnerability_summary = None
    if profile:
        if profile.vulnerability_summary:
            vulnerability_summary = profile.vulnerability_summary
        elif profile.vulnerability_analysis:
            # Fallback: extract first non-header line
            lines = profile.vulnerability_analysis.split('\n')
            for line in lines:
                if line.strip() and not line.startswith('#'):
                    vulnerability_summary = line.strip()[:150] + "..." if len(line.strip()) > 150 else line.strip()
                    break
    
    # Calculate overall ranking (by security score, descending)
    overall_result = await db.execute(
        select(User).order_by(User.security_score.desc())
    )
    all_users = overall_result.scalars().all()
    overall_total = len(all_users)
    overall_rank = 1
    for i, u in enumerate(all_users):
        if u.id == user_id:
            overall_rank = i + 1
            break
    
    # Calculate age group ranking
    age_group_rank = 1
    age_group_total = 1
    if user_age_group:
        age_result = await db.execute(
            select(User).where(User.age_group == user_age_group).order_by(User.security_score.desc())
        )
        age_users = age_result.scalars().all()
        age_group_total = len(age_users)
        for i, u in enumerate(age_users):
            if u.id == user_id:
                age_group_rank = i + 1
                break
    
    return RankingResponse(
        age_group_rank=age_group_rank,
        age_group_total=age_group_total,
        overall_rank=overall_rank,
        overall_total=overall_total,
        defense_rate=round(defense_rate, 1),
        caught_count=caught_count,
        defended_count=defended_count,
        vulnerability_summary=vulnerability_summary,
        last_caught_type=last_caught_type,
    )
