const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Admin Credentials from ENV
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const adminToken = "super-admin-secret-token"; // Simple token for MVP admin session

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

        // Header Debugging & Env Check
        if (cleanPath === '/debug/headers') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    headers: event.headers,
                    raw_auth: event.headers.authorization || event.headers.Authorization || "MISSING",
                    env: {
                        SUPABASE_URL: !!process.env.SUPABASE_URL,
                        SUPABASE_KEY: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY),
                        ADMIN_EMAIL: !!process.env.ADMIN_EMAIL
                    },
                    timestamp: new Date().toISOString()
                })
            };
        }

        // Login
        if (cleanPath === '/login/email') {
            return await handleLoginEmail(event, headers);
        }

        // Admin Login
        if (cleanPath === '/admin/login') {
            return await handleAdminLogin(event, headers);
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

        // Admin Endpoints
        if (cleanPath.startsWith('/admin/')) {
            // Stats
            if (cleanPath === '/admin/stats/scenario') return await handleAdminScenarioStats(event, headers);
            if (cleanPath === '/admin/stats') return await handleAdminStats(event, headers);

            // Users
            if (cleanPath === '/admin/users') return await handleAdminUsers(event, headers);

            // Schedule
            if (cleanPath === '/admin/schedule') return await handleAdminSchedule(event, headers);
            if (cleanPath === '/admin/next-training-period') return await handleAdminNextTrainingPeriod(event, headers);

            // Scenario
            if (cleanPath === '/admin/scenario/preview') return await handleAdminScenarioPreview(event, headers);
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
    try {
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader) {
            console.warn("No Authorization header found");
            return null;
        }

        // Robust token extraction (case-insensitive and handles various formats)
        const token = authHeader.replace(/^Bearer /i, '').trim();

        if (!token) {
            console.warn("Empty token after extraction. Auth Header:", authHeader);
            return null;
        }

        // Check for Admin Token
        if (token === adminToken) {
            return { id: "admin", email: adminEmail, is_admin: true };
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            console.error("Supabase getUser error:", error.message);
            return null;
        }

        return user;
    } catch (e) {
        console.error("getUserFromEvent exception:", e.message);
        return null;
    }
}

/**
 * 1. Login with Email (POST /login/email)
 */
async function handleLoginEmail(event, headers) {
    const data = getRequestData(event);
    const email = data.email;
    const password = "kangtaegong_mvp_password";

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
                }
            })
        };
    }

    // 1. Attempt login
    let { data: authData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    // 2. Handle errors (user not found or email not confirmed)
    if (loginError) {
        console.log(`Login failed for ${email}: ${loginError.message}. Attempting admin fix...`);

        if (loginError.message.includes("Email not confirmed") || loginError.message.includes("Invalid login credentials")) {
            // Try to create or update user using Admin API to bypass email confirmation
            const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { age_group: data.age_group, gender: data.gender }
            });

            if (adminError) {
                // If user already exists but isn't confirmed, try to update them
                if (adminError.message.includes("already registered") || adminError.message.includes("already exists")) {
                    // We need user ID to update. Let's get it by email.
                    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                    const existingUser = users.find(u => u.email === email);

                    if (existingUser) {
                        await supabase.auth.admin.updateUserById(existingUser.id, {
                            email_confirm: true,
                            user_metadata: { age_group: data.age_group, gender: data.gender }
                        });
                        console.log(`User ${email} updated to confirmed via admin.`);
                    }
                } else {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: `Admin Setup Error: ${adminError.message}` }) };
                }
            } else {
                console.log(`User ${email} created as confirmed via admin.`);
            }

            // Retry login after admin fix
            const retry = await supabase.auth.signInWithPassword({ email, password });
            if (retry.error) return { statusCode: 400, headers, body: JSON.stringify({ error: `Login Retry Failed: ${retry.error.message}` }) };
            authData = retry.data;
        } else {
            return { statusCode: 400, headers, body: JSON.stringify({ error: loginError.message }) };
        }
    }

    // 3. Post-login processing
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
 * 1.1 Admin Login (POST /admin/login)
 */
async function handleAdminLogin(event, headers) {
    const data = getRequestData(event);
    const email = data.email;
    const password = data.password;

    if (email === adminEmail && password === adminPassword) {
        console.log(`Admin login successful for ${email}`);
        return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: adminToken,
                email: email,
                is_admin: true,
                redirect_to: "/admin/dashboard"
            })
        };
    }

    console.warn(`Admin login failed for ${email}`);
    return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid admin credentials" })
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
    console.log("Starting survey submission...");
    const user = await getUserFromEvent(event);
    if (!user) {
        console.warn("Survey submission failed: Unauthorized");
        return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const data = getRequestData(event);
    console.log(`Processing survey for user ${user.id}`, data);

    try {
        // Update users table in public schema if it exists
        // Note: 'users' table in public schema is separate from auth.users
        const { error: userUpdateError } = await supabase.from('users').update({
            age_group: data.age_group,
            gender: data.gender
        }).eq('id', user.id);

        if (userUpdateError) {
            console.warn("Public 'users' table update failed (may not exist or permission issue):", userUpdateError.message);
            // We continue because user_profiles update is more critical for onboarding
        }

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

        if (error) {
            console.error("Profile upsert error:", error);
            console.error("Error details:", error.message, error.details, error.hint);
            return { statusCode: 500, headers, body: JSON.stringify({ error: `Profile update failed: ${error.message}` }) };
        }

        console.log("Survey submitted successfully for:", user.id);
        return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        };
    } catch (e) {
        console.error("Unexpected error in handleSubmitSurvey:", e);
        return { statusCode: 500, headers, body: JSON.stringify({ error: `Internal Server Error: ${e.message}` }) };
    }
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

/**
 * 7. Admin Endpoint Handlers
 */

// /admin/stats
async function handleAdminStats(event, headers) {
    const user = await getUserFromEvent(event);
    if (!user || user.id !== 'admin') return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

    // Fake stats for MVP
    const stats = {
        total_users: 150,
        average_security_score: 72,
        total_phishing_sent: 450,
        click_rate: "12.5%"
    };

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(stats)
    };
}

// /admin/stats/scenario
async function handleAdminScenarioStats(event, headers) {
    const user = await getUserFromEvent(event);
    if (!user || user.id !== 'admin') return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

    const scenarioStats = [
        { id: "s1", name: "무료 쿠폰 지급", sent: 100, clicked: 15, click_rate: "15%" },
        { id: "s2", name: "계정 보안 경고", sent: 120, clicked: 8, click_rate: "6.6%" },
        { id: "s3", name: "택배 배송 지연", sent: 80, clicked: 20, click_rate: "25%" }
    ];

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(scenarioStats)
    };
}

// /admin/users
async function handleAdminUsers(event, headers) {
    const user = await getUserFromEvent(event);
    if (!user || user.id !== 'admin') return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

    const { data: users, error } = await supabase.from('users').select('*').limit(50);

    // Fallback if users table is empty or error (users might be in auth.users only)
    const mockUsers = [
        { id: "u1", email: "user1@example.com", age_group: "20s", gender: "male", security_score: 80, created_at: new Date().toISOString() },
        { id: "u2", email: "user2@example.com", age_group: "30s", gender: "female", security_score: 95, created_at: new Date().toISOString() }
    ];

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(users && users.length > 0 ? users : mockUsers)
    };
}

// /admin/schedule (GET)
async function handleAdminSchedule(event, headers) {
    const user = await getUserFromEvent(event);
    if (!user || user.id !== 'admin') return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

    const schedules = [
        { id: "sch1", title: "주기적 훈련 1차", scheduled_date: "2024-03-01", status: "scheduled", target_count: 50 },
        { id: "sch2", title: "주기적 훈련 2차", scheduled_date: "2024-03-15", status: "scheduled", target_count: 50 }
    ];

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(schedules)
    };
}

// /admin/next-training-period
async function handleAdminNextTrainingPeriod(event, headers) {
    const user = await getUserFromEvent(event);
    if (!user || user.id !== 'admin') return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: "2024-03-01", end_date: "2024-03-07" })
    };
}

// /admin/scenario/preview
async function handleAdminScenarioPreview(event, headers) {
    const user = await getUserFromEvent(event);
    if (!user || user.id !== 'admin') return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

    const previews = [
        { id: "sc1", title: "피싱 메일 1", summary: "내용 요약...", created_at: new Date().toISOString() },
        { id: "sc2", title: "피싱 메일 2", summary: "내용 요약...", created_at: new Date().toISOString() }
    ];

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(previews)
    };
}
