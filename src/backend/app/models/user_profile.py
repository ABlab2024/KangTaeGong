import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Column, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    occupation = Column(String(100), nullable=True)
    location = Column(String(100), nullable=True)
    sns_homepage = Column(String(500), nullable=True)
    recent_ai_link = Column(String(500), nullable=True)
    content_preferences = Column(Text, default="[]")  # JSON string for SQLite
    augmented_preferences = Column(Text, default="[]")  # LLM augmented preferences
    vulnerability_analysis = Column(Text, nullable=True)  # LLM profiling result
    onboarding_completed = Column(Boolean, default=False)
    augmentation_count = Column(Integer, default=0)  # LLM augmentation iteration count
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to User
    user = relationship("User", backref="profile")


class ContentCategory(Base):
    __tablename__ = "content_categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    icon = Column(String(50), nullable=True)
    category_group = Column(String(50), nullable=True)
    display_order = Column(Integer, default=0)
