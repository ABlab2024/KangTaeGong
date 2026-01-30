"""
Tracking endpoints for phishing simulation.
Handles email open tracking, link click tracking, and form submission tracking.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Response, Query
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.simulation import SimulationResult, PhishingScenario

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


# JavaScript tracking code to be injected into dummy pages
TRACKING_SCRIPT_TEMPLATE = """
<script>
(function() {
    const SIMULATION_ID = '{simulation_id}';
    const API_BASE = '{api_base}';
    let startTime = Date.now();
    
    // Track time spent on page
    function sendTimeSpent() {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        navigator.sendBeacon(API_BASE + '/api/v1/track/time/' + SIMULATION_ID + '?seconds=' + seconds);
    }
    
    // Send time on page unload
    window.addEventListener('beforeunload', sendTimeSpent);
    
    // Also send periodically (every 30 seconds)
    setInterval(function() {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        fetch(API_BASE + '/api/v1/track/time/' + SIMULATION_ID + '?seconds=' + seconds, {
            method: 'POST',
            keepalive: true
        }).catch(function() {});
    }, 30000);
    
    // Intercept form submissions
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {};
        formData.forEach(function(value, key) {
            data[key] = '[REDACTED]';  // Don't actually capture values
        });
        
        fetch(API_BASE + '/api/v1/track/submit/' + SIMULATION_ID, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        }).then(function(response) {
            return response.json();
        }).then(function(result) {
            // Show training message
            document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;"><div style="text-align:center;padding:40px;background:white;border-radius:10px;box-shadow:0 4px 6px rgba(0,0,0,0.1);max-width:500px;"><h1 style="color:#e74c3c;">⚠️ 피싱 훈련</h1><p style="font-size:18px;color:#333;">' + result.message + '</p><p style="color:#666;margin-top:20px;">입력하신 정보는 저장되지 않았습니다.</p></div></div>';
        }).catch(function(err) {
            console.error('Tracking error:', err);
        });
    }, true);
})();
</script>
"""


@router.get("/page/{simulation_id}")
async def serve_dummy_page(
    simulation_id: str,
    db: AsyncSession = Depends(get_db),
) -> HTMLResponse:
    """더미 피싱 페이지를 제공합니다. 트래킹 스크립트가 자동 삽입됩니다."""
    # Get simulation result
    result = await db.execute(
        select(SimulationResult).where(SimulationResult.id == simulation_id)
    )
    sim_result = result.scalar_one_or_none()
    
    if not sim_result:
        return HTMLResponse(
            content="<html><body><h1>페이지를 찾을 수 없습니다.</h1></body></html>",
            status_code=404
        )
    
    # Get scenario with dummy page HTML
    scenario_result = await db.execute(
        select(PhishingScenario).where(PhishingScenario.id == sim_result.scenario_id)
    )
    scenario = scenario_result.scalar_one_or_none()
    
    if not scenario or not scenario.dummy_page_html:
        # Return default training page if no dummy page exists
        return HTMLResponse(content="""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>확인 페이지</title>
    <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; }
        .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 400px; text-align: center; }
        h1 { color: #e74c3c; }
        p { color: #333; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ 피싱 훈련 알림</h1>
        <p>이 페이지는 피싱 예방 훈련의 일환입니다.</p>
        <p>실제 피싱 사이트였다면 귀하의 정보가 탈취될 수 있었습니다.</p>
        <p style="margin-top: 20px; color: #666;">항상 링크를 클릭하기 전에 발신자와 URL을 확인하세요.</p>
    </div>
</body>
</html>
        """, status_code=200)
    
    # Get API base URL (for tracking script)
    from app.core.config import settings
    # Use request host or default
    api_base = "http://localhost:8002"  # TODO: Get from request or config
    
    # Inject tracking script into HTML
    html_content = scenario.dummy_page_html
    tracking_script = TRACKING_SCRIPT_TEMPLATE.format(
        simulation_id=simulation_id,
        api_base=api_base
    )
    
    # Inject before </body> or at end
    if "</body>" in html_content.lower():
        html_content = html_content.replace("</body>", tracking_script + "</body>")
        html_content = html_content.replace("</BODY>", tracking_script + "</BODY>")
    else:
        html_content = html_content + tracking_script
    
    return HTMLResponse(content=html_content, status_code=200)

