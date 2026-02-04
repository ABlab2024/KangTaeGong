import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1', // Dynamic URL for production
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Token
client.interceptors.request.use((config) => {
    // Check if it's an admin request
    // Note: baseURL might be prepended, so we check url.
    // However, axios config.url is relative if baseURL is set.
    if (config.url?.includes('/admin/')) {
        const adminToken = localStorage.getItem('admin_token');
        if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        }
    } else {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response Interceptor: Handle Errors
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Check if it was an admin request
            if (error.config?.url?.includes('/admin/')) {
                console.warn("Admin session expired or invalid");
                localStorage.removeItem('admin_token');
                // Don't redirect globally, let the component handle it or reload to /admin
                if (!window.location.pathname.startsWith('/admin')) {
                    window.location.href = '/admin';
                }
            } else {
                // Token expired or invalid
                localStorage.removeItem('access_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default client;
