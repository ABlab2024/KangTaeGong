import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    occupation = Column(String, nullable=True)
    location = Column(String, nullable=True)
    sns_homepage = Column(String, nullable=True)
    recent_ai_link = Column(String, nullable=True)
    content_preferences = Column(JSONB, default=list)
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to User
    user = relationship("User", backref="profile")


class ContentCategory(Base):
    __tablename__ = "content_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    icon = Column(String, nullable=True)
    category_group = Column(String, nullable=True)
    display_order = Column(Integer, default=0)
