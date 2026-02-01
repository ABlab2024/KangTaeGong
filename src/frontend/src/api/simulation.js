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
