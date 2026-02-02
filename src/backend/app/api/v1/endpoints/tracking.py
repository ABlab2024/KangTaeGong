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
        sim_result.submitted_fields = list(submitted_data.keys())
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
        # Return comprehensive phishing warning page if no dummy page exists
        return HTMLResponse(content="""
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚠️ 피싱/스캠 경고 - 강태공</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            min-height: 100vh;
            padding: 20px;
            color: #e0e0e0;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        
        /* 경고 헤더 */
        .warning-header {
            background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(211, 47, 47, 0.3);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.01); }
        }
        .warning-icon {
            font-size: 80px;
            margin-bottom: 20px;
        }
        .warning-header h1 {
            color: #fff;
            font-size: 2rem;
            margin-bottom: 15px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .warning-header p {
            color: rgba(255,255,255,0.9);
            font-size: 1.1rem;
            line-height: 1.6;
        }
        .training-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 20px;
            border-radius: 30px;
            margin-top: 15px;
            font-weight: bold;
            border: 2px solid rgba(255,255,255,0.5);
        }
        
        /* 섹션 스타일 */
        .section {
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .section-title {
            color: #00f3ff;
            font-size: 1.4rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section-title .icon {
            font-size: 1.6rem;
        }
        
        /* 위험성 안내 */
        .danger-list {
            list-style: none;
        }
        .danger-list li {
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        .danger-list li:last-child {
            border-bottom: none;
        }
        .danger-list .bullet {
            color: #ff5252;
            font-size: 1.2rem;
            flex-shrink: 0;
        }
        
        /* 피해 사례 카드 */
        .case-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 20px;
        }
        .case-card {
            background: linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%);
            border-radius: 12px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .case-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .case-card .case-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
        }
        .case-card h3 {
            color: #ffd54f;
            margin-bottom: 12px;
            font-size: 1.1rem;
        }
        .case-card p {
            color: #bbb;
            font-size: 0.95rem;
            line-height: 1.6;
        }
        .case-card .damage {
            margin-top: 15px;
            padding: 10px;
            background: rgba(255,82,82,0.15);
            border-radius: 8px;
            color: #ff8a80;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        /* 식별 팁 */
        .tip-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .tip-item {
            background: rgba(0,243,255,0.08);
            border-radius: 10px;
            padding: 20px;
            border-left: 4px solid #00f3ff;
        }
        .tip-item .tip-icon {
            font-size: 1.5rem;
            margin-bottom: 10px;
        }
        .tip-item h4 {
            color: #00f3ff;
            margin-bottom: 8px;
            font-size: 1rem;
        }
        .tip-item p {
            color: #aaa;
            font-size: 0.9rem;
            line-height: 1.5;
        }
        
        /* 푸터 */
        .footer {
            text-align: center;
            padding: 30px;
            color: #666;
            font-size: 0.85rem;
        }
        .footer a {
            color: #00f3ff;
            text-decoration: none;
        }
        .footer .logo {
            font-size: 1.2rem;
            font-weight: bold;
            color: #00f3ff;
            margin-bottom: 10px;
        }
        
        /* 반응형 */
        @media (max-width: 600px) {
            .warning-header { padding: 30px 20px; }
            .warning-header h1 { font-size: 1.5rem; }
            .warning-icon { font-size: 60px; }
            .section { padding: 20px; }
            .section-title { font-size: 1.2rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 경고 헤더 -->
        <div class="warning-header">
            <div class="warning-icon">🚨</div>
            <h1>잠깐! 이런 링크는 위험할 수 있습니다</h1>
            <p>방금 클릭한 링크는 피싱/스캠 공격에서 자주 사용되는 유형입니다.<br>
            실제 공격이었다면 개인정보나 금융정보가 탈취될 수 있었습니다.</p>
            <div class="training-badge">🎣 강태공 피싱 예방 훈련</div>
        </div>
        
        <!-- 왜 위험한가 -->
        <div class="section">
            <h2 class="section-title"><span class="icon">⚠️</span> 이런 링크가 왜 위험한가요?</h2>
            <ul class="danger-list">
                <li>
                    <span class="bullet">❌</span>
                    <span><strong>긴급함을 강조</strong>하며 빠른 클릭을 유도합니다. ("지금 바로 확인하세요", "계정이 정지됩니다")</span>
                </li>
                <li>
                    <span class="bullet">❌</span>
                    <span><strong>공식 사이트와 유사한 URL</strong>을 사용해 속입니다. (예: naver-login.com, samsung-event.kr)</span>
                </li>
                <li>
                    <span class="bullet">❌</span>
                    <span><strong>개인정보 입력을 요청</strong>하는 가짜 로그인 페이지로 연결됩니다.</span>
                </li>
                <li>
                    <span class="bullet">❌</span>
                    <span><strong>악성코드 설치</strong>를 유도하거나, 클릭만으로 정보를 수집할 수 있습니다.</span>
                </li>
            </ul>
        </div>
        
        <!-- 실제 피해 사례 -->
        <div class="section">
            <h2 class="section-title"><span class="icon">📋</span> 실제 피해 사례</h2>
            <div class="case-cards">
                <div class="case-card">
                    <div class="case-icon">📧</div>
                    <h3>이메일 피싱 - 은행 사칭</h3>
                    <p>"OO은행입니다. 보안 업데이트가 필요합니다"라는 이메일을 받고 링크를 클릭해 로그인 정보를 입력한 40대 직장인 A씨.</p>
                    <div class="damage">💸 피해액: 2,300만원 계좌 이체</div>
                </div>
                <div class="case-card">
                    <div class="case-icon">📱</div>
                    <h3>SMS 스미싱 - 택배 사칭</h3>
                    <p>"[CJ대한통운] 배송 주소 확인 필요"라는 문자의 링크를 클릭해 악성앱이 설치된 20대 대학생 B씨.</p>
                    <div class="damage">📱 피해: 개인정보 유출 + 소액결제 50만원</div>
                </div>
                <div class="case-card">
                    <div class="case-icon">💳</div>
                    <h3>결제 사기 - 쇼핑몰 사칭</h3>
                    <p>SNS 광고의 "90% 할인" 링크를 통해 가짜 쇼핑몰에서 결제한 30대 주부 C씨.</p>
                    <div class="damage">💳 피해: 카드정보 탈취 + 해외결제 180만원</div>
                </div>
            </div>
        </div>
        
        <!-- 피싱 식별 팁 -->
        <div class="section">
            <h2 class="section-title"><span class="icon">🛡️</span> 피싱 링크 식별하는 방법</h2>
            <div class="tip-grid">
                <div class="tip-item">
                    <div class="tip-icon">🔍</div>
                    <h4>URL 직접 확인</h4>
                    <p>링크 위에 마우스를 올려 실제 주소를 확인하세요. 공식 도메인과 다르면 의심하세요.</p>
                </div>
                <div class="tip-item">
                    <div class="tip-icon">👤</div>
                    <h4>발신자 검증</h4>
                    <p>이메일 발신자 주소가 공식 도메인(@company.com)인지 확인하세요.</p>
                </div>
                <div class="tip-item">
                    <div class="tip-icon">⏰</div>
                    <h4>긴급함 의심</h4>
                    <p>"지금 당장", "24시간 내" 등 급박함을 강조하면 일단 의심하세요.</p>
                </div>
                <div class="tip-item">
                    <div class="tip-icon">🔐</div>
                    <h4>직접 접속</h4>
                    <p>중요한 사이트는 링크 대신 직접 주소를 입력하거나 앱을 통해 접속하세요.</p>
                </div>
            </div>
        </div>
        
        <!-- 푸터 -->
        <div class="footer">
            <div class="logo">🎣 강태공 (KangTaeGong)</div>
            <p>이 페이지는 피싱 예방 훈련의 일환으로 제공되었습니다.<br>
            실제 정보는 수집되지 않았으며, 귀하의 정보는 안전합니다.</p>
        </div>
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

