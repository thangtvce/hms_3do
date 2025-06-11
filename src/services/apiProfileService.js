import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Khởi tạo apiClient với cấu hình tương tự authService.js
const apiClient = axios.create({
  baseURL: 'https://deba-2402-800-63b5-930f-556-5cca-e20-f136.ngrok-free.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor request: Thêm token vào header
apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor response: Xử lý refresh token khi nhận lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const response = await apiClient.post('/Auth/refresh-token', { refreshToken });
        if (response.data.statusCode === 200 && response.data.data) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', newAccessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        throw refreshError;
      }
    }
    return Promise.reject(error);
  }
);

export const profileService = {
  // Lấy hồ sơ mới nhất theo userId
  async getLatestProfile(userId) {
    try {
      const response = await apiClient.get(`/Profile/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy tất cả hồ sơ theo userId
  async getAllProfiles(userId) {
    try {
      const response = await apiClient.get(`/Profile/${userId}/all`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy hồ sơ theo profileId
  async getProfileByProfileId(profileId) {
    try {
      const response = await apiClient.get(`/Profile/by-profile-id/${profileId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật hồ sơ
  async updateProfile(userId, profileData) {
    try {
      const response = await apiClient.put(`/Profile/${userId}`, profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Thêm hồ sơ mới
  async addProfile(profileData) {
    try {
      const response = await apiClient.post('/Profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default profileService;