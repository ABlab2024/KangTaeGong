from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class SurveySubmit(BaseModel):
    """설문 제출 요청 스키마"""
    age: int = Field(..., ge=1, le=120, description="나이")
    occupation: str = Field(..., min_length=1, max_length=100, description="직업")
    location: str = Field(..., min_length=1, max_length=100, description="사는 곳")
    sns_homepage: Optional[str] = Field(None, max_length=500, description="SNS/유튜브 첫 화면 요구 (선택)")
    recent_ai_link: Optional[str] = Field(None, max_length=500, description="가장 최근 AI 대화 링크 (선택)")
    content_preferences: List[str] = Field(default=[], description="선택한 컨텐츠 취향 목록")


class ContentCategory(BaseModel):
    """컨텐츠 카테고리 응답 스키마"""
    id: UUID
    name: str
    icon: Optional[str]
    category_group: Optional[str]
    display_order: int

    class Config:
        from_attributes = True


class ContentCategoryGroup(BaseModel):
    """그룹화된 카테고리 응답"""
    group: str
    categories: List[ContentCategory]


class UserProfileResponse(BaseModel):
    """사용자 프로필 응답 스키마"""
    id: UUID
    user_id: UUID
    age: Optional[int]
    occupation: Optional[str]
    location: Optional[str]
    sns_homepage: Optional[str]
    recent_ai_link: Optional[str]
    content_preferences: List[str]
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OnboardingStatus(BaseModel):
    """온보딩 상태 응답"""
    completed: bool
    profile: Optional[UserProfileResponse] = None
