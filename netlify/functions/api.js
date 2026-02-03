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
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // 경로 파싱 수정: ?queryString 제거
    // event.path는 query string을 포함하지 않지만, 혹시 모르니 안전하게 처리
    // .replace 정규식 사용하여 더 깔끔하게 처리
    let path = event.path.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api\/v1/, '');

    // 디버그: 어떤 Path가 들어왔는지 확인 (400 에러 시 body에 포함해서 보여줌)
    const debugPath = path;

    if (path === '/debug') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: "Debug Info",
                supabase_initialized: !!supabase,
                path_received: debugPath,
                env_check: !!supabaseKey
            })
        };
    }

    if (!supabase) {
        return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: "Supabase Client Not Initialized", details: initError })
        };
    }

    try {
        // 실제 동작부
        // path가 '/login/email' 인지 확인
        if (path === '/login/email' && event.httpMethod === 'POST') {
            let body = {};
            try {
                body = JSON.parse(event.body || '{}');
            } catch (e) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
            }

            const { email, age_group, gender } = body;
            if (!email) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: "Email required", received_body: body })
                };
            }

            // 1. SignIn
            let { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: "kangtaegong_mvp_password"
            });

            // 2. SignUp
            if (error) {
                // 로그인 실패 -> 회원가입 시도
                // console.log("Login failed, trying signup:", error.message);
                const signUpRes = await supabase.auth.signUp({
                    email,
                    password: "kangtaegong_mvp_password",
                    options: { data: { age_group, gender } }
                });
                if (signUpRes.error) {
                    // 회원가입 실패 (예: Rate limit, Invalid password 등)
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

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: `Not Found: ${path}`, received_path: path })
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Logic Exception", message: err.message })
        };
    }
};
