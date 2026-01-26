import client from './client';

export const authApi = {
    login: async (username, password) => {
        // FormData is required for OAuth2PasswordRequestForm
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
