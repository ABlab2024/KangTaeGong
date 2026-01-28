import client from './client';

export const authApi = {
    // 이메일 전용 로그인 (MVP용)
    loginWithEmail: async (email, ageGroup = null, gender = null) => {
        const params = new URLSearchParams();
        params.append('email', email);
        if (ageGroup) params.append('age_group', ageGroup);
        if (gender) params.append('gender', gender);

        const response = await client.post(`/login/email?${params.toString()}`);
        return response.data;
    },

    // 관리자 로그인
    adminLogin: async (email, password) => {
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', password);

        const response = await client.post(`/admin/login?${params.toString()}`);
        return response.data;
    },

    // Legacy OAuth2 로그인 (하위 호환성)
    login: async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await client.post('/login/access-token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return response.data;
    },

    register: async (email, password, fullName) => {
        const response = await client.post('/users/open', {
            email,
            password,
            full_name: fullName,
        });
        return response.data;
    },

    getMe: async () => {
        const response = await client.get('/users/me');
        return response.data;
    },
};
