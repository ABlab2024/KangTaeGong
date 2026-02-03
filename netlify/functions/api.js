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

    // Method 대소문자 보정
    const method = (event.httpMethod || '').toUpperCase();

    // 라우팅 로직

    // 1. 로그인 (POST /login/email)
    if (cleanPath === '/login/email' || path.endsWith('/login/email')) {
        // [예외 처리] 브라우제/Netlify 이슈로 GET으로 리다이렉트 된 경우, 
        // 혹시라도 쿼리파라미터에 email이 있으면 로그인을 시도해본다 (UX 개선)
        if (method === 'GET' && event.queryStringParameters && event.queryStringParameters.email) {
            return handleLoginEmail(event, headers);
        }

        if (method !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({
                    error: "Method Not Allowed (Login)",
                    received_method: method,
                    path: cleanPath,
                    hint: "Please allow some time for the frontend CDN to update, or try Ctrl+Shift+R."
                })
            };
        }
        return handleLoginEmail(event, headers);
    }

    // 2. 카테고리 (GET /survey/categories)
    if (cleanPath === '/survey/categories' || path.endsWith('/survey/categories')) {
        return handleSurveyCategories(event, headers);
    }

    // 3. 내 정보 조회 (GET /users/me)
    if (cleanPath === '/users/me' || path.endsWith('/users/me')) {
        return handleGetMe(event, headers);
    }

    // 4. 설문 제출 (POST /survey) - 디버깅용 모의 구현
    if (cleanPath === '/survey' || path.endsWith('/survey')) {
        if (method !== 'POST') return { statusCode: 405, headers, body: 'Use POST' };
        return { statusCode: 200, headers, body: JSON.stringify({ status: "Success", message: "Survey saved (Mock)" }) };
    }

    return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
            error: "Not Found",
            clean_path: cleanPath,
            raw_path: path,
            method: method
        })
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

// ... handleSurveyCategories, handleGetMe 는 기존과 동일하므로 생략 (문자열 아끼기)
// 아래 코드는 위에서 export한 핸들러에서 호출되므로, 함수 정의만 확실하면 됨.

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

    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };
}
