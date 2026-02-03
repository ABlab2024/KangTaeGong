const { createClient } = require('@supabase/supabase-js');

// 1. Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
// 중요: Supabase Key가 없으면 초기화 단계에서 에러가 날 수 있음.
// process.env 값이 undefined인지 체크
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
    // CORS 처리 (Preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            },
            body: ''
        };
    }

    // 환경변수 누락 체크 (500 에러의 주범)
    if (!supabase) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                error: "Configuration Error: Missing SUPABASE_URL or SUPABASE_KEY in Netlify Environment Variables.",
                env_check: {
                    has_url: !!process.env.SUPABASE_URL,
                    has_key: !!(process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
                }
            })
        };
    }

    // 경로 파싱 (/api/v1/login/email -> login-email)
    const path = event.path.replace('/.netlify/functions/api', '').replace('/api/v1', '');

    try {
        // ---------------------------------------------------------
        // POST /login/email (이메일 로그인/가입)
        // ---------------------------------------------------------
        if (path === '/login/email' && event.httpMethod === 'POST') {
            // 1. 요청 파싱
            const { email, age_group, gender } = JSON.parse(event.body || '{}');
            if (!email) throw new Error('Email is required');

            const defaultPassword = "kangtaegong_mvp_password";

            // 2. 로그인 시도 (SignIn)
            let { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: defaultPassword
            });

            // 3. 실패하면 => 회원가입 (SignUp)
            if (error) {
                // 어떤 에러인지 로깅
                console.log("Login failed, trying signup:", error.message);

                const signUpRes = await supabase.auth.signUp({
                    email,
                    password: defaultPassword,
                    options: {
                        data: { age_group, gender }
                    }
                });

                if (signUpRes.error) {
                    // 회원가입도 실패하면 진짜 에러
                    throw new Error(`Signup failed: ${signUpRes.error.message}`);
                }
                data = signUpRes.data;
            }

            // 4. 로그인 성공 응답
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    access_token: data.session?.access_token,
                    user: data.user,
                    onboarding_completed: false
                })
            };
        }

        // ---------------------------------------------------------
        // 404 Not Found
        // ---------------------------------------------------------
        return {
            statusCode: 404,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: `Not Found: ${path}` })
        };

    } catch (err) {
        console.error("Handler Error:", err);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: err.message || "Internal Server Error" })
        };
    }
};
