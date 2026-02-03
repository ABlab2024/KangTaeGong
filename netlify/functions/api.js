const { createClient } = require('@supabase/supabase-js');

// 1. Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.error("Supabase Init Error:", e);
    }
}

exports.handler = async function (event, context) {
    // CORS 처리
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // 경로 파싱
    let path = event.path;
    let cleanPath = path.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api\/v1/, '').split('?')[0];

    // 라우팅 로직
    // 1. 로그인 (POST /login/email)
    if (cleanPath === '/login/email' || path.endsWith('/login/email')) {
        if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Methods Not Allowed' };
        return handleLoginEmail(event, headers);
    }

    // 2. 카테고리 (GET /survey/categories)
    if (cleanPath === '/survey/categories' || path.endsWith('/survey/categories')) {
        return handleSurveyCategories(event, headers);
    }

    return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Not Found: ${cleanPath}`, raw_path: path, strategy: 'flexible_match' })
    };
};

// ------------------------------------------------------------------
// 핸들러 함수들
// ------------------------------------------------------------------

async function handleLoginEmail(event, headers) {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) { }

    const queryParams = event.queryStringParameters || {};
    const email = body.email || queryParams.email;
    const age_group = body.age_group || queryParams.age_group;
    const gender = body.gender || queryParams.gender;

    if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Email required" }) };
    }

    // SignIn
    let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: "kangtaegong_mvp_password"
    });

    // SignUp
    if (error) {
        const signUpRes = await supabase.auth.signUp({
            email,
            password: "kangtaegong_mvp_password",
            options: { data: { age_group, gender } }
        });
        if (signUpRes.error) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: `Signup failed: ${signUpRes.error.message}` })
            };
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
    // MVP 카테고리 데이터 하드코딩 (DB 조회 대신)
    // 원래는 python 백엔드에서 router로 분기하던 것을 여기서 처리
    const categories = [
        { id: "finance", name_ko: "금융/자산", name_en: "finance" },
        { id: "delivery", name_ko: "택배/쇼핑", name_en: "delivery" },
        { id: "public", name_ko: "지인/사칭", name_en: "public" },
        { id: "institution", name_ko: "공공기관", name_en: "institution" },
        { id: "loan", name_ko: "대출/투자", name_en: "loan" },
        { id: "tech", name_ko: "계정/보안", name_en: "tech" }
    ];

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(categories)
    };
}
