import { supabase, extractAction } from './utils/supabase.js';
import { jsonResponse, errorResponse, handleOptions, corsHeaders } from './utils/auth.js';

// 1x1 transparent GIF for tracking pixel
const TRACKING_PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

export const handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return handleOptions();
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    const action = extractAction(event, 'tracking');
    const simulationId = params.get('id');

    try {
        switch (action) {
            case 'open':
                return await trackOpen(simulationId);
            case 'click':
                return await trackClick(simulationId, params);
            case 'form':
                return await trackFormSubmission(simulationId, event);
            case 'time':
                return await trackTimeSpent(simulationId, event);
            case 'page':
                return await serveDummyPage(simulationId);
            default:
                return errorResponse(400, 'Invalid action');
        }
    } catch (error) {
        console.error('Tracking error:', error);
        return errorResponse(500, 'Internal server error');
    }
};

/**
 * Track email open (returns 1x1 pixel)
 */
async function trackOpen(simulationId) {
    if (simulationId) {
        // Log the open event
        await supabase
            .from('simulation_logs')
            .insert({
                user_id: null, // Will need to link via simulation_id
                event_type: 'OPENED',
            });

        // Update simulation result if exists
        await supabase
            .from('simulation_results')
            .update({
                email_opened: true,
                email_opened_at: new Date().toISOString(),
            })
            .eq('id', simulationId);
    }

    return {
        statusCode: 200,
        headers: {
            ...corsHeaders,
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
        body: TRACKING_PIXEL.toString('base64'),
        isBase64Encoded: true,
    };
}

/**
 * Track link click (redirects to dummy page)
 */
async function trackClick(simulationId, params) {
    if (simulationId) {
        // Log the click event
        await supabase
            .from('simulation_logs')
            .insert({
                user_id: null,
                event_type: 'CLICKED',
            });

        // Update simulation result
        await supabase
            .from('simulation_results')
            .update({
                link_clicked: true,
                link_clicked_at: new Date().toISOString(),
                is_defended: false,
            })
            .eq('id', simulationId);
    }

    // Redirect to dummy page or warning page
    const redirectUrl = params.get('redirect') || `/.netlify/functions/tracking?action=page&id=${simulationId}`;

    return {
        statusCode: 302,
        headers: {
            ...corsHeaders,
            'Location': redirectUrl,
        },
        body: '',
    };
}

/**
 * Track form submission on dummy page
 */
async function trackFormSubmission(simulationId, event) {
    const body = JSON.parse(event.body || '{}');

    if (simulationId) {
        await supabase
            .from('simulation_logs')
            .insert({
                user_id: null,
                event_type: 'SUBMITTED',
            });

        await supabase
            .from('simulation_results')
            .update({
                info_submitted: true,
                submitted_fields: Object.keys(body),
            })
            .eq('id', simulationId);
    }

    return jsonResponse(200, {
        message: 'Form submission tracked',
        simulation_id: simulationId,
    });
}

/**
 * Track time spent on dummy page
 */
async function trackTimeSpent(simulationId, event) {
    const body = JSON.parse(event.body || '{}');
    const seconds = body.seconds || 0;

    if (simulationId && seconds > 0) {
        // Get current time spent and add to it
        const { data: result } = await supabase
            .from('simulation_results')
            .select('time_spent_seconds')
            .eq('id', simulationId)
            .single();

        const totalSeconds = (result?.time_spent_seconds || 0) + seconds;

        await supabase
            .from('simulation_results')
            .update({ time_spent_seconds: totalSeconds })
            .eq('id', simulationId);
    }

    return jsonResponse(200, {
        message: 'Time tracked',
        seconds,
    });
}

/**
 * Serve dummy phishing page with warning
 */
async function serveDummyPage(simulationId) {
    // Get scenario info if available
    let scenarioHtml = null;
    if (simulationId) {
        const { data: result } = await supabase
            .from('simulation_results')
            .select('scenario_id, phishing_scenarios(dummy_page_html)')
            .eq('id', simulationId)
            .single();

        if (result?.phishing_scenarios?.dummy_page_html) {
            scenarioHtml = result.phishing_scenarios.dummy_page_html;
        }
    }

    const baseUrl = process.env.URL || '';
    const trackingScript = `
        <script>
            let startTime = Date.now();
            let tracked = false;
            
            // Track time spent when leaving
            window.addEventListener('beforeunload', function() {
                if (!tracked) {
                    const seconds = Math.round((Date.now() - startTime) / 1000);
                    navigator.sendBeacon(
                        '${baseUrl}/.netlify/functions/tracking?action=time&id=${simulationId}',
                        JSON.stringify({ seconds })
                    );
                    tracked = true;
                }
            });
            
            // Track form submissions
            document.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                fetch('${baseUrl}/.netlify/functions/tracking?action=form&id=${simulationId}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).then(() => {
                    document.getElementById('warning').style.display = 'block';
                    document.getElementById('form-container').style.display = 'none';
                });
            });
        </script>
    `;

    const warningHtml = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>⚠️ 피싱 훈련 알림</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .container {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 600px;
                    text-align: center;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                }
                .warning-icon {
                    font-size: 80px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #e74c3c;
                    font-size: 28px;
                    margin-bottom: 20px;
                }
                .message {
                    color: #2c3e50;
                    font-size: 16px;
                    line-height: 1.8;
                    margin-bottom: 30px;
                }
                .highlight {
                    background: #fff3cd;
                    padding: 20px;
                    border-radius: 10px;
                    border-left: 4px solid #ffc107;
                    text-align: left;
                    margin: 20px 0;
                }
                .highlight h3 {
                    color: #856404;
                    margin-bottom: 10px;
                }
                .highlight ul {
                    margin-left: 20px;
                    color: #856404;
                }
                .btn {
                    display: inline-block;
                    padding: 15px 30px;
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: bold;
                    transition: transform 0.2s;
                }
                .btn:hover { transform: scale(1.05); }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="warning-icon">🎣</div>
                <h1>이것은 피싱 훈련입니다!</h1>
                <p class="message">
                    안심하세요. 이 링크는 <strong>강태공 피싱 예방 훈련</strong>의 일부입니다.<br>
                    실제 피싱 공격이었다면, 지금 당신의 개인정보가 탈취되었을 수 있습니다.
                </p>
                
                <div class="highlight">
                    <h3>🛡️ 피싱을 피하는 방법</h3>
                    <ul>
                        <li>발신자 이메일 주소를 항상 확인하세요</li>
                        <li>긴급하다며 서두르게 하는 메시지를 의심하세요</li>
                        <li>링크 위에 마우스를 올려 실제 URL을 확인하세요</li>
                        <li>의심스러운 경우 공식 웹사이트에 직접 접속하세요</li>
                    </ul>
                </div>
                
                <a href="/dashboard" class="btn">대시보드로 돌아가기</a>
            </div>
            ${trackingScript}
        </body>
        </html>
    `;

    return {
        statusCode: 200,
        headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
        },
        body: scenarioHtml || warningHtml,
    };
}
