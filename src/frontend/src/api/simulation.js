import supabase from './client';

/**
 * 시나리오 목록 조회 (프론트엔드 하드코딩 또는 DB 조회)
 */
export const getScenarios = async () => {
    // DB에 scenarios 테이블이 있다면 아래 코드 사용
    const { data, error } = await supabase
        .from('scenarios')
        .select('*');

    if (error && error.code !== 'PGRST116') {
        // 테이블이 없는 경우 기본값 반환
        return [
            { id: 'password_reset', name: '비밀번호 재설정 피싱', description: '보안 경고를 위장한 비밀번호 탈취' },
            { id: 'payment_receipt', name: '결제 영수증 피싱', description: '허위 결제 내역을 이용한 클릭 유도' },
            { id: 'delivery_notice', name: '배송 안내 피싱', description: '택배 배송 조회를 위장한 앱 설치 유도' }
        ];
    }
    return data;
};

/**
 * 피싱 시뮬레이션 전송 (로그 기록)
 */
export const sendSimulation = async (params) => {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Send Email via Netlify Function
    // We need to fetch the scenario details first to populate the email
    // For now, we'll just use the params passed in or fetch default
    // Ideally this logic should be more robust or the backend fn should handle templating

    // Fetch scenario details if not provided fully
    // This is a simplification. In a real app, you might want to move templating to the backend function
    // or pass the template name.

    // For this MVP, we will construct the email content here or pass parameters

    // Get scenario details
    const scenarios = await getScenarios();
    const scenario = scenarios.find(s => s.id === params.scenario) || scenarios[0];

    if (!scenario) throw new Error("Invalid scenario");

    // Construct Email Content (Simple version)
    // In production, use a proper template engine
    const emailSubject = params.custom_subject || scenario.name;
    const emailBody = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>${emailSubject}</h2>
        <p>안녕하세요 ${user.email}님,</p>
        <p>${params.custom_message || scenario.description}</p>
        <p>이것은 피싱 예방 훈련을 위한 시뮬레이션 이메일입니다.</p>
        <br>
        <a href="${window.location.origin}/training-complete?id=${params.threat_case_id}" 
           style="background-color: #d946ef; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           확인하기
        </a>
      </div>
    `;

    try {
        const emailResponse = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: user.email,
                subject: emailSubject,
                html: emailBody,
                from_name: "KangTaeGong Security"
            })
        });

        if (!emailResponse.ok) {
            const errData = await emailResponse.json();
            throw new Error(errData.error || 'Failed to send email');
        }

        // 2. Log to Supabase
        const { data, error } = await supabase
            .from('simulation_logs')
            .insert({
                user_id: user.id,
                threat_id: params.threat_case_id || null,
                event_type: 'SENT',
                created_at: new Date().toISOString()
            });


        if (error) throw error;
        return { success: true, data };

    } catch (e) {
        console.error("Simulation failed:", e);
        throw e;
    }
};

/**
 * 시뮬레이션 통계 조회
 */
export const getSimulationStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('simulation_logs')
        .select('*')
        .eq('user_id', user.id);

    if (error) throw error;

    const total = data.length;
    const clicked = data.filter(d => d.event_type === 'CLICKED').length;

    return {
        total_simulations: total,
        clicked_count: clicked,
        history: data
    };
};

/**
 * 위협 인텔리전스 피드 조회
 */
export const getThreats = async (skip = 0, limit = 10) => {
    const { data, error } = await supabase
        .from('threat_cases')
        .select('id, source_url, raw_text, analysis_json, collected_at')
        .range(skip, skip + limit - 1)
        .order('collected_at', { ascending: false });

    if (error) throw error;
    return data;
};
