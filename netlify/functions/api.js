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

        // Header Debugging
        if (cleanPath === '/debug/headers') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    headers: event.headers,
                    raw_auth: event.headers.authorization || event.headers.Authorization || "MISSING",
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
        if (cleanPath === '/survey/vulnerability') {
            return await handleGetVulnerability(event, headers);
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
            return { user: null, error: "No Authorization header found" };
        }

        // Robust token extraction (case-insensitive and handles various formats)
        const token = authHeader.replace(/^Bearer /i, '').trim();

        if (!token) {
            return { user: null, error: "Empty token after extraction" };
        }

        // Check for Admin Token
        if (token === adminToken) {
            return { user: { id: "admin", email: adminEmail, is_admin: true }, error: null };
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            console.error("Supabase getUser error:", error.message);
            return { user: null, error: `Supabase Auth Error: ${error.message}` };
        }

        return { user, error: null };
    } catch (e) {
        console.error("getUserFromEvent exception:", e.message);
        return { user: null, error: `Auth Exception: ${e.message}` };
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
                // Error message: "A user with this email address has already been registered"
                if (adminError.message.includes("registered") || adminError.message.includes("exists")) {
                    // We need user ID to update. Let's get it by email.
                    // Note: listUsers defaults to 50 users. For MVP this is fine.
                    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
                    const existingUser = users.find(u => u.email === email);

                    if (existingUser) {
                        await supabase.auth.admin.updateUserById(existingUser.id, {
                            email_confirm: true,
                            password: password, // Reset password to ensure login succeeds
                            user_metadata: { age_group: data.age_group, gender: data.gender }
                        });
                        console.log(`User ${email} updated to confirmed and password reset via admin.`);
                    } else {
                        console.warn(`User ${email} exists but not found in admin list (pagination?). Login retry might fail.`);
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
    const { user, error } = await getUserFromEvent(event);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: error || "Unauthorized" }) };
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
    const { user, error: authError } = await getUserFromEvent(event);
    if (!user) {
        console.warn("Survey submission failed: Unauthorized", authError);
        return { statusCode: 401, headers, body: JSON.stringify({ error: authError || "Unauthorized" }) };
    }

    const data = getRequestData(event);
    console.log(`Processing survey for user ${user.id}`, data);

    try {
        // Create an Authenticated Client using the user's token
        // This ensures RLS policies work correctly based on auth.uid()
        const authHeader = event.headers.authorization || event.headers.Authorization;
        const supabaseAuth = createClient(supabaseUrl, process.env.SUPABASE_KEY, {
            global: {
                headers: { Authorization: authHeader }
            }
        });

        // 1. Upsert into public.users
        const { error: userUpsertError } = await supabaseAuth.from('users').upsert({
            id: user.id,
            email: user.email,
            age_group: data.age_group,
            gender: data.gender,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (userUpsertError) {
            console.warn("Public 'users' table upsert failed (RlS?):", userUpsertError.message);
            // Don't throw here immediately, try profile update just in case user exists
        }

        // 2. Upsert into user_profiles
        const { data: profile, error } = await supabaseAuth
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
            console.error("ADMIN: Profile upsert error:", error);
            throw new Error(`Profile Update Failed: ${error.message}`);
        }

        console.log("Survey submitted successfully for:", user.id);
        return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        };
    } catch (e) {
        console.error("Unexpected error in handleSubmitSurvey:", e);
        return { statusCode: 500, headers, body: JSON.stringify({ error: `Server Error: ${e.message}` }) };
    }
}

/**
 * 5. Simulation Stats
 */
async function handleGetSimulationStats(event, headers) {
    const { user, error: authError } = await getUserFromEvent(event);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: authError || "Unauthorized" }) };

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
 * 6. Vulnerability Analysis
 */
async function handleGetVulnerability(event, headers) {
    const { user, error: authError } = await getUserFromEvent(event);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: authError || "Unauthorized" }) };

    // Get Profile
    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    if (!profile) return { statusCode: 404, headers, body: JSON.stringify({ error: "Profile not found" }) };

    // Check if analysis exists
    if (profile.vulnerability_analysis) {
        return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                analysis: profile.vulnerability_analysis,
                summary: profile.vulnerability_summary || ""
            })
        };
    }

    // Generate Mock Analysis if missing
    const prefs = Array.isArray(profile.content_preferences) ? profile.content_preferences : [];
    const analysisText = `사용자님은 ${prefs.join(', ')} 등의 콘텐츠에 높은 관심을 보이고 있습니다. 
특히 이런 관심사를 악용한 '맞춤형 피싱 시도'에 취약할 수 있습니다. 
예를 들어, 자주 이용하는 쇼핑몰의 할인 쿠폰이나, 관심 있는 분야의 급박한 뉴스를 가장한 스미싱 문자에 주의가 필요합니다.
또한 ${profile.occupation || '직업'} 관련 업무를 사칭한 이메일 공격에도 대비가 필요합니다.`;

    const summaryText = `${prefs[0] || '관심'} 분야 피싱 주의`;

    // Save generated analysis
    // Use Authenticated Client
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const supabaseAuth = createClient(supabaseUrl, process.env.SUPABASE_KEY, {
        global: { headers: { Authorization: authHeader } }
    });

    await supabaseAuth
        .from('user_profiles')
        .update({
            vulnerability_analysis: analysisText,
            vulnerability_summary: summaryText
        })
        .eq('user_id', user.id);

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            analysis: analysisText,
            summary: summaryText
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
    const { user } = await getUserFromEvent(event);
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
    const { user } = await getUserFromEvent(event);
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
    const { user } = await getUserFromEvent(event);
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
    const { user } = await getUserFromEvent(event);
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
    const { user } = await getUserFromEvent(event);
    if (!user || user.id !== 'admin') return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: "2024-03-01", end_date: "2024-03-07" })
    };
}

// /admin/scenario/preview
async function handleAdminScenarioPreview(event, headers) {
    const { user } = await getUserFromEvent(event);
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
