import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from app.db.base_class import Base

class ThreatCase(Base):
    __tablename__ = "threat_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_url = Column(String)
    raw_text = Column(Text)
    analysis_json = Column(JSONB)
    embedding = Column(Vector)
    collected_at = Column(DateTime, default=datetime.utcnow)
