"""Simulation log model aligned with actual DB schema.

Actual DB columns:
- id: uuid
- user_id: uuid
- threat_id: uuid (FK -> threat_cases.id)
- event_type: text (SENT, OPENED, CLICKED, SUBMITTED)
- created_at: timestamp with time zone
"""
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base


class SimulationLog(Base):
    """Model for tracking phishing simulation events."""
    __tablename__ = "simulation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threat_cases.id"), nullable=True)
    event_type = Column(String, nullable=False)  # SENT, OPENED, CLICKED, SUBMITTED
    created_at = Column(DateTime, default=datetime.utcnow)
