"""
백그라운드 스케쥴러 서비스.
APScheduler를 사용하여 주기적으로 훈련 스케쥴을 처리합니다.
"""
import logging
from datetime import datetime
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.simulation import TrainingSchedule, PhishingScenario, SimulationResult
from app.models.user import User
from app.models.user_profile import UserProfile
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


def personalize_email_body(
    body_template: str,
    user: User,
    profile: UserProfile | None = None
) -> str:
    """시나리오 템플릿을 사용자 프로필 데이터로 개인화합니다."""
    import json
    
    body = body_template
    
    # 기본 사용자 정보
    name = user.email.split("@")[0]
    body = body.replace("{name}", name)
    body = body.replace("{email}", user.email)
    
    if profile:
        body = body.replace("{location}", profile.location or "")
        body = body.replace("{occupation}", profile.occupation or "")
        body = body.replace("{age}", str(profile.age) if profile.age else "")
        
        try:
            prefs = json.loads(profile.content_preferences) if profile.content_preferences else []
            aug_prefs = json.loads(profile.augmented_preferences) if profile.augmented_preferences else []
            all_prefs = prefs + aug_prefs
            prefs_text = ", ".join(all_prefs[:3]) if all_prefs else ""
            body = body.replace("{preferences}", prefs_text)
        except:
            body = body.replace("{preferences}", "")
    else:
        body = body.replace("{location}", "")
        body = body.replace("{occupation}", "")
        body = body.replace("{age}", "")
        body = body.replace("{preferences}", "")
    
    return body


async def process_pending_schedules():
    """대기 중인 훈련 스케쥴을 처리합니다."""
    now = datetime.utcnow()
    logger.info(f"🕐 스케쥴 처리 시작 - 현재 시간(UTC): {now.isoformat()}")
    
    async with AsyncSessionLocal() as db:
        try:
            # 발송 대기 중인 스케쥴 조회 (scheduled_date <= now AND is_sent = False)
            result = await db.execute(
                select(TrainingSchedule)
                .where(TrainingSchedule.is_sent == False)
                .where(TrainingSchedule.scheduled_date <= now)
            )
            schedules = result.scalars().all()
            
            if not schedules:
                logger.debug("✅ 처리할 대기 중인 스케쥴 없음")
                return
            
            logger.info(f"📋 처리할 스케쥴: {len(schedules)}건")
            
            sent_count = 0
            failed_count = 0
            
            for schedule in schedules:
                try:
                    # 사용자 조회
                    user_result = await db.execute(
                        select(User).where(User.id == schedule.user_id)
                    )
                    user = user_result.scalar_one_or_none()
                    
                    if not user:
                        logger.warning(f"⚠️ 스케쥴 {schedule.id}: 사용자를 찾을 수 없음")
                        continue
                    
                    # 시나리오 조회
                    scenario_result = await db.execute(
                        select(PhishingScenario).where(PhishingScenario.id == schedule.scenario_id)
                    )
                    scenario = scenario_result.scalar_one_or_none()
                    
                    if not scenario:
                        logger.warning(f"⚠️ 스케쥴 {schedule.id}: 시나리오를 찾을 수 없음")
                        continue
                    
                    # 사용자 프로필 조회 (개인화용)
                    profile_result = await db.execute(
                        select(UserProfile).where(UserProfile.user_id == user.id)
                    )
                    profile = profile_result.scalar_one_or_none()
                    
                    # 시뮬레이션 결과 레코드 생성
                    sim_result = SimulationResult(
                        user_id=user.id,
                        scenario_id=scenario.id,
                        sent_at=now,
                        email_subject=scenario.subject,
                        is_defended=True  # 기본값: 방어 성공
                    )
                    db.add(sim_result)
                    await db.commit()
                    await db.refresh(sim_result)
                    
                    # 이메일 본문 개인화
                    body_html = personalize_email_body(
                        body_template=scenario.body_template or "",
                        user=user,
                        profile=profile
                    )
                    
                    # 이메일 발송
                    success = await email_service.send_phishing_email(
                        to_email=user.email,
                        subject=scenario.subject or "중요 안내",
                        body_html=body_html,
                        sender_name=scenario.sender_name or "안내",
                        simulation_id=sim_result.id,
                        dummy_page_url=scenario.dummy_page_url
                    )
                    
                    if success:
                        # 스케쥴 업데이트
                        schedule.is_sent = True
                        schedule.sent_at = now
                        await db.commit()
                        
                        logger.info(f"✅ {user.email}: 발송 완료 (제목: {schedule.title or 'N/A'})")
                        sent_count += 1
                    else:
                        logger.error(f"❌ {user.email}: 발송 실패")
                        failed_count += 1
                        
                except Exception as e:
                    logger.error(f"❌ 스케쥴 {schedule.id} 처리 오류: {e}")
                    failed_count += 1
            
            logger.info(f"📊 처리 완료: 성공 {sent_count}건, 실패 {failed_count}건")
            
        except Exception as e:
            logger.error(f"❌ 스케쥴 처리 중 오류 발생: {e}")



# APScheduler 제거됨 - GitHub Actions로 대체

def start_scheduler():
    """Deprecated: GitHub Actions로 대체됨"""
    print("⚠️ start_scheduler is deprecated. Use GitHub Actions cron instead.")

def stop_scheduler():
    """Deprecated: GitHub Actions로 대체됨"""
    pass
