from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
import json
from pydantic import BaseModel, EmailStr, field_validator

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    preferences: Optional[List[str]] = []

class UserUpdate(UserBase):
    password: Optional[str] = None
    preferences: Optional[List[str]] = None

class UserInDBBase(UserBase):
    id: UUID
    preferences: List[str]
    security_score: int
    created_at: datetime

    @field_validator('preferences', mode='before')
    @classmethod
    def parse_preferences(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
