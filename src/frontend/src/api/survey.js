import client from './client';

export const surveyApi = {
    /**
     * 컨텐츠 카테고리 목록 조회 (그룹별)
     */
    getCategories: async () => {
        const response = await client.get('/survey/categories');
        return response.data;
    },

    /**
     * 온보딩 설문 제출
     */
    submitSurvey: async (surveyData) => {
        const response = await client.post('/survey/submit', surveyData);
        return response.data;
    },

    /**
     * LLM 취향 증강 요청
     */
    augmentPreferences: async (currentPreferences, iteration) => {
        const response = await client.post('/survey/augment', {
            current_preferences: currentPreferences,
            iteration: iteration,
        });
        return response.data;
    },

    /**
     * 취약점 분석 결과 조회
     * @param {boolean} refresh - true이면 새로 분석을 생성합니다
     */
    getVulnerabilityAnalysis: async (refresh = false) => {
        const response = await client.get('/survey/vulnerability', {
            params: { refresh }
        });
        return response.data;
    },

    /**
     * 온보딩 완료 여부 확인
     */
    checkOnboardingStatus: async () => {
        const response = await client.get('/survey/status');
        return response.data;
    },

    /**
     * 사용자 프로필 조회
     */
    getProfile: async () => {
        const response = await client.get('/survey/profile');
        return response.data;
    },
};
