import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class Log(Base):
    __tablename__ = "simulation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threat_cases.id"), nullable=True) # Can be null if it's a general system event
    event_type = Column(String, nullable=False) # e.g., 'SENT', 'CLICKED', 'OPENED'
    created_at = Column(DateTime, default=datetime.utcnow)
