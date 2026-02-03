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

    // 경로 파싱: Netlify의 path는 이미 리다이렉트 전의 원본 path일 수도 있고 아닐 수도 있음.
    // 가장 안전한 방법: "login/email"이 포함되어 있는지 확인하는 것.
    let path = event.path;

    // 디버깅 메시지를 위해 정제 시도
    let cleanPath = path.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api\/v1/, '');

    // -----------------------------------------------------------------------
    // [중요] 경로 매칭 로직 완화
    // 정확한 일치(===) 대신 'endsWith'나 'includes' 사용하여 유연하게 처리
    // -----------------------------------------------------------------------

    // 디버그
    if (path.includes('/debug')) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: "Debug Info",
                supabase_initialized: !!supabase,
                raw_path: path,
                clean_path: cleanPath,
                env_check: !!supabaseKey
            })
        };
    }

    // 환경변수 체크
    if (!supabase) {
        return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: "Supabase Client Not Initialized", details: initError })
        };
    }

    try {
        // [수정된 매칭 로직]: /login/email 로 끝나거나 포함되면 OK
        if (cleanPath === '/login/email' || path.endsWith('/login/email')) {
            if (event.httpMethod !== 'POST') {
                return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
            }

            let body = {};
            try {
                body = JSON.parse(event.body || '{}');
            } catch (e) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
            }

            const { email, age_group, gender } = body;
            if (!email) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Email required" }) };
            }

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

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: `Not Found: ${cleanPath}`, raw_path: path, strategy: 'flexible_match' })
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Logic Exception", message: err.message })
        };
    }
};
