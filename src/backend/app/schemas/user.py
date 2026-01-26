from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr

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

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
