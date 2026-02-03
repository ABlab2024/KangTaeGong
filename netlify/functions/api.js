const { createClient } = require('@supabase/supabase-js');

// 1. Supabase 클라이언트 초기화
// Netlify 환경변수에서 값 가져오기
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. JWT 생성/검증 유틸리티 (간소화)
// 실제로는 jsonwebtoken 라이브러리를 써야 하지만, 여기서는 Supabase Auth가 주는 토큰을 그대로 쓸 예정이므로 생략해도 됨.
// 하지만 사용자 정보를 바탕으로 커스텀 로직이 필요하다면 아래와 같이 핸들러 구성.

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

            const defaultPassword = "kangtaegong_mvp_password"; // 임시 비번 (이메일 온리 로그인을 위해)

            // 2. 로그인 시도 (SignIn)
            let { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: defaultPassword
            });

            // 3. 실패하면 => 회원가입 (SignUp)
            if (error) {
                // SignUp
                const signUpRes = await supabase.auth.signUp({
                    email,
                    password: defaultPassword,
                    options: {
                        data: { age_group, gender } // 메타데이터 저장
                    }
                });

                if (signUpRes.error) throw signUpRes.error;
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
                    // 온보딩 여부는 user_metadata 등으로 체크 가능 (생략 시 기본값)
                    onboarding_completed: false
                })
            };
        }

        // ---------------------------------------------------------
        // 404 Not Found
        // ---------------------------------------------------------
        return {
            statusCode: 404,
            body: JSON.stringify({ error: `Not Found: ${path}` })
        };

    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: err.message })
        };
    }
};
