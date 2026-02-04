import { supabase, extractAction } from './utils/supabase.js';
import { getAuthenticatedUser, jsonResponse, errorResponse, handleOptions, ADMIN_EMAIL, ADMIN_PASSWORD } from './utils/auth.js';
import { generatePhishingScenario } from './utils/gemini.js';
import { sendPhishingEmail, renderPhishingEmail, generateTrackingToken } from './utils/email.js';

export const handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return handleOptions();
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    const action = extractAction(event, 'admin');

    try {
        switch (action) {
            case 'login':
                return await adminLogin(event);
            case 'users':
                return await getUsers(params);
            case 'schedule':
                if (event.httpMethod === 'GET') return await getSchedule(params);
                if (event.httpMethod === 'POST') return await createSchedule(event);
                break;
            case 'update-schedule':
                return await updateSchedule(event, params);
            case 'delete-schedule':
                return await deleteSchedule(params);
            case 'scenarios':
                return await getScenarioPreviews();
            case 'generate-scenario':
                return await generateScenario(event, params);
            case 'scenario-detail':
                return await getScenarioDetail(params);
            case 'update-scenario':
                return await updateScenario(event, params);
            case 'send-simulation':
                return await sendSimulationToUsers(event);
            case 'stats':
                return await getStatistics();
            case 'scenario-stats':
                return await getScenarioStats();
            case 'next-training-period':
                return getNextTrainingPeriod();
            default:
                return errorResponse(400, 'Invalid action');
        }
    } catch (error) {
        console.error('Admin error:', error);
        return errorResponse(500, 'Internal server error');
    }
};

/**
 * Admin login
 */
async function adminLogin(event) {
    let body = {};
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        const params = new URLSearchParams(event.queryStringParameters || {});
        body = {
            email: params.get('email'),
            password: params.get('password'),
        };
    }

    const { email, password } = body;

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return errorResponse(401, 'Invalid admin credentials');
    }

    return jsonResponse(200, {
        is_admin: true,
        email: ADMIN_EMAIL,
        redirect_to: '/admin/dashboard',
    });
}

/**
 * Get all users
 */
async function getUsers(params) {
    const skip = parseInt(params.get('skip') || '0');
    const limit = parseInt(params.get('limit') || '100');

    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id, email, age_group, gender, security_score, created_at,
            user_profiles(onboarding_completed)
        `)
        .order('created_at', { ascending: false })
        .range(skip, skip + limit - 1);

    if (error) {
        return errorResponse(500, 'Failed to fetch users');
    }

    const result = users?.map(u => ({
        id: u.id,
        email: u.email,
        age_group: u.age_group,
        gender: u.gender,
        security_score: u.security_score,
        onboarding_completed: u.user_profiles?.[0]?.onboarding_completed || false,
        created_at: u.created_at,
    })) || [];

    return jsonResponse(200, result);
}

/**
 * Get training schedules
 */
async function getSchedule(params) {
    const includeSent = params.get('include_sent') === 'true';

    let query = supabase
        .from('training_schedules')
        .select(`
            id, scheduled_date, is_sent, sent_at, title, created_at,
            users(email),
            phishing_scenarios(name)
        `)
        .order('scheduled_date', { ascending: true });

    if (!includeSent) {
        query = query.eq('is_sent', false);
    }

    const { data: schedules, error } = await query;

    if (error) {
        return errorResponse(500, 'Failed to fetch schedules');
    }

    const result = schedules?.map(s => ({
        id: s.id,
        user_email: s.users?.email || 'Unknown',
        scheduled_date: s.scheduled_date,
        scenario_name: s.phishing_scenarios?.name,
        title: s.title,
        is_sent: s.is_sent,
    })) || [];

    return jsonResponse(200, result);
}

/**
 * Create training schedule
 */
async function createSchedule(event) {
    const body = JSON.parse(event.body || '{}');
    const { user_ids, scenario_id, scheduled_date, title } = body;

    if (!user_ids || !scenario_id || !scheduled_date) {
        return errorResponse(400, 'user_ids, scenario_id, and scheduled_date are required');
    }

    const schedules = user_ids.map(userId => ({
        user_id: userId,
        scenario_id,
        scheduled_date,
        title,
        is_sent: false,
    }));

    const { data, error } = await supabase
        .from('training_schedules')
        .insert(schedules)
        .select();

    if (error) {
        return errorResponse(500, 'Failed to create schedules');
    }

    return jsonResponse(201, {
        message: `${data.length} schedules created`,
        schedules: data,
    });
}

/**
 * Update training schedule
 */
async function updateSchedule(event, params) {
    const scheduleId = params.get('id');
    if (!scheduleId) {
        return errorResponse(400, 'Schedule ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const { scheduled_date, scenario_id, title } = body;

    // Check if already sent
    const { data: existing } = await supabase
        .from('training_schedules')
        .select('is_sent')
        .eq('id', scheduleId)
        .single();

    if (existing?.is_sent) {
        return errorResponse(400, 'Cannot modify a sent schedule');
    }

    const updates = {};
    if (scheduled_date) updates.scheduled_date = scheduled_date;
    if (scenario_id) updates.scenario_id = scenario_id;
    if (title !== undefined) updates.title = title;

    const { data, error } = await supabase
        .from('training_schedules')
        .update(updates)
        .eq('id', scheduleId)
        .select()
        .single();

    if (error) {
        return errorResponse(500, 'Failed to update schedule');
    }

    return jsonResponse(200, data);
}

/**
 * Delete training schedule
 */
async function deleteSchedule(params) {
    const scheduleId = params.get('id');
    if (!scheduleId) {
        return errorResponse(400, 'Schedule ID is required');
    }

    // Check if already sent
    const { data: existing } = await supabase
        .from('training_schedules')
        .select('is_sent')
        .eq('id', scheduleId)
        .single();

    if (existing?.is_sent) {
        return errorResponse(400, 'Cannot delete a sent schedule');
    }

    const { error } = await supabase
        .from('training_schedules')
        .delete()
        .eq('id', scheduleId);

    if (error) {
        return errorResponse(500, 'Failed to delete schedule');
    }

    return jsonResponse(200, { message: 'Schedule deleted' });
}

/**
 * Get scenario previews
 */
async function getScenarioPreviews() {
    const { data: scenarios, error } = await supabase
        .from('phishing_scenarios')
        .select('id, name, subject, body_template, difficulty')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        return errorResponse(500, 'Failed to fetch scenarios');
    }

    const result = scenarios?.map(s => ({
        id: s.id,
        name: s.name,
        subject: s.subject,
        body_preview: s.body_template?.substring(0, 200) + '...',
        difficulty: s.difficulty || 'medium',
    })) || [];

    return jsonResponse(200, result);
}

/**
 * Generate scenario with AI
 */
async function generateScenario(event, params) {
    const mode = params.get('mode') || 'preference';
    const sourceUrl = params.get('source_url');
    const prompt = params.get('prompt');

    let body = {};
    try {
        body = JSON.parse(event.body || '{}');
    } catch { }

    const targetPreferences = body.target_preferences || [];

    const scenario = await generatePhishingScenario(targetPreferences, sourceUrl);

    if (!scenario) {
        return errorResponse(500, 'Failed to generate scenario');
    }

    // Save to database
    const { data: saved, error } = await supabase
        .from('phishing_scenarios')
        .insert({
            name: scenario.name,
            description: scenario.description,
            scenario_type: scenario.scenario_type || 'email',
            difficulty: scenario.difficulty || 'medium',
            subject: scenario.subject,
            body_template: scenario.body_template,
            sender_name: scenario.sender_name,
            source_url: sourceUrl,
            is_llm_generated: true,
            is_active: true,
        })
        .select()
        .single();

    if (error) {
        return errorResponse(500, 'Failed to save scenario');
    }

    return jsonResponse(201, saved);
}

/**
 * Get scenario detail
 */
async function getScenarioDetail(params) {
    const scenarioId = params.get('id');
    if (!scenarioId) {
        return errorResponse(400, 'Scenario ID is required');
    }

    const { data: scenario, error } = await supabase
        .from('phishing_scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();

    if (error || !scenario) {
        return errorResponse(404, 'Scenario not found');
    }

    return jsonResponse(200, scenario);
}

/**
 * Update scenario
 */
async function updateScenario(event, params) {
    const scenarioId = params.get('id');
    if (!scenarioId) {
        return errorResponse(400, 'Scenario ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const allowedFields = ['name', 'description', 'subject', 'body_template', 'sender_name', 'difficulty', 'is_active'];

    const updates = {};
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('phishing_scenarios')
        .update(updates)
        .eq('id', scenarioId)
        .select()
        .single();

    if (error) {
        return errorResponse(500, 'Failed to update scenario');
    }

    return jsonResponse(200, data);
}

/**
 * Send simulation to users
 */
async function sendSimulationToUsers(event) {
    const body = JSON.parse(event.body || '{}');
    const { user_ids, scenario_id, scheduled_date } = body;

    // Get scenario
    const { data: scenario } = await supabase
        .from('phishing_scenarios')
        .select('*')
        .eq('id', scenario_id)
        .single();

    if (!scenario) {
        return errorResponse(404, 'Scenario not found');
    }

    // Get users
    let usersQuery = supabase.from('users').select('*');
    if (user_ids && user_ids.length > 0) {
        usersQuery = usersQuery.in('id', user_ids);
    }

    const { data: users } = await usersQuery;

    if (!users || users.length === 0) {
        return errorResponse(400, 'No users found');
    }

    let sentCount = 0;
    const results = [];

    for (const user of users) {
        const trackingToken = generateTrackingToken();
        const recipientName = user.email.split('@')[0];

        const htmlContent = scenario.body_template || renderPhishingEmail(
            'password_reset',
            recipientName,
            trackingToken
        );

        const success = await sendPhishingEmail({
            toEmail: user.email,
            subject: scenario.subject,
            bodyHtml: htmlContent,
            senderName: scenario.sender_name || 'Training Center',
        });

        if (success) {
            // Create simulation result
            await supabase
                .from('simulation_results')
                .insert({
                    user_id: user.id,
                    scenario_id: scenario.id,
                    sent_at: new Date().toISOString(),
                    email_subject: scenario.subject,
                    is_defended: true, // Default to defended until clicked
                });

            sentCount++;
        }

        results.push({
            user_id: user.id,
            email: user.email,
            sent: success,
        });
    }

    return jsonResponse(200, {
        message: `Sent to ${sentCount}/${users.length} users`,
        results,
    });
}

/**
 * Get training statistics
 */
async function getStatistics() {
    // Total users
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    // Simulation results
    const { data: simulations } = await supabase
        .from('simulation_results')
        .select('is_defended, user_id, users(age_group, gender)');

    const totalSimulations = simulations?.length || 0;
    const totalDefended = simulations?.filter(s => s.is_defended).length || 0;
    const totalFailed = totalSimulations - totalDefended;
    const defenseRate = totalSimulations > 0 ? (totalDefended / totalSimulations * 100) : 0;

    // Stats by age group
    const statsByAgeGroup = {};
    const statsByGender = {};

    for (const sim of simulations || []) {
        const ageGroup = sim.users?.age_group || '미분류';
        const gender = sim.users?.gender || '미분류';

        if (!statsByAgeGroup[ageGroup]) {
            statsByAgeGroup[ageGroup] = { total: 0, defended: 0 };
        }
        statsByAgeGroup[ageGroup].total++;
        if (sim.is_defended) statsByAgeGroup[ageGroup].defended++;

        if (!statsByGender[gender]) {
            statsByGender[gender] = { total: 0, defended: 0 };
        }
        statsByGender[gender].total++;
        if (sim.is_defended) statsByGender[gender].defended++;
    }

    return jsonResponse(200, {
        total_users: totalUsers || 0,
        total_simulations: totalSimulations,
        total_defended: totalDefended,
        total_failed: totalFailed,
        defense_rate: Math.round(defenseRate * 10) / 10,
        stats_by_age_group: statsByAgeGroup,
        stats_by_gender: statsByGender,
        stats_by_preference: {},
    });
}

/**
 * Get scenario-based statistics
 */
async function getScenarioStats() {
    const { data: simulations } = await supabase
        .from('simulation_results')
        .select('scenario_id, is_defended, phishing_scenarios(name)');

    const stats = {};
    for (const sim of simulations || []) {
        const scenarioName = sim.phishing_scenarios?.name || 'Unknown';
        if (!stats[scenarioName]) {
            stats[scenarioName] = { total: 0, defended: 0, failed: 0 };
        }
        stats[scenarioName].total++;
        if (sim.is_defended) {
            stats[scenarioName].defended++;
        } else {
            stats[scenarioName].failed++;
        }
    }

    return jsonResponse(200, stats);
}

/**
 * Get next training period
 */
function getNextTrainingPeriod() {
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
    nextMonday.setHours(9, 0, 0, 0);

    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);
    nextFriday.setHours(18, 0, 0, 0);

    return jsonResponse(200, {
        start_date: nextMonday.toISOString(),
        end_date: nextFriday.toISOString(),
        description: `${nextMonday.toLocaleDateString('ko-KR')} ~ ${nextFriday.toLocaleDateString('ko-KR')}`,
    });
}
