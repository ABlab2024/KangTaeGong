"""Simulation API endpoints for phishing training.

NOTE: This version is simplified to match actual DB schema.
DB columns: id, user_id, threat_id, event_type, created_at
"""
from typing import Any, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.log import SimulationLog
from app.models.threat_case import ThreatCase
from app.api import deps
from app.services.email_service import (
    generate_tracking_token,
    render_phishing_email,
    send_phishing_email,
    PHISHING_SCENARIOS
)

router = APIRouter()


class SimulationRequest(BaseModel):
    """Request model for sending phishing simulation."""
    scenario: str = "password_reset"
    threat_id: Optional[UUID] = None
    custom_subject: Optional[str] = None
    custom_message: Optional[str] = None


class SimulationResponse(BaseModel):
    """Response model for simulation result."""
    success: bool
    message: str
    simulation_id: Optional[str] = None


@router.get("/simulation/scenarios")
async def list_scenarios() -> Any:
    """List available phishing scenarios."""
    return {
        "scenarios": [
            {"id": key, "subject": val["subject"], "from_name": val["from_name"]}
            for key, val in PHISHING_SCENARIOS.items()
        ]
    }


@router.post("/simulation/send", response_model=SimulationResponse)
async def send_simulation(
    request: SimulationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Send a phishing simulation email to the current user."""
    
    scenario = PHISHING_SCENARIOS.get(request.scenario)
    if not scenario:
        raise HTTPException(status_code=400, detail="Invalid scenario")
    
    # Generate tracking token for email links
    tracking_token = generate_tracking_token()
    
    # Get recipient name from email
    recipient_name = current_user.email.split("@")[0]
    
    # Render email content
    html_content = render_phishing_email(
        template_name=scenario["template"],
        recipient_name=recipient_name,
        tracking_token=tracking_token,
        message=request.custom_message
    )
    
    subject = request.custom_subject or scenario["subject"]
    
    # Send email
    success = await send_phishing_email(
        to_email=current_user.email,
        subject=subject,
        html_content=html_content,
        from_name=scenario["from_name"]
    )
    
    if success:
        # Log the simulation
        log = SimulationLog(
            user_id=current_user.id,
            threat_id=request.threat_id,
            event_type="SENT"
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        
        return SimulationResponse(
            success=True,
            message="Simulation email sent successfully",
            simulation_id=str(log.id)
        )
    else:
        return SimulationResponse(
            success=False,
            message="Failed to send email. Check SMTP configuration."
        )


@router.get("/simulation/track/{token}")
async def track_click(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Track when a user clicks the phishing link.
    
    Note: Without metadata column, tracking is limited.
    In production, consider adding a tracking_tokens table.
    """
    # Just redirect to training page - full tracking needs schema update
    return RedirectResponse(
        url="/training-complete?clicked=true",
        status_code=302
    )


@router.get("/simulation/pixel/{token}.png")
async def track_open(
    token: str,
    db: AsyncSession = Depends(get_db)
) -> Response:
    """Track when a user opens the email (via tracking pixel).
    
    Note: Without metadata column, tracking is limited.
    """
    # Return 1x1 transparent PNG
    PIXEL = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    return Response(content=PIXEL, media_type="image/png")


@router.get("/simulation/stats")
async def get_simulation_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Get simulation statistics for the current user."""
    
    result = await db.execute(
        select(SimulationLog).where(SimulationLog.user_id == current_user.id)
    )
    logs = result.scalars().all()
    
    sent_count = sum(1 for log in logs if log.event_type == "SENT")
    opened_count = sum(1 for log in logs if log.event_type == "OPENED")
    clicked_count = sum(1 for log in logs if log.event_type == "CLICKED")
    
    # Calculate security score (lower clicks = higher score)
    if sent_count > 0:
        click_rate = clicked_count / sent_count
        security_score = max(0, int(100 - (click_rate * 100)))
    else:
        security_score = 100
    
    return {
        "total_simulations": sent_count,
        "emails_opened": opened_count,
        "links_clicked": clicked_count,
        "security_score": security_score,
        "click_rate": f"{(clicked_count / sent_count * 100):.1f}%" if sent_count > 0 else "0%"
    }
