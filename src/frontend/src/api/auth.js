import supabase from './client';

export const authApi = {
    /**
     * 로그인
     */
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // 기존 코드와의 호환성을 위해 access_token 반환 구조 유지
        return {
            access_token: data.session?.access_token,
            user: data.user,
        };
    },

    /**
     * 회원가입
     */
    register: async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        if (error) throw error;
        return data.user;
    },

    /**
     * 내 정보 조회
     */
    getMe: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    /**
     * 로그아웃
     */
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }
};
