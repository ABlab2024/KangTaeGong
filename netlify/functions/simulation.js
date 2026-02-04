import { supabase, extractAction } from './utils/supabase.js';
import { getAuthenticatedUser, jsonResponse, errorResponse, handleOptions } from './utils/auth.js';
import {
    PHISHING_SCENARIOS,
    generateTrackingToken,
    renderPhishingEmail,
    sendPhishingEmail
} from './utils/email.js';

export const handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return handleOptions();
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    const action = extractAction(event, 'simulation');

    try {
        switch (action) {
            case 'scenarios':
                return getScenarios();
            case 'send':
                return await sendSimulation(event);
            case 'stats':
                return await getStats(event);
            default:
                return errorResponse(400, 'Invalid action');
        }
    } catch (error) {
        console.error('Simulation error:', error);
        return errorResponse(500, 'Internal server error');
    }
};

/**
 * List available phishing scenarios
 */
function getScenarios() {
    return jsonResponse(200, {
        scenarios: Object.entries(PHISHING_SCENARIOS).map(([key, val]) => ({
            id: key,
            subject: val.subject,
            from_name: val.from_name,
        })),
    });
}

/**
 * Send a phishing simulation email
 */
async function sendSimulation(event) {
    const user = await getAuthenticatedUser(event.headers);
    if (!user) {
        return errorResponse(401, 'Not authenticated');
    }

    const body = JSON.parse(event.body || '{}');
    const { scenario = 'password_reset', threat_id, custom_subject, custom_message } = body;

    const scenarioData = PHISHING_SCENARIOS[scenario];
    if (!scenarioData) {
        return errorResponse(400, 'Invalid scenario');
    }

    const trackingToken = generateTrackingToken();
    const recipientName = user.email.split('@')[0];

    const htmlContent = renderPhishingEmail(
        scenarioData.template,
        recipientName,
        trackingToken,
        custom_message
    );

    const subject = custom_subject || scenarioData.subject;

    const success = await sendPhishingEmail({
        toEmail: user.email,
        subject,
        bodyHtml: htmlContent,
        senderName: scenarioData.from_name,
    });

    if (success) {
        // Log the simulation
        const { data: log, error } = await supabase
            .from('simulation_logs')
            .insert({
                user_id: user.id,
                threat_id,
                event_type: 'SENT',
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to log simulation:', error);
        }

        return jsonResponse(200, {
            success: true,
            message: 'Simulation email sent successfully',
            simulation_id: log?.id || trackingToken,
        });
    } else {
        return jsonResponse(200, {
            success: false,
            message: 'Failed to send email. Check SMTP configuration.',
        });
    }
}

/**
 * Get simulation statistics for the current user
 */
async function getStats(event) {
    const user = await getAuthenticatedUser(event.headers);
    if (!user) {
        return errorResponse(401, 'Not authenticated');
    }

    const { data: logs } = await supabase
        .from('simulation_logs')
        .select('*')
        .eq('user_id', user.id);

    const sentCount = logs?.filter(log => log.event_type === 'SENT').length || 0;
    const openedCount = logs?.filter(log => log.event_type === 'OPENED').length || 0;
    const clickedCount = logs?.filter(log => log.event_type === 'CLICKED').length || 0;

    let securityScore = 100;
    if (sentCount > 0) {
        const clickRate = clickedCount / sentCount;
        securityScore = Math.max(0, Math.round(100 - (clickRate * 100)));
    }

    return jsonResponse(200, {
        total_simulations: sentCount,
        emails_opened: openedCount,
        links_clicked: clickedCount,
        security_score: securityScore,
        click_rate: sentCount > 0 ? `${(clickedCount / sentCount * 100).toFixed(1)}%` : '0%',
    });
}
