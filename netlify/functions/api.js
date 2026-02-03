const { createClient } = require('@supabase/supabase-js');

// 1. Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let initError = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        initError = e.message;
        console.error("Supabase Init Error:", e);
    }
} else {
    initError = `Missing Env Vars. URL: ${!!supabaseUrl}, Key: ${!!supabaseKey}`;
}

exports.handler = async function (event, context) {
    // CORS 처리
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

    // 강제 디버깅 모드: 요청 오면 무조건 환경설정 상태부터 리턴해봄 (테스트용)
    const path = event.path.replace('/.netlify/functions/api', '').replace('/api/v1', '');

    // /api/v1/debug 로 요청 보내면 현재 상태 확인 가능
    if (path === '/debug') {
        return {
            statusCode: 200,
            body: JSON.stringify({
                status: "Debug Info",
                supabase_initialized: !!supabase,
                init_error: initError,
                env_url_preview: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'N/A',
                env_key_exists: !!supabaseKey
            })
        };
    }

    // 에러 발생 시 상세 리포트
    if (!supabase) {
        return {
            statusCode: 500, // 여전히 500이지만, body에 내용이 담김
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                error: "Supabase Client Not Initialized",
                details: initError,
                env_check: {
                    url_len: supabaseUrl ? supabaseUrl.length : 0,
                    key_len: supabaseKey ? supabaseKey.length : 0
                }
            })
        };
    }

    try {
        // ... (기존 로그인 로직 유지) ...
        if (path === '/login/email' && event.httpMethod === 'POST') {
            const { email, age_group, gender } = JSON.parse(event.body || '{}');
            if (!email) return { statusCode: 400, body: JSON.stringify({ error: "Email required" }) };

            // 1. SignIn
            let { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: "kangtaegong_mvp_password"
            });

            // 2. SignUp
            if (error) {
                const signUpRes = await supabase.auth.signUp({
                    email,
                    password: "kangtaegong_mvp_password",
                    options: { data: { age_group, gender } }
                });
                if (signUpRes.error) throw signUpRes.error;
                data = signUpRes.data;
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    access_token: data.session?.access_token,
                    user: data.user,
                    onboarding_completed: false
                })
            };
        }

        return { statusCode: 404, body: `Path not found: ${path}` };

    } catch (err) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                error: "Logic Error",
                message: err.message,
                stack: err.stack
            })
        };
    }
};
