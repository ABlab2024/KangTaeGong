"""Simulation log model for SQLite compatibility.

Columns:
- id: TEXT(36) - UUID string
- user_id: TEXT(36) - FK -> users.id
- threat_id: TEXT(36) - FK -> threat_cases.id
- event_type: TEXT (SENT, OPENED, CLICKED, SUBMITTED)
- created_at: DATETIME
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
    event_type = Column(String(50), nullable=False)  # SENT, OPENED, CLICKED, SUBMITTED
    created_at = Column(DateTime, default=datetime.utcnow)
