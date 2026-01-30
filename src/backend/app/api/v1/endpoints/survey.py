from typing import Any, List, Optional
from collections import defaultdict
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.models.user_profile import UserProfile, ContentCategory
from app.db.session import get_db
from app.services.gemini_service import gemini_service

router = APIRouter()


# Pydantic schemas
class ContentCategorySchema(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    category_group: Optional[str] = None
    
    class Config:
        from_attributes = True


class ContentCategoryGroup(BaseModel):
    group: str
    categories: List[ContentCategorySchema]


class SurveySubmit(BaseModel):
    age: int
    age_group: str  # 10대, 20대, etc.
    gender: Optional[str] = None
    occupation: str
    location: str
    sns_homepage: Optional[str] = None
    recent_ai_link: Optional[str] = None
    content_preferences: List[str]


class AugmentRequest(BaseModel):
    current_preferences: List[str]
    iteration: int


class AugmentResponse(BaseModel):
    new_preferences: List[str]
    iteration: int
    is_final: bool  # True if iteration >= 10


class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    age: Optional[int] = None
    occupation: Optional[str] = None
    location: Optional[str] = None
    content_preferences: List[str] = []
    augmented_preferences: List[str] = []
    vulnerability_analysis: Optional[str] = None
    onboarding_completed: bool = False
    augmentation_count: int = 0
    
    class Config:
        from_attributes = True


class OnboardingStatus(BaseModel):
    completed: bool
    profile: Optional[UserProfileResponse] = None


@router.get("/categories", response_model=List[ContentCategoryGroup])
async def get_content_categories(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """컨텐츠 카테고리 목록을 그룹별로 조회합니다."""
    result = await db.execute(
        select(ContentCategory).order_by(ContentCategory.display_order)
    )
    categories = result.scalars().all()

    # 그룹별로 분류
    grouped: dict[str, list] = defaultdict(list)
    for cat in categories:
        group_name = cat.category_group or "기타"
        grouped[group_name].append(ContentCategorySchema(
            id=cat.id,
            name=cat.name,
            icon=cat.icon,
            category_group=cat.category_group
        ))

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
    """온보딩 설문을 제출합니다."""
    # Update user age_group and gender
    current_user.age_group = survey_data.age_group
    current_user.gender = survey_data.gender
    await db.commit()
    
    # Check existing profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    existing_profile = result.scalar_one_or_none()

    preferences_json = json.dumps(survey_data.content_preferences, ensure_ascii=False)

    if existing_profile:
        # Update existing profile
        existing_profile.age = survey_data.age
        existing_profile.occupation = survey_data.occupation
        existing_profile.location = survey_data.location
        existing_profile.sns_homepage = survey_data.sns_homepage
        existing_profile.recent_ai_link = survey_data.recent_ai_link
        existing_profile.content_preferences = preferences_json
        existing_profile.onboarding_completed = True

        await db.commit()
        await db.refresh(existing_profile)
        profile = existing_profile
    else:
        # Create new profile
        new_profile = UserProfile(
            user_id=current_user.id,
            age=survey_data.age,
            occupation=survey_data.occupation,
            location=survey_data.location,
            sns_homepage=survey_data.sns_homepage,
            recent_ai_link=survey_data.recent_ai_link,
            content_preferences=preferences_json,
            augmented_preferences="[]",
            onboarding_completed=True,
        )

        db.add(new_profile)
        await db.commit()
        await db.refresh(new_profile)
        profile = new_profile

    # Parse JSON fields for response
    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        age=profile.age,
        occupation=profile.occupation,
        location=profile.location,
        content_preferences=json.loads(profile.content_preferences or "[]"),
        augmented_preferences=json.loads(profile.augmented_preferences or "[]"),
        vulnerability_analysis=profile.vulnerability_analysis,
        onboarding_completed=profile.onboarding_completed,
        augmentation_count=profile.augmentation_count
    )


@router.post("/augment", response_model=AugmentResponse)
async def augment_preferences(
    request: AugmentRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """LLM을 활용해 사용자 취향을 증강합니다. 최대 10회."""
    if request.iteration >= 10:
        return AugmentResponse(
            new_preferences=[],
            iteration=request.iteration,
            is_final=True
        )
    
    # Get user profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    occupation = profile.occupation if profile else "미지정"
    age_group = current_user.age_group or "20대"
    
    # Call Gemini for augmentation
    new_prefs = await gemini_service.augment_preferences(
        user_preferences=request.current_preferences,
        age_group=age_group,
        occupation=occupation,
        iteration=request.iteration + 1
    )
    
    # Update profile with augmented preferences
    if profile:
        current_augmented = json.loads(profile.augmented_preferences or "[]")
        current_augmented.extend(new_prefs)
        profile.augmented_preferences = json.dumps(current_augmented, ensure_ascii=False)
        profile.augmentation_count = request.iteration + 1
        await db.commit()
    
    return AugmentResponse(
        new_preferences=new_prefs,
        iteration=request.iteration + 1,
        is_final=(request.iteration + 1) >= 10
    )


@router.get("/vulnerability")
async def get_vulnerability_analysis(
    refresh: bool = False,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """사용자의 피싱/스캠 취약점 분석 결과를 조회합니다.
    
    Args:
        refresh: True이면 기존 분석을 무시하고 새로 생성합니다.
    """
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete onboarding first."
        )
    
    user_prefs = json.loads(profile.content_preferences or "[]")
    augmented_prefs = json.loads(profile.augmented_preferences or "[]")
    
    # If analysis doesn't exist or refresh is requested, generate it
    if not profile.vulnerability_analysis or refresh:
        if not user_prefs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No preferences found. Please complete onboarding first."
            )
        
        analysis = await gemini_service.analyze_vulnerability(
            user_preferences=user_prefs,
            augmented_preferences=augmented_prefs,
            age_group=current_user.age_group or "20대",
            occupation=profile.occupation or "미지정",
            location=profile.location or "미지정"
        )
        
        profile.vulnerability_analysis = analysis
        
        # Generate summary for dashboard display
        all_prefs = user_prefs + augmented_prefs
        summary = await gemini_service.summarize_vulnerability_analysis(
            full_analysis=analysis,
            user_preferences=all_prefs
        )
        if summary:
            profile.vulnerability_summary = summary
        
        await db.commit()
    
    return {
        "analysis": profile.vulnerability_analysis,
        "preferences": user_prefs,
        "augmented_preferences": augmented_prefs
    }


@router.get("/status", response_model=OnboardingStatus)
async def get_onboarding_status(
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """현재 사용자의 온보딩 완료 여부를 확인합니다."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        return OnboardingStatus(completed=False, profile=None)

    return OnboardingStatus(
        completed=profile.onboarding_completed,
        profile=UserProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            age=profile.age,
            occupation=profile.occupation,
            location=profile.location,
            content_preferences=json.loads(profile.content_preferences or "[]"),
            augmented_preferences=json.loads(profile.augmented_preferences or "[]"),
            vulnerability_analysis=profile.vulnerability_analysis,
            onboarding_completed=profile.onboarding_completed,
            augmentation_count=profile.augmentation_count
        ) if profile else None,
    )


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """현재 사용자의 프로필을 조회합니다."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete onboarding first.",
        )

    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        age=profile.age,
        occupation=profile.occupation,
        location=profile.location,
        content_preferences=json.loads(profile.content_preferences or "[]"),
        augmented_preferences=json.loads(profile.augmented_preferences or "[]"),
        vulnerability_analysis=profile.vulnerability_analysis,
        onboarding_completed=profile.onboarding_completed,
        augmentation_count=profile.augmentation_count
    )
