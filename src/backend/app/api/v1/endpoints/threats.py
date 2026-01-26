from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.threat_case import ThreatCase

router = APIRouter()

@router.get("/threats", response_model=List[Dict[str, Any]])
async def read_threats(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Retrieve threat cases.
    """
    result = await db.execute(select(ThreatCase).offset(skip).limit(limit))
    threats = result.scalars().all()
    
    return [
        {
            "id": str(threat.id),
            "source_url": threat.source_url,
            "raw_text": threat.raw_text[:100] + "..." if threat.raw_text else None,
            "collected_at": threat.collected_at,
        }
        for threat in threats
    ]
