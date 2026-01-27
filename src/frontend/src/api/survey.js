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
