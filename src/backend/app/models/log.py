"""Simulation log model with metadata support."""
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base_class import Base


class SimulationLog(Base):
    """Model for tracking phishing simulation events."""
    __tablename__ = "simulation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threat_cases.id"), nullable=True)
    event_type = Column(String, nullable=False)  # SENT, OPENED, CLICKED, SUBMITTED
    tracking_token = Column(String, index=True, nullable=True)  # For linking events
    metadata = Column(JSONB, default=dict)  # {device, ip, user_agent, stay_time_sec}
    created_at = Column(DateTime, default=datetime.utcnow)
