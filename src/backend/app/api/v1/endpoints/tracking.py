"""
Tracking endpoints for phishing simulation.
Handles email open tracking, link click tracking, and form submission tracking.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Response, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.simulation import SimulationResult

router = APIRouter()


# 1x1 transparent GIF pixel
TRACKING_PIXEL = bytes([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
    0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
    0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
    0x01, 0x00, 0x3b
])


@router.get("/open/{simulation_id}")
async def track_email_open(
    simulation_id: str,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """이메일 열람 추적 (1x1 픽셀 이미지 반환)"""
    # Update simulation result
    result = await db.execute(
        select(SimulationResult).where(SimulationResult.id == simulation_id)
    )
    sim_result = result.scalar_one_or_none()
    
    if sim_result and not sim_result.email_opened:
        sim_result.email_opened = True
        sim_result.email_opened_at = datetime.utcnow()
        await db.commit()
    
    return Response(
        content=TRACKING_PIXEL,
        media_type="image/gif",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


@router.get("/click/{simulation_id}")
async def track_link_click(
    simulation_id: str,
    redirect: str = Query(..., description="Redirect URL after tracking"),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """링크 클릭 추적 후 더미 페이지로 리다이렉트"""
    # Update simulation result
    result = await db.execute(
        select(SimulationResult).where(SimulationResult.id == simulation_id)
    )
    sim_result = result.scalar_one_or_none()
    
    if sim_result:
        sim_result.link_clicked = True
        sim_result.link_clicked_at = datetime.utcnow()
        sim_result.is_defended = False  # User clicked the phishing link
        await db.commit()
    
    return RedirectResponse(url=redirect, status_code=302)


@router.post("/submit/{simulation_id}")
async def track_form_submission(
    simulation_id: str,
    submitted_data: dict,
    db: AsyncSession = Depends(get_db),
):
    """더미 페이지에서 정보 입력 추적"""
    import json
    
    result = await db.execute(
        select(SimulationResult).where(SimulationResult.id == simulation_id)
    )
    sim_result = result.scalar_one_or_none()
    
    if sim_result:
        sim_result.info_submitted = True
        sim_result.submitted_fields = json.dumps(list(submitted_data.keys()), ensure_ascii=False)
        sim_result.is_defended = False
        await db.commit()
    
    return {"status": "tracked", "message": "이것은 피싱 훈련이었습니다. 실제 정보는 수집되지 않았습니다."}


@router.post("/time/{simulation_id}")
async def track_time_spent(
    simulation_id: str,
    seconds: int,
    db: AsyncSession = Depends(get_db),
):
    """더미 페이지 체류 시간 추적"""
    result = await db.execute(
        select(SimulationResult).where(SimulationResult.id == simulation_id)
    )
    sim_result = result.scalar_one_or_none()
    
    if sim_result:
        sim_result.time_spent_seconds = seconds
        await db.commit()
    
    return {"status": "tracked"}
