"""
Admin API endpoints for KangTaeGong MVP.
Handles user management, training schedules, and statistics.
"""
from typing import Any, List, Optional
from datetime import datetime, timedelta
import json
import random
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.simulation import SimulationResult, PhishingScenario, TrainingSchedule
from app.models.threat_case import ThreatCase
from app.services.gemini_service import gemini_service
from app.services.email_service import email_service

router = APIRouter()


# Pydantic schemas
class AdminLoginRequest(BaseModel):
    email: str
    password: str


class UserSummary(BaseModel):
    id: UUID
    email: str
    age_group: Optional[str] = None
    gender: Optional[str] = None
    security_score: int = 0
    onboarding_completed: bool = False
    created_at: datetime


class TrainingScheduleInfo(BaseModel):
    id: UUID
    user_email: str
    scheduled_date: datetime
    scenario_name: Optional[str] = None
    title: Optional[str] = None
    is_sent: bool = False


class ScenarioPreview(BaseModel):
    id: UUID
    name: str
    subject: Optional[str] = None
    body_preview: Optional[str] = None
    difficulty: str = "medium"


class StatsResponse(BaseModel):
    total_users: int
    total_simulations: int
    total_defended: int
    total_failed: int
    defense_rate: float
    stats_by_age_group: dict
    stats_by_gender: dict
    stats_by_preference: dict


class SendSimulationRequest(BaseModel):
    user_ids: Optional[List[str]] = None  # None = all users
    scenario_id: Optional[str] = None
    scheduled_date: Optional[datetime] = None


class ScenarioGenerationBody(BaseModel):
    target_preferences: Optional[List[str]] = None


class ScenarioUpdateRequest(BaseModel):
    """시나리오 수정 요청"""
    name: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    body_template: Optional[str] = None
    sender_name: Optional[str] = None
    difficulty: Optional[str] = None
    is_active: Optional[bool] = None


class ScenarioDetailResponse(BaseModel):
    """시나리오 상세 응답"""
    id: UUID
    name: str
    description: Optional[str] = None
    scenario_type: Optional[str] = None
    difficulty: str = "medium"
    subject: Optional[str] = None
    body_template: Optional[str] = None
    sender_name: Optional[str] = None
    source_url: Optional[str] = None
    is_llm_generated: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class ScheduleCreateRequest(BaseModel):
    """스케줄 생성 요청"""
    user_ids: List[str]
    scenario_id: str
    scheduled_date: datetime
    title: Optional[str] = None  # 훈련 제목


class ScheduleUpdateRequest(BaseModel):
    """스케줄 수정 요청"""
    scheduled_date: Optional[datetime] = None
    scenario_id: Optional[str] = None
    title: Optional[str] = None


# Helper to verify admin
def verify_admin_token(token: str) -> bool:
    """Verify if the token belongs to admin."""
    from app.core import security
    try:
        payload = security.decode_token(token)
        return payload.get("sub") == "admin"
    except:
        return False


def personalize_email_body(
    body_template: str,
    user: User,
    profile: Optional[UserProfile] = None
) -> str:
    """시나리오 템플릿을 사용자 프로필 데이터로 개인화합니다."""
    body = body_template
    
    # 기본 사용자 정보
    name = user.email.split("@")[0]
    body = body.replace("{name}", name)
    body = body.replace("{email}", user.email)
    
    if profile:
        # 프로필 정보 - 설문조사 결과
        body = body.replace("{location}", profile.location or "")
        body = body.replace("{occupation}", profile.occupation or "")
        body = body.replace("{age}", str(profile.age) if profile.age else "")
        
        # 선호도 정보
        try:
            prefs = profile.content_preferences if profile.content_preferences else []
            aug_prefs = profile.augmented_preferences if profile.augmented_preferences else []
            all_prefs = prefs + aug_prefs
            prefs_text = ", ".join(all_prefs[:3]) if all_prefs else ""
            body = body.replace("{preferences}", prefs_text)
        except:
            body = body.replace("{preferences}", "")
    else:
        # 프로필이 없는 경우 빈 문자열로 대체
        body = body.replace("{location}", "")
        body = body.replace("{occupation}", "")
        body = body.replace("{age}", "")
        body = body.replace("{preferences}", "")
    
    return body


@router.get("/users", response_model=List[UserSummary])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """등록된 모든 사용자 목록을 조회합니다."""
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    
    summaries = []
    for user in users:
        # Get profile
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user.id)
        )
        profile = profile_result.scalar_one_or_none()
        
        summaries.append(UserSummary(
            id=user.id,
            email=user.email,
            age_group=user.age_group,
            gender=user.gender,
            security_score=user.security_score,
            onboarding_completed=profile.onboarding_completed if profile else False,
            created_at=user.created_at
        ))
    
    return summaries


@router.get("/schedule", response_model=List[TrainingScheduleInfo])
async def get_training_schedule(
    db: AsyncSession = Depends(get_db),
    include_sent: bool = False,
) -> Any:
    """훈련 예정 스케줄을 조회합니다. 제목 기준으로 정렬합니다."""
    query = select(TrainingSchedule)
    if not include_sent:
        query = query.where(TrainingSchedule.is_sent == False)
    # 제목 기준 정렬 (NULL은 뒤로), 그 다음 예정일 기준 정렬
    query = query.order_by(TrainingSchedule.title.asc().nullslast(), TrainingSchedule.scheduled_date)
    
    result = await db.execute(query)
    schedules = result.scalars().all()
    
    schedule_list = []
    for schedule in schedules:
        # Get user email
        user_result = await db.execute(
            select(User).where(User.id == schedule.user_id)
        )
        user = user_result.scalar_one_or_none()
        
        # Get scenario name
        scenario_name = None
        if schedule.scenario_id:
            scenario_result = await db.execute(
                select(PhishingScenario).where(PhishingScenario.id == schedule.scenario_id)
            )
            scenario = scenario_result.scalar_one_or_none()
            scenario_name = scenario.name if scenario else None
        
        schedule_list.append(TrainingScheduleInfo(
            id=schedule.id,
            user_email=user.email if user else "Unknown",
            scheduled_date=schedule.scheduled_date,
            scenario_name=scenario_name,
            title=schedule.title,
            is_sent=schedule.is_sent
        ))
    
    return schedule_list


@router.get("/scenario/preview", response_model=List[ScenarioPreview])
async def get_scenario_previews(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """사용 가능한 피싱 시나리오 미리보기를 조회합니다."""
    result = await db.execute(
        select(PhishingScenario).where(PhishingScenario.is_active == True)
    )
    scenarios = result.scalars().all()
    
    return [
        ScenarioPreview(
            id=s.id,
            name=s.name,
            subject=s.subject,
            body_preview=s.body_template[:200] + "..." if s.body_template and len(s.body_template) > 200 else s.body_template,
            difficulty=s.difficulty or "medium"
        )
        for s in scenarios
    ]


@router.post("/scenario/generate")
async def generate_scenario(
    body: Optional[ScenarioGenerationBody] = Body(None),
    mode: str = Query("preference", regex="^(preference|auto|manual)$"),
    prompt: Optional[str] = Query(None),
    source_url: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """LLM을 활용해 새로운 피싱 시나리오를 생성합니다.
    - mode='preference': (기존) 사용자 취향 기반
    - mode='auto': (신규) 최신 위협 사례 기반 자동 추천
    - mode='manual': (신규) 관리자 프롬프트 기반
    """
    scenario_data = None
    target_preferences = body.target_preferences if body else None
    max_retries = 3
    
    for attempt in range(max_retries):
        if mode == "auto":
            # AI Recommendation from latest ThreatCase
            # Random selection to give variety or just latest? User said "Select from collected news"
            # Let's pick a random one from top 10 to give variety
            result = await db.execute(
                select(ThreatCase).order_by(ThreatCase.collected_at.desc()).limit(10)
            )
            threats = result.scalars().all()
            
            if not threats:
                 context = "최근 유행하는 보이스피싱 및 스미싱 트렌드를 반영하여 생성해주세요."
                 threat_source = None
            else:
                 threat = random.choice(threats)
                 context = f"기반 뉴스/사례:\n{threat.raw_text}"
                 threat_source = threat.source_url
            
            scenario_data = await gemini_service.generate_scenario_from_text(
                context_text=context,
                scenario_type="email"
            )
            if threat_source:
                source_url = threat_source
                
        elif mode == "manual":
            # Manual Prompt
            if not prompt:
                 raise HTTPException(status_code=400, detail="Prompt is required for manual mode")
            
            scenario_data = await gemini_service.generate_scenario_from_text(
                context_text=prompt,
                scenario_type="email"
            )
            
        else:
            # Legacy (Preference based)
            preferences = target_preferences or ["일반"]
            scenario_data = await gemini_service.generate_phishing_scenario(
                user_preferences=preferences,
                scenario_type="email",
                source_url=source_url
            )
        
        # Check if generation succeeded and has required fields
        if scenario_data and isinstance(scenario_data, dict):
            if scenario_data.get("subject") and scenario_data.get("body"):
                break  # Success, exit retry loop
        
        # Log retry attempt
        import logging
        logging.warning(f"Scenario generation attempt {attempt + 1}/{max_retries} failed or incomplete. Retrying...")
    
    if not scenario_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate scenario after multiple attempts"
        )
    
    # Validate required fields
    if not scenario_data.get("subject") or not scenario_data.get("body"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generated scenario is missing required fields after {max_retries} attempts. Got keys: {list(scenario_data.keys()) if isinstance(scenario_data, dict) else 'not a dict'}"
        )
    
    # Generate dummy page HTML for the scenario
    import logging
    logger = logging.getLogger(__name__)
    
    # Extract preferences from scenario for dummy page generation
    scenario_name = scenario_data.get("name", "피싱 시나리오")
    scenario_description = scenario_data.get("description", "")
    dummy_page_html = None
    
    try:
        dummy_page_html = await gemini_service.generate_dummy_page_html(
            scenario_type=scenario_name,
            target_preferences=[scenario_description] if scenario_description else ["일반"]
        )
        # Clean up HTML if wrapped in markdown code blocks
        if dummy_page_html:
            dummy_page_html = dummy_page_html.strip()
            if dummy_page_html.startswith("```html"):
                dummy_page_html = dummy_page_html[7:]
            if dummy_page_html.startswith("```"):
                dummy_page_html = dummy_page_html[3:]
            if dummy_page_html.endswith("```"):
                dummy_page_html = dummy_page_html[:-3]
            dummy_page_html = dummy_page_html.strip()
        logger.info(f"Successfully generated dummy page HTML ({len(dummy_page_html) if dummy_page_html else 0} bytes)")
    except Exception as e:
        logger.error(f"Failed to generate dummy page: {e}")
        # Continue without dummy page - it will use default fallback
    
    # Save to database
    new_scenario = PhishingScenario(
        name=scenario_data.get("name", "Generated Scenario"),
        description=scenario_data.get("description", ""),
        scenario_type="email",
        difficulty=scenario_data.get("difficulty", "medium"),
        subject=scenario_data.get("subject", ""),
        body_template=scenario_data.get("body", ""),
        sender_name=scenario_data.get("sender_name", ""),
        source_url=source_url,
        dummy_page_html=dummy_page_html,
        # URL will be set after we have the scenario ID; for now use placeholder pattern
        dummy_page_url=None,  # Will be updated after commit
        is_llm_generated=True,
        is_active=True
    )
    
    db.add(new_scenario)
    await db.commit()
    await db.refresh(new_scenario)
    
    # Update dummy_page_url with the correct internal serving URL
    # The actual simulation_id will be used at runtime, so we store a pattern
    # Format: /api/v1/track/page/{simulation_id} - handled by email_service when sending
    # For now, we just mark that this scenario has a dummy page available
    if dummy_page_html:
        new_scenario.dummy_page_url = f"__INTERNAL__:/api/v1/track/page/{{simulation_id}}"
        await db.commit()
        await db.refresh(new_scenario)
    
    return {
        "scenario_id": new_scenario.id,
        "name": new_scenario.name,
        "subject": new_scenario.subject,
        "body": new_scenario.body_template,
        "red_flags": scenario_data.get("red_flags", []),
        "has_dummy_page": dummy_page_html is not None
    }


@router.post("/send-simulation")
async def send_simulation_to_users(
    request: SendSimulationRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """사용자들에게 피싱 시뮬레이션 이메일을 발송합니다."""
    # Get users
    if request.user_ids:
        result = await db.execute(
            select(User).where(User.id.in_(request.user_ids))
        )
    else:
        result = await db.execute(select(User))
    users = result.scalars().all()
    
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    
    # Get scenario
    if request.scenario_id:
        scenario_result = await db.execute(
            select(PhishingScenario).where(PhishingScenario.id == request.scenario_id)
        )
        scenario = scenario_result.scalar_one_or_none()
    else:
        # Use random active scenario
        scenario_result = await db.execute(
            select(PhishingScenario).where(PhishingScenario.is_active == True)
        )
        scenarios = scenario_result.scalars().all()
        scenario = random.choice(scenarios) if scenarios else None
    
    if not scenario:
        raise HTTPException(status_code=404, detail="No scenario available")
    
    sent_count = 0
    
    for user in users:
        # Get user profile for personalization
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user.id)
        )
        profile = profile_result.scalar_one_or_none()
        
        # Create simulation result record
        sim_result = SimulationResult(
            user_id=user.id,
            scenario_id=scenario.id,
            sent_at=datetime.utcnow(),
            email_subject=scenario.subject,
            is_defended=True  # Default to defended until proven otherwise
        )
        db.add(sim_result)
        await db.commit()
        await db.refresh(sim_result)
        
        # Personalize email body with user profile data
        body_html = personalize_email_body(
            body_template=scenario.body_template or "",
            user=user,
            profile=profile
        )
        
        success = await email_service.send_phishing_email(
            to_email=user.email,
            subject=scenario.subject or "중요 안내",
            body_html=body_html,
            sender_name=scenario.sender_name or "안내",
            simulation_id=sim_result.id,
            dummy_page_url=scenario.dummy_page_url
        )
        
        if success:
            sent_count += 1
    
    return {
        "message": f"Sent simulations to {sent_count} users",
        "sent_count": sent_count,
        "total_users": len(users)
    }


@router.get("/stats", response_model=StatsResponse)
async def get_statistics(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """훈련 결과 통계를 조회합니다."""
    # Total users
    user_count = await db.execute(select(func.count(User.id)))
    total_users = user_count.scalar() or 0
    
    # Total simulations
    sim_count = await db.execute(select(func.count(SimulationResult.id)))
    total_simulations = sim_count.scalar() or 0
    
    # Defended vs Failed
    defended_count = await db.execute(
        select(func.count(SimulationResult.id)).where(SimulationResult.is_defended == True)
    )
    total_defended = defended_count.scalar() or 0
    total_failed = total_simulations - total_defended
    
    defense_rate = (total_defended / total_simulations * 100) if total_simulations > 0 else 0
    
    # Stats by age group
    stats_by_age_group = {}
    age_groups = ["10대", "20대", "30대", "40대", "50대", "60대 이상"]
    for age_group in age_groups:
        result = await db.execute(
            select(func.count(SimulationResult.id))
            .join(User, SimulationResult.user_id == User.id)
            .where(User.age_group == age_group)
            .where(SimulationResult.is_defended == False)
        )
        failed = result.scalar() or 0
        
        result2 = await db.execute(
            select(func.count(SimulationResult.id))
            .join(User, SimulationResult.user_id == User.id)
            .where(User.age_group == age_group)
        )
        total = result2.scalar() or 0
        
        stats_by_age_group[age_group] = {
            "total": total,
            "failed": failed,
            "fail_rate": (failed / total * 100) if total > 0 else 0
        }
    
    # Stats by gender
    stats_by_gender = {}
    for gender in ["남성", "여성", "기타"]:
        result = await db.execute(
            select(func.count(SimulationResult.id))
            .join(User, SimulationResult.user_id == User.id)
            .where(User.gender == gender)
            .where(SimulationResult.is_defended == False)
        )
        failed = result.scalar() or 0
        
        result2 = await db.execute(
            select(func.count(SimulationResult.id))
            .join(User, SimulationResult.user_id == User.id)
            .where(User.gender == gender)
        )
        total = result2.scalar() or 0
        
        stats_by_gender[gender] = {
            "total": total,
            "failed": failed,
            "fail_rate": (failed / total * 100) if total > 0 else 0
        }
    
    # Stats by preference (top vulnerable categories)
    stats_by_preference = {}
    
    return StatsResponse(
        total_users=total_users,
        total_simulations=total_simulations,
        total_defended=total_defended,
        total_failed=total_failed,
        defense_rate=round(defense_rate, 1),
        stats_by_age_group=stats_by_age_group,
        stats_by_gender=stats_by_gender,
        stats_by_preference=stats_by_preference
    )


@router.get("/next-training-period")
async def get_next_training_period() -> Any:
    """다음 훈련 예정 기간을 조회합니다."""
    # Simple logic: next month's first week
    today = datetime.utcnow()
    if today.month == 12:
        next_month = 1
        year = today.year + 1
    else:
        next_month = today.month + 1
        year = today.year
    
    month_names = ["", "1월", "2월", "3월", "4월", "5월", "6월", 
                   "7월", "8월", "9월", "10월", "11월", "12월"]
    
    return {
        "period": f"{month_names[next_month]} 첫째주",
        "start_date": datetime(year, next_month, 1).isoformat(),
        "end_date": datetime(year, next_month, 7).isoformat()
    }


@router.get("/scenario/{scenario_id}", response_model=ScenarioDetailResponse)
async def get_scenario_detail(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """시나리오 상세 정보를 조회합니다."""
    result = await db.execute(
        select(PhishingScenario).where(PhishingScenario.id == scenario_id)
    )
    scenario = result.scalar_one_or_none()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return ScenarioDetailResponse(
        id=scenario.id,
        name=scenario.name,
        description=scenario.description,
        scenario_type=scenario.scenario_type,
        difficulty=scenario.difficulty or "medium",
        subject=scenario.subject,
        body_template=scenario.body_template,
        sender_name=scenario.sender_name,
        source_url=scenario.source_url,
        is_llm_generated=scenario.is_llm_generated,
        is_active=scenario.is_active,
        created_at=scenario.created_at,
        updated_at=scenario.updated_at
    )


@router.put("/scenario/{scenario_id}", response_model=ScenarioDetailResponse)
async def update_scenario(
    scenario_id: str,
    request: ScenarioUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """시나리오를 수정합니다."""
    result = await db.execute(
        select(PhishingScenario).where(PhishingScenario.id == scenario_id)
    )
    scenario = result.scalar_one_or_none()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    # Update only provided fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(scenario, field, value)
    
    scenario.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(scenario)
    
    return ScenarioDetailResponse(
        id=scenario.id,
        name=scenario.name,
        description=scenario.description,
        scenario_type=scenario.scenario_type,
        difficulty=scenario.difficulty or "medium",
        subject=scenario.subject,
        body_template=scenario.body_template,
        sender_name=scenario.sender_name,
        source_url=scenario.source_url,
        is_llm_generated=scenario.is_llm_generated,
        is_active=scenario.is_active,
        created_at=scenario.created_at,
        updated_at=scenario.updated_at
    )


@router.post("/schedule")
async def create_schedule(
    request: ScheduleCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """훈련 스케줄을 생성합니다."""
    # Verify scenario exists
    scenario_result = await db.execute(
        select(PhishingScenario).where(PhishingScenario.id == request.scenario_id)
    )
    scenario = scenario_result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    # Verify users exist
    user_result = await db.execute(
        select(User).where(User.id.in_(request.user_ids))
    )
    users = user_result.scalars().all()
    
    if len(users) != len(request.user_ids):
        raise HTTPException(status_code=400, detail="Some user IDs are invalid")
    
    created_schedules = []
    for user in users:
        schedule = TrainingSchedule(
            user_id=user.id,
            scenario_id=request.scenario_id,
            scheduled_date=request.scheduled_date,
            title=request.title,
            is_sent=False
        )
        db.add(schedule)
        created_schedules.append({
            "user_id": user.id,
            "user_email": user.email,
            "scenario_id": request.scenario_id,
            "scheduled_date": request.scheduled_date.isoformat()
        })
    
    await db.commit()
    
    return {
        "message": f"Created {len(created_schedules)} schedules",
        "created_count": len(created_schedules),
        "schedules": created_schedules
    }


@router.put("/schedule/{schedule_id}")
async def update_schedule(
    schedule_id: str,
    request: ScheduleUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """훈련 스케줄을 수정합니다. 발송되지 않은 스케줄만 수정 가능합니다."""
    # Find the schedule
    result = await db.execute(
        select(TrainingSchedule).where(TrainingSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule.is_sent:
        raise HTTPException(status_code=400, detail="Cannot modify a schedule that has already been sent")
    
    # Validate scenario if provided
    if request.scenario_id:
        scenario_result = await db.execute(
            select(PhishingScenario).where(PhishingScenario.id == request.scenario_id)
        )
        if not scenario_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Invalid scenario_id")
    
    # Update only provided fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(schedule, field, value)
    
    await db.commit()
    await db.refresh(schedule)
    
    return {
        "message": "Schedule updated successfully",
        "schedule": {
            "id": schedule.id,
            "title": schedule.title,
            "scheduled_date": schedule.scheduled_date.isoformat(),
            "scenario_id": schedule.scenario_id
        }
    }


@router.delete("/schedule/{schedule_id}")
async def delete_schedule(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """훈련 스케줄을 삭제합니다. 발송되지 않은 스케줄만 삭제 가능합니다."""
    # Find the schedule
    result = await db.execute(
        select(TrainingSchedule).where(TrainingSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule.is_sent:
        raise HTTPException(status_code=400, detail="Cannot delete a schedule that has already been sent")
    
    await db.delete(schedule)
    await db.commit()
    
    return {"message": "Schedule deleted successfully", "deleted_id": schedule_id}


@router.get("/stats/scenario")
async def get_stats_by_scenario(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """시나리오별 통계를 조회합니다."""
    # Get all scenarios with their stats
    result = await db.execute(
        select(PhishingScenario).where(PhishingScenario.is_active == True)
    )
    scenarios = result.scalars().all()
    
    stats = []
    for scenario in scenarios:
        # Total simulations for this scenario
        total_result = await db.execute(
            select(func.count(SimulationResult.id))
            .where(SimulationResult.scenario_id == scenario.id)
        )
        total = total_result.scalar() or 0
        
        # Failed (not defended)
        failed_result = await db.execute(
            select(func.count(SimulationResult.id))
            .where(SimulationResult.scenario_id == scenario.id)
            .where(SimulationResult.is_defended == False)
        )
        failed = failed_result.scalar() or 0
        
        # Link clicked
        clicked_result = await db.execute(
            select(func.count(SimulationResult.id))
            .where(SimulationResult.scenario_id == scenario.id)
            .where(SimulationResult.link_clicked == True)
        )
        clicked = clicked_result.scalar() or 0
        
        stats.append({
            "scenario_id": scenario.id,
            "scenario_name": scenario.name,
            "difficulty": scenario.difficulty or "medium",
            "total_sent": total,
            "total_failed": failed,
            "total_clicked": clicked,
            "fail_rate": round((failed / total * 100), 1) if total > 0 else 0,
            "click_rate": round((clicked / total * 100), 1) if total > 0 else 0
        })
    
    return {
        "scenario_stats": stats,
        "total_scenarios": len(stats)
    }

