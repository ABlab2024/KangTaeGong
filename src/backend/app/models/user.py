import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Column, Text
from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Optional for email-only login
    age_group = Column(String(10), nullable=True)  # 10대, 20대, 30대, etc.
    gender = Column(String(10), nullable=True)  # 남성, 여성, 기타
    preferences = Column(Text, default="[]")  # JSON string for SQLite compatibility
    security_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
