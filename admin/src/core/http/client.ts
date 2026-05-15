import axiosInstance from './axios';
import { AxiosRequestConfig } from 'axios';

/**
 * API Response wrapper matching backend format
 */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string | null;
}

/**
 * Typed HTTP client helpers wrapping axios
 * All requests automatically include auth and handle errors
 */
export const client = {
    get: async <T>(url: string, params?: any, config?: AxiosRequestConfig) => {
        const response = await axiosInstance.get<ApiResponse<T>>(url, { params, ...config });
        return response.data;
    },

    post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
        const response = await axiosInstance.post<ApiResponse<T>>(url, data, config);
        return response.data;
    },

    put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
        const response = await axiosInstance.put<ApiResponse<T>>(url, data, config);
        return response.data;
    },

    delete: async <T>(url: string, config?: AxiosRequestConfig) => {
        const response = await axiosInstance.delete<ApiResponse<T>>(url, config);
        return response.data;
    },
};

export default client;
