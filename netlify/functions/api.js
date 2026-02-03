const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

exports.handler = async function (event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    const path = event.path;
    const cleanPath = path.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api\/v1/, '').split('?')[0];
    const method = (event.httpMethod || '').toUpperCase();

    // Debugging info (remove in production if desired)
    console.log(`[${method}] ${cleanPath}`);

    try {
        if (!supabase) throw new Error("Supabase environment variables missing");

        // --- ROUTES ---

        // 0. Base / Health
        if (cleanPath === '/' || cleanPath === '') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: "KangTaeGong JS API is running", version: "1.0.1" })
            };
        }

        // 1. Auth: Login (POST /login/email)
        if (cleanPath === '/login/email' || path.endsWith('/login/email')) {
            return await handleLoginEmail(event, headers);
        }

        // 2. Users: Get Me (GET /users/me)
        if (cleanPath === '/users/me' || path.endsWith('/users/me')) {
            return await handleGetMe(event, headers);
        }

        // 3. Survey: Categories (GET /survey/categories)
        if (cleanPath === '/survey/categories' || path.endsWith('/survey/categories')) {
            return await handleGetCategories(event, headers);
        }

        // 4. Survey: Submit (POST /survey/submit)
        if (cleanPath === '/survey/submit' || path.endsWith('/survey/submit')) {
            return await handleSubmitSurvey(event, headers);
        }

        // 5. Simulation: Stats (GET /simulation/stats)
        if (cleanPath === '/simulation/stats' || path.endsWith('/simulation/stats')) {
            return await handleGetSimulationStats(event, headers);
        }

        // 6. Threats: List (GET /threats)
        if (cleanPath === '/threats' || path.endsWith('/threats')) {
            return await handleGetThreats(event, headers);
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Endpoint Not Found", path: cleanPath, method })
        };
    } catch (err) {
        console.error("Handler Error:", err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Server Error", message: err.message })
        };
    }
};

/**
 * PARSE DATA (Body or Query)
 */
function getRequestData(event) {
    let data = {};
    if (event.body) {
        try {
            const bodyStr = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
            data = JSON.parse(bodyStr);
        } catch (e) {
            console.error("JSON Parse Error");
        }
    }
    // Merge with query params (query params overwrite body for convenience in quick testing)
    return { ...data, ...(event.queryStringParameters || {}) };
}

/**
 * AUTH HELPER
 */
async function getUserFromEvent(event) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return error ? null : user;
}

/**
 * 1. Login with Email
 */
async function handleLoginEmail(event, headers) {
    const data = getRequestData(event);
    const email = data.email;
    const age_group = data.age_group;
    const gender = data.gender;

    if (!email) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: "Email required",
                hint: "Please provide email in JSON body or query parameter '?email=...'"
            })
        };
    }

    const password = "kangtaegong_mvp_password";
    let { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        // Auto-signup
        const signUpRes = await supabase.auth.signUp({
            email,
            password,
            options: { data: { age_group, gender } }
        });
        if (signUpRes.error) return { statusCode: 400, headers, body: JSON.stringify({ error: signUpRes.error.message }) };
        authData = signUpRes.data;
    }

    // Onboarding status
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', authData.user.id)
        .single();

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            access_token: authData.session?.access_token,
            email: authData.user.email,
            user_id: authData.user.id,
            onboarding_completed: profile ? profile.onboarding_completed : false
        })
    };
}

/**
 * 2. Get Me
 */
async function handleGetMe(event, headers) {
    const user = await getUserFromEvent(event);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };
}

/**
 * 3. Get Categories
 */
async function handleGetCategories(event, headers) {
    const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };

    const grouped = data.reduce((acc, cat) => {
        const group = cat.category_group || '기타';
        if (!acc[group]) acc[group] = [];
        acc[group].push(cat);
        return acc;
    }, {});

    const result = Object.keys(grouped).map(group => ({
        group,
        categories: grouped[group]
    }));

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
    };
}

/**
 * 4. Submit Survey
 */
async function handleSubmitSurvey(event, headers) {
    const user = await getUserFromEvent(event);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

    const data = getRequestData(event);

    // Update users table
    await supabase.from('users').update({
        age_group: data.age_group,
        gender: data.gender
    }).eq('id', user.id);

    // Upsert profile
    const { data: profile, error } = await supabase
        .from('user_profiles')
        .upsert({
            user_id: user.id,
            age: data.age,
            occupation: data.occupation,
            location: data.location,
            sns_homepage: data.sns_homepage,
            recent_ai_link: data.recent_ai_link,
            content_preferences: data.content_preferences,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
    };
}

/**
 * 5. Simulation Stats
 */
async function handleGetSimulationStats(event, headers) {
    const user = await getUserFromEvent(event);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

    const { data: logs, error } = await supabase
        .from('simulation_logs')
        .select('*')
        .eq('user_id', user.id);

    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };

    const sent = logs.filter(l => l.event_type === 'SENT').length;
    const opened = logs.filter(l => l.event_type === 'OPENED').length;
    const clicked = logs.filter(l => l.event_type === 'CLICKED').length;

    const clickRate = sent > 0 ? (clicked / sent) : 0;
    const securityScore = sent > 0 ? Math.max(0, Math.floor(100 - (clickRate * 100))) : 100;

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            total_simulations: sent,
            emails_opened: opened,
            links_clicked: clicked,
            security_score: securityScore,
            click_rate: `${(clickRate * 100).toFixed(1)}%`
        })
    };
}

/**
 * 6. Get Threats
 */
async function handleGetThreats(event, headers) {
    const { data, error } = await supabase
        .from('threat_cases')
        .select('id, source_url, raw_text, collected_at')
        .order('collected_at', { ascending: false })
        .limit(20);

    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };

    const formatted = data.map(t => ({
        ...t,
        raw_text: t.raw_text ? t.raw_text.substring(0, 100) + "..." : null
    }));

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formatted)
    };
}
