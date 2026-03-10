import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.mddoulat.com/api';

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL && window.location.hostname !== 'localhost') {
    console.warn('⚠️ NEXT_PUBLIC_API_URL is not set! Falling back to localhost API which will fail in production.');
}

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000 // 10 second timeout
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('masm_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Standardized Error Handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401 && typeof window !== 'undefined') {
            // Only redirect if we're not already on the login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('masm_token');
                localStorage.removeItem('masm_user');
                window.location.href = '/login';
            }
        }

        if (!error.response) {
            console.error('Network Error / Server Offline');
        }

        return Promise.reject(error);
    }
);

export default api;
