import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Column, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Optional for email-only login
    age_group = Column(String(10), nullable=True)  # 10대, 20대, 30대, etc.
    gender = Column(String(10), nullable=True)  # 남성, 여성, 기타
    preferences = Column(JSONB, default=list)  # JSONB for Postgres
    security_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
