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
    // Handle various path styles
    let cleanPath = path
        .replace(/^\/\.netlify\/functions\/api/, '')
        .replace(/^\/api\/v1/, '')
        .split('?')[0];

    // Ensure cleanPath starts with /
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

    const method = (event.httpMethod || '').toUpperCase();

    try {
        if (!supabase) throw new Error("Supabase environment variables (SUPABASE_URL, SUPABASE_KEY) are missing in Netlify settings.");

        // --- ROUTES ---

        // Health check
        if (cleanPath === '/' || cleanPath === '/health') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: "ok", engine: "JS Serverless", timestamp: new Date().toISOString() })
            };
        }

        // Login
        if (cleanPath === '/login/email') {
            return await handleLoginEmail(event, headers);
        }

        // Users
        if (cleanPath === '/users/me') {
            return await handleGetMe(event, headers);
        }

        // Survey
        if (cleanPath === '/survey/categories') {
            return await handleGetCategories(event, headers);
        }
        if (cleanPath === '/survey/submit') {
            return await handleSubmitSurvey(event, headers);
        }

        // Simulation
        if (cleanPath === '/simulation/stats') {
            return await handleGetSimulationStats(event, headers);
        }

        // Threats
        if (cleanPath === '/threats') {
            return await handleGetThreats(event, headers);
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                error: "Endpoint Not Found",
                requested_path: cleanPath,
                actual_path: path
            })
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
 * Robust Data Parsing
 */
function getRequestData(event) {
    let data = {};

    // 1. Parse Body
    if (event.body) {
        try {
            const bodyStr = event.isBase64Encoded
                ? Buffer.from(event.body, 'base64').toString()
                : event.body;

            // Try JSON
            try {
                data = JSON.parse(bodyStr);
            } catch (e) {
                // Try URL encoded if JSON fails
                const params = new URLSearchParams(bodyStr);
                params.forEach((value, key) => {
                    data[key] = value;
                });
            }
        } catch (e) {
            console.error("Body parse error:", e);
        }
    }

    // 2. Merge with Query Parameters (overwrites body for easy testing)
    const query = event.queryStringParameters || {};
    return { ...data, ...query };
}

async function getUserFromEvent(event) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return error ? null : user;
}

/**
 * 1. Login with Email (POST /login/email)
 */
async function handleLoginEmail(event, headers) {
    const data = getRequestData(event);
    const email = data.email;

    if (!email) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: "Email required",
                debug: {
                    received_method: event.httpMethod,
                    received_data: data,
                    content_type: event.headers['content-type'] || 'none'
                },
                hint: "Ensure you are sending 'email' in the JSON body or as a query parameter '?email=...'"
            })
        };
    }

    const password = "kangtaegong_mvp_password";
    let { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        // Auto-signup if user doesn't exist
        const signUpRes = await supabase.auth.signUp({
            email,
            password,
            options: { data: { age_group: data.age_group, gender: data.gender } }
        });
        if (signUpRes.error) return { statusCode: 400, headers, body: JSON.stringify({ error: signUpRes.error.message }) };
        authData = signUpRes.data;
    }

    // Check onboarding status
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
            onboarding_completed: profile ? !!profile.onboarding_completed : false
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
