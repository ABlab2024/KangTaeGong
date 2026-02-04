import { supabase } from './utils/supabase.js';
import { jsonResponse, errorResponse, handleOptions, ADMIN_EMAIL, ADMIN_PASSWORD } from './utils/auth.js';

/**
 * Auth function - minimal for Supabase Auth
 * Most auth is handled client-side with Supabase SDK
 * This function handles admin login and user sync
 */
export const handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return handleOptions();
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    const action = params.get('action');

    try {
        switch (action) {
            case 'admin-login':
                return await adminLogin(event);
            case 'sync-user':
                return await syncUser(event);
            default:
                return errorResponse(400, 'Invalid action. Use Supabase client for user auth.');
        }
    } catch (error) {
        console.error('Auth error:', error);
        return errorResponse(500, 'Internal server error');
    }
};

/**
 * Admin login (separate from Supabase Auth)
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

    // Admin uses a simple flag, actual session is managed by Supabase
    return jsonResponse(200, {
        is_admin: true,
        email: ADMIN_EMAIL,
        redirect_to: '/admin/dashboard',
    });
}

/**
 * Sync Supabase Auth user with app users table
 * Called after successful Supabase login on frontend
 */
async function syncUser(event) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(401, 'No authorization token');
    }

    const token = authHeader.substring(7);

    // Verify with Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
        return errorResponse(401, 'Invalid token');
    }

    // Get body for additional data
    let body = {};
    try {
        body = JSON.parse(event.body || '{}');
    } catch { }

    const { age_group, gender } = body;

    // Check if user exists in our table
    let { data: appUser } = await supabase
        .from('users')
        .select('*, user_profiles(*)')
        .eq('email', supabaseUser.email)
        .single();

    if (!appUser) {
        // Create new user in app table
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                email: supabaseUser.email,
                supabase_user_id: supabaseUser.id,
                age_group,
                gender,
                hashed_password: null,
                preferences: [],
                security_score: 0,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return errorResponse(500, 'Failed to create user');
        }
        appUser = newUser;
    } else if (!appUser.supabase_user_id) {
        // Link existing user to Supabase
        await supabase
            .from('users')
            .update({ supabase_user_id: supabaseUser.id })
            .eq('id', appUser.id);
    }

    // Check onboarding status
    const profile = appUser.user_profiles?.[0];
    const onboardingCompleted = profile?.onboarding_completed || false;

    return jsonResponse(200, {
        user_id: appUser.id,
        email: appUser.email,
        supabase_user_id: supabaseUser.id,
        onboarding_completed: onboardingCompleted,
        redirect_to: onboardingCompleted ? '/dashboard' : '/onboarding',
    });
}
