"""
Admin API endpoints for KangTaeGong MVP.
Handles user management, training schedules, and statistics.
"""
from typing import Any, List, Optional
from datetime import datetime, timedelta
import json
import random
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
    id: str
    email: str
    age_group: Optional[str] = None
    gender: Optional[str] = None
    security_score: int = 0
    onboarding_completed: bool = False
    created_at: datetime


class TrainingScheduleInfo(BaseModel):
    id: str
    user_email: str
    scheduled_date: datetime
    scenario_name: Optional[str] = None
    is_sent: bool = False


class ScenarioPreview(BaseModel):
    id: str
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


# Helper to verify admin
def verify_admin_token(token: str) -> bool:
    """Verify if the token belongs to admin."""
    from app.core import security
    try:
        payload = security.decode_token(token)
        return payload.get("sub") == "admin"
    except:
        return False


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
    """훈련 예정 스케줄을 조회합니다."""
    query = select(TrainingSchedule)
    if not include_sent:
        query = query.where(TrainingSchedule.is_sent == False)
    query = query.order_by(TrainingSchedule.scheduled_date)
    
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
        is_llm_generated=True,
        is_active=True
    )
    
    db.add(new_scenario)
    await db.commit()
    await db.refresh(new_scenario)
    
    return {
        "scenario_id": new_scenario.id,
        "name": new_scenario.name,
        "subject": new_scenario.subject,
        "body": new_scenario.body_template,
        "red_flags": scenario_data.get("red_flags", [])
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
        
        # Send email
        body_html = scenario.body_template or ""
        body_html = body_html.replace("{name}", user.email.split("@")[0])
        
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
