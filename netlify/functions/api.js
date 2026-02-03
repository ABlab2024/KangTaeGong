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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
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

    // 3. 내 정보 조회 (GET /users/me) - *새로 추가한 부분*
    if (cleanPath === '/users/me' || path.endsWith('/users/me')) {
        if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: 'Use GET' };
        return handleGetMe(event, headers);
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

// ... (handleLoginEmail, handleSurveyCategories 는 기존과 동일하므로 생략하지 않고 아래에 재작성)

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

// [신규] 유저 정보 조회 (Authorization 헤더 파싱)
async function handleGetMe(event, headers) {
    const authHeader = event.headers.authorization || event.headers.Authorization;

    if (!authHeader) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: "Missing Token" }) };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid Token" }) };
    }

    // 필요한 경우 DB에서 추가 프로필 정보를 가져와서 합쳐야 하지만, MVP에서는 Auth User 정보만 리턴
    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(user) // user 객체 그대로 반환 (id, email, metadata 등 포함)
    };
}
