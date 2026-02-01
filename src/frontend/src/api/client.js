import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1', // Dynamic URL for production
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Token
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle Errors
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default client;
