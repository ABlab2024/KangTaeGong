import { supabase, extractAction } from './utils/supabase.js';
import { getAuthenticatedUser, jsonResponse, errorResponse, handleOptions } from './utils/auth.js';

export const handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return handleOptions();
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    const action = extractAction(event, 'users');

    // Get current user
    const user = await getAuthenticatedUser(event.headers);

    try {
        switch (action) {
            case 'me':
                if (!user) return errorResponse(401, 'Not authenticated');
                return jsonResponse(200, user);
            case 'update':
                if (!user) return errorResponse(401, 'Not authenticated');
                return await updateUser(user.id, event);
            case 'ranking':
                if (!user) return errorResponse(401, 'Not authenticated');
                return await getUserRanking(user.id, user);
            default:
                return errorResponse(400, 'Invalid action');
        }
    } catch (error) {
        console.error('Users error:', error);
        return errorResponse(500, 'Internal server error');
    }
};

/**
 * Update current user
 */
async function updateUser(userId, event) {
    const body = JSON.parse(event.body || '{}');
    const { email, age_group, gender } = body;

    const updates = {};
    if (email !== undefined) updates.email = email;
    if (age_group !== undefined) updates.age_group = age_group;
    if (gender !== undefined) updates.gender = gender;

    if (Object.keys(updates).length === 0) {
        return errorResponse(400, 'No fields to update');
    }

    // Check if email is taken
    if (email) {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .neq('id', userId)
            .single();

        if (existing) {
            return errorResponse(400, 'Email already in use');
        }
    }

    const { data: user, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        return errorResponse(500, 'Failed to update user');
    }

    return jsonResponse(200, user);
}

/**
 * Get user ranking and defense stats
 */
async function getUserRanking(userId, user) {
    // Get user's simulation results
    const { data: simulations } = await supabase
        .from('simulation_results')
        .select('*')
        .eq('user_id', userId);

    const totalSims = simulations?.length || 0;
    const defendedCount = simulations?.filter(s => s.is_defended).length || 0;
    const caughtCount = totalSims - defendedCount;
    const defenseRate = totalSims > 0 ? (defendedCount / totalSims * 100) : 100.0;

    // Get last caught type
    let lastCaughtType = null;
    const caughtSims = simulations?.filter(s => !s.is_defended) || [];
    if (caughtSims.length > 0) {
        const lastSim = caughtSims.sort((a, b) =>
            new Date(b.sent_at) - new Date(a.sent_at)
        )[0];
        lastCaughtType = lastSim.email_subject || '알 수 없는 유형';
    }

    // Get user profile for vulnerability summary
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('vulnerability_summary, vulnerability_analysis')
        .eq('user_id', userId)
        .single();

    const vulnerabilitySummary = profile?.vulnerability_summary ||
        (profile?.vulnerability_analysis?.split('\n').find(l => l.trim() && !l.startsWith('#'))?.slice(0, 150) + '...' || null);

    // Calculate rankings
    const { data: allUsers } = await supabase
        .from('users')
        .select('id, security_score, age_group')
        .order('security_score', { ascending: false });

    const overallTotal = allUsers?.length || 1;
    let overallRank = 1;
    for (let i = 0; i < (allUsers?.length || 0); i++) {
        if (allUsers[i].id === userId) {
            overallRank = i + 1;
            break;
        }
    }

    // Age group ranking
    let ageGroupRank = 1;
    let ageGroupTotal = 1;
    if (user.age_group) {
        const ageGroupUsers = allUsers?.filter(u => u.age_group === user.age_group) || [];
        ageGroupTotal = ageGroupUsers.length;
        for (let i = 0; i < ageGroupUsers.length; i++) {
            if (ageGroupUsers[i].id === userId) {
                ageGroupRank = i + 1;
                break;
            }
        }
    }

    return jsonResponse(200, {
        age_group_rank: ageGroupRank,
        age_group_total: ageGroupTotal,
        overall_rank: overallRank,
        overall_total: overallTotal,
        defense_rate: Math.round(defenseRate * 10) / 10,
        caught_count: caughtCount,
        defended_count: defendedCount,
        vulnerability_summary: vulnerabilitySummary,
        last_caught_type: lastCaughtType,
    });
}
