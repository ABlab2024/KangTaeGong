import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    preferences = Column(JSONB, default=list) # List of tags/preferences
    security_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
