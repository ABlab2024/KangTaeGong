import client from './client';

export const adminApi = {
    /**
     * 관리자 로그인
     */
    login: async (email, password) => {
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', password);

        const response = await client.post(`/admin/login?${params.toString()}`);
        return response.data;
    },

    /**
     * 전체 사용자 목록 조회
     */
    getUsers: async (skip = 0, limit = 100) => {
        const response = await client.get(`/admin/users?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    /**
     * 훈련 예정 스케줄 조회
     */
    getSchedule: async (includeSent = false) => {
        const response = await client.get(`/admin/schedule?include_sent=${includeSent}`);
        return response.data;
    },

    /**
     * 시나리오 미리보기 목록 조회
     */
    getScenarioPreviews: async () => {
        const response = await client.get('/admin/scenario/preview');
        return response.data;
    },

    /**
     * LLM으로 새 시나리오 생성
     */
    generateScenario: async (sourceUrl = null, targetPreferences = null, mode = 'preference', prompt = null) => {
        const params = new URLSearchParams();
        params.append('mode', mode);
        if (sourceUrl) params.append('source_url', sourceUrl);
        if (prompt) params.append('prompt', prompt);

        // Only include body if targetPreferences is provided
        const body = targetPreferences ? { target_preferences: targetPreferences } : {};

        const response = await client.post(`/admin/scenario/generate?${params.toString()}`, body);
        return response.data;
    },

    /**
     * 시뮬레이션 이메일 발송
     */
    sendSimulation: async (userIds = null, scenarioId = null, scheduledDate = null) => {
        const response = await client.post('/admin/send-simulation', {
            user_ids: userIds,
            scenario_id: scenarioId,
            scheduled_date: scheduledDate,
        });
        return response.data;
    },

    /**
     * 통계 조회
     */
    getStats: async () => {
        const response = await client.get('/admin/stats');
        return response.data;
    },

    /**
     * 다음 훈련 예정 기간 조회
     */
    getNextTrainingPeriod: async () => {
        const response = await client.get('/admin/next-training-period');
        return response.data;
    },

    /**
     * 시나리오 상세 조회
     */
    getScenarioDetail: async (scenarioId) => {
        const response = await client.get(`/admin/scenario/${scenarioId}`);
        return response.data;
    },

    /**
     * 시나리오 수정
     */
    updateScenario: async (scenarioId, data) => {
        const response = await client.put(`/admin/scenario/${scenarioId}`, data);
        return response.data;
    },

    /**
     * 훈련 스케줄 생성
     */
    createSchedule: async (userIds, scenarioId, scheduledDate, title = null) => {
        const response = await client.post('/admin/schedule', {
            user_ids: userIds,
            scenario_id: scenarioId,
            scheduled_date: scheduledDate,
            title: title,
        });
        return response.data;
    },

    /**
     * 시나리오별 통계 조회
     */
    getScenarioStats: async () => {
        const response = await client.get('/admin/stats/scenario');
        return response.data;
    },

    /**
     * 훈련 스케줄 수정 (미발송 스케줄만 가능)
     */
    updateSchedule: async (scheduleId, data) => {
        const response = await client.put(`/admin/schedule/${scheduleId}`, data);
        return response.data;
    },

    /**
     * 훈련 스케줄 삭제 (미발송 스케줄만 가능)
     */
    deleteSchedule: async (scheduleId) => {
        const response = await client.delete(`/admin/schedule/${scheduleId}`);
        return response.data;
    },
};
