import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        console.log(accessToken);
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => {
        console.log(`Response: ${response.config.url}`,{ status: response.status });
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        console.log(`Response error for ${originalRequest.url}:`,{
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            data: error.response?.data,
        });
        if (error.response?.status === 401) {
            console.warn('401 Unauthorized, skipping token refresh for debugging');
            throw new Error(error.response?.data?.message || 'Unauthorized access');
        }
        return Promise.reject(error);
    }
);

export const apiSubscriptionService = {
    async getMySubscription(queryParams = {},userId) {
        try {
            const response = await apiClient.get(`/Subscription/user/${userId}`,{
                queryParams
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default apiSubscriptionService;