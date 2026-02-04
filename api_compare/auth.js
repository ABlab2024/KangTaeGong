import supabase from './client';

export const authApi = {
    /**
     * 간편 로그인 (이메일만 입력)
     */
    quickLogin: async (email) => {
        const defaultPassword = 'kangtaegong123!';
        try {
            // 1. 먼저 로그인을 시도
            return await authApi.login(email, defaultPassword);
        } catch (err) {
            // 2. 로그인 실패 시 회원가입 후 로그인
            await authApi.register(email, defaultPassword, email.split('@')[0]);
            return await authApi.login(email, defaultPassword);
        }
    },

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
