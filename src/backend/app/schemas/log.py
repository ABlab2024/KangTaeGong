from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class LogBase(BaseModel):
    threat_id: Optional[UUID] = None
    event_type: str

class LogCreate(LogBase):
    pass

class Log(LogBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
