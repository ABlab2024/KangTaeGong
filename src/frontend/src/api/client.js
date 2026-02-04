import axios from 'axios';
import { getAccessToken } from '../lib/supabase';

const client = axios.create({
    baseURL: '/.netlify/functions',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Supabase Token
client.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
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
            // Token expired or invalid - redirect to login
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default client;
