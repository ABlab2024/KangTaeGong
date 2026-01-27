from typing import Any, List
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.user import User
from app.models.user_profile import UserProfile, ContentCategory
from app.schemas.survey import (
    SurveySubmit,
    ContentCategory as ContentCategorySchema,
    ContentCategoryGroup,
    UserProfileResponse,
    OnboardingStatus,
)
from app.db.session import get_db

router = APIRouter()


@router.get("/categories", response_model=List[ContentCategoryGroup])
async def get_content_categories(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    컨텐츠 카테고리 목록을 그룹별로 조회합니다.
    """
    result = await db.execute(
        select(ContentCategory).order_by(ContentCategory.display_order)
    )
    categories = result.scalars().all()

    # 그룹별로 분류
    grouped: dict[str, list] = defaultdict(list)
    for cat in categories:
        group_name = cat.category_group or "기타"
        grouped[group_name].append(ContentCategorySchema.model_validate(cat))

    # ContentCategoryGroup 형태로 변환
    return [
        ContentCategoryGroup(group=group, categories=cats)
        for group, cats in grouped.items()
    ]


@router.post("/submit", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def submit_survey(
    survey_data: SurveySubmit,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    온보딩 설문을 제출합니다.
    기존 프로필이 있으면 업데이트, 없으면 생성합니다.
    """
    # 기존 프로필 확인
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    existing_profile = result.scalar_one_or_none()

    if existing_profile:
        # 기존 프로필 업데이트
        existing_profile.age = survey_data.age
        existing_profile.occupation = survey_data.occupation
        existing_profile.location = survey_data.location
        existing_profile.sns_homepage = survey_data.sns_homepage
        existing_profile.recent_ai_link = survey_data.recent_ai_link
        existing_profile.content_preferences = survey_data.content_preferences
        existing_profile.onboarding_completed = True

        await db.commit()
        await db.refresh(existing_profile)
        return existing_profile
    else:
        # 새 프로필 생성
        new_profile = UserProfile(
            user_id=current_user.id,
            age=survey_data.age,
            occupation=survey_data.occupation,
            location=survey_data.location,
            sns_homepage=survey_data.sns_homepage,
            recent_ai_link=survey_data.recent_ai_link,
            content_preferences=survey_data.content_preferences,
            onboarding_completed=True,
        )

        db.add(new_profile)
        await db.commit()
        await db.refresh(new_profile)
        return new_profile


@router.get("/status", response_model=OnboardingStatus)
async def get_onboarding_status(
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    현재 사용자의 온보딩 완료 여부를 확인합니다.
    """
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        return OnboardingStatus(completed=False, profile=None)

    return OnboardingStatus(
        completed=profile.onboarding_completed,
        profile=UserProfileResponse.model_validate(profile) if profile else None,
    )


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    현재 사용자의 프로필을 조회합니다.
    """
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete onboarding first.",
        )

    return profile
