import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../auth/authStore';

/**
 * Axios instance configured per .ai/contracts/update.json
 * - baseURL from VITE_API_BASE_URL
 * - Request interceptor: Attach Authorization header if token exists
 * - Response interceptor: On 401 → clear auth → redirect to /login
 */
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Request interceptor: Attach Bearer token if available
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle 401 errors globally
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Clear auth store and redirect to login
            useAuthStore.getState().logout();
            window.location.hash = '#/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
