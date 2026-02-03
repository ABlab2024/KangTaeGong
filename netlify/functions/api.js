const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
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

    // 1. 로그인 (POST/GET 모두 허용하여 리다이렉트 이슈 방지)
    if (cleanPath === '/login/email' || path.endsWith('/login/email')) {
        return handleLoginEmail(event, headers);
    }

    // 2. 카테고리
    if (cleanPath === '/survey/categories' || path.endsWith('/survey/categories')) {
        return handleSurveyCategories(event, headers);
    }

    // 3. 내 정보
    if (cleanPath === '/users/me' || path.endsWith('/users/me')) {
        return handleGetMe(event, headers);
    }

    // 4. 설문 제출 (Mock)
    if (cleanPath === '/survey' || path.endsWith('/survey')) {
        return { statusCode: 200, headers, body: JSON.stringify({ status: "Success" }) };
    }

    return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Not Found", path: cleanPath, method })
    };
};

async function handleLoginEmail(event, headers) {
    if (!supabase) return { statusCode: 500, headers, body: 'Supabase not initialized' };

    let body = {};
    if (event.body) {
        try {
            // Netlify는 때때로 body를 base64로 인코딩함
            const data = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
            body = JSON.parse(data);
        } catch (e) {
            console.error("JSON Parse Error:", e);
        }
    }

    const queryParams = event.queryStringParameters || {};
    const email = body.email || queryParams.email;
    const age_group = body.age_group || queryParams.age_group;
    const gender = body.gender || queryParams.gender;

    if (!email) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: "Email required",
                debug_info: {
                    method: event.httpMethod,
                    has_body: !!event.body,
                    query: queryParams
                }
            })
        };
    }

    let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: "kangtaegong_mvp_password"
    });

    if (error) {
        const signUpRes = await supabase.auth.signUp({
            email,
            password: "kangtaegong_mvp_password",
            options: { data: { age_group, gender } }
        });
        if (signUpRes.error) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: signUpRes.error.message }) };
        }
        data = signUpRes.data;
    }

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            access_token: data.session?.access_token,
            user: data.user,
            onboarding_completed: false
        })
    };
}

async function handleSurveyCategories(event, headers) {
    const categories = [
        { id: "finance", name_ko: "금융/자산", name_en: "finance" },
        { id: "delivery", name_ko: "택배/쇼핑", name_en: "delivery" },
        { id: "public", name_ko: "지인/사칭", name_en: "public" },
        { id: "institution", name_ko: "공공기관", name_en: "institution" },
        { id: "loan", name_ko: "대출/투자", name_en: "loan" },
        { id: "tech", name_ko: "계정/보안", name_en: "tech" }
    ];
    return { statusCode: 200, headers, body: JSON.stringify(categories) };
}

async function handleGetMe(event, headers) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) return { statusCode: 401, headers, body: 'No token' };

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { statusCode: 401, headers, body: 'Invalid token' };

    return { statusCode: 200, headers, body: JSON.stringify(user) };
}
