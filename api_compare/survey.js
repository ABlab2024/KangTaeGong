import supabase from './client';

export const surveyApi = {
    /**
     * 컨텐츠 카테고리 목록 조회
     */
    getCategories: async () => {
        const { data, error } = await supabase
            .from('content_categories')
            .select('*')
            .order('display_order');

        if (error) throw error;
        return data;
    },

    /**
     * 온보딩 설문 제출 (프로필 업데이트)
     */
    submitSurvey: async (surveyData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: user.id,
                age: surveyData.age,
                occupation: surveyData.occupation,
                location: surveyData.location,
                sns_homepage: surveyData.sns_homepage,
                recent_ai_link: surveyData.recent_ai_link,
                content_preferences: surveyData.content_preferences,
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
            });

        if (error) throw error;
        return data;
    },

    /**
     * 온보딩 완료 여부 확인
     */
    checkOnboardingStatus: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { completed: false };

        const { data, error } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) throw error;
        return { completed: data?.onboarding_completed || false };
    },

    /**
     * 사용자 프로필 조회
     */
    getProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) throw error;
        return data || { user_id: user.id };
    },
};
