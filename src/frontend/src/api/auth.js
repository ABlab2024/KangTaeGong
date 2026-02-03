import client from './client';

export const authApi = {
    // 이메일 전용 로그인 (MVP용)
    loginWithEmail: async (email, ageGroup = null, gender = null) => {
        // Body에 데이터를 담으면서 동시에 Query Parameter로도 전송 (Netlify 리다이렉트 시 데이터 유실 방지)
        const response = await client.post(`/login/email?email=${encodeURIComponent(email)}`, {
            email,
            age_group: ageGroup,
            gender: gender
        });
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
