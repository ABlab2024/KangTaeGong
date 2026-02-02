import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Column
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base


class ThreatCase(Base):
    """AI Agent 수집 피싱/보이스피싱 위협 사례"""
    __tablename__ = "threat_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_url = Column(String(500), nullable=True)
    raw_text = Column(Text, nullable=True)
    analysis_json = Column(Text, nullable=True)  # JSON string for SQLite compatibility
    embedding = Column(Text, nullable=True)  # JSON array string for SQLite compatibility
    collected_at = Column(DateTime, default=datetime.utcnow)
