import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Column, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class SimulationResult(Base):
    """개별 시뮬레이션(피싱 훈련) 결과를 저장"""
    __tablename__ = "simulation_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scenario_id = Column(String(36), ForeignKey("phishing_scenarios.id"), nullable=True)
    
    # 이메일 발송 정보
    sent_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    email_subject = Column(String(500), nullable=True)
    
    # 사용자 행동 추적
    email_opened = Column(Boolean, default=False)
    email_opened_at = Column(DateTime, nullable=True)
    link_clicked = Column(Boolean, default=False)
    link_clicked_at = Column(DateTime, nullable=True)
    time_spent_seconds = Column(Integer, default=0)  # 더미 페이지 체류 시간
    info_submitted = Column(Boolean, default=False)  # 정보 입력 여부
    submitted_fields = Column(Text, default="[]")  # 입력된 필드 목록 (JSON)
    
    # 결과 평가
    is_defended = Column(Boolean, default=True)  # True = 방어 성공, False = 속음
    
    # Relationships
    user = relationship("User", backref="simulation_results")
    scenario = relationship("PhishingScenario", backref="results")


class PhishingScenario(Base):
    """피싱 시나리오 템플릿"""
    __tablename__ = "phishing_scenarios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # 시나리오 메타데이터
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    scenario_type = Column(String(50), nullable=True)  # email, sms, etc.
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    
    # 피싱 콘텐츠
    subject = Column(String(500), nullable=True)  # 이메일 제목
    body_template = Column(Text, nullable=True)  # 이메일/문자 본문 템플릿
    sender_name = Column(String(100), nullable=True)  # 발신자명
    
    # 더미 페이지 정보
    dummy_page_url = Column(String(500), nullable=True)  # Netlify 배포 URL
    dummy_page_html = Column(Text, nullable=True)  # 더미 페이지 HTML
    
    # 출처 정보
    source_url = Column(String(500), nullable=True)  # 실제 피해 사례 링크
    is_llm_generated = Column(Boolean, default=False)  # LLM 자동 생성 여부
    
    # 상태
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TrainingSchedule(Base):
    """훈련 예정 스케줄"""
    __tablename__ = "training_schedules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scenario_id = Column(String(36), ForeignKey("phishing_scenarios.id"), nullable=True)
    title = Column(String(200), nullable=True)  # 훈련 제목
    
    scheduled_date = Column(DateTime, nullable=False)
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="training_schedules")
    scenario = relationship("PhishingScenario", backref="schedules")
