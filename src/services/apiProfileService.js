import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Khởi tạo apiClient với cấu hình tương tự authService.js
const apiClient = axios.create({
  baseURL: 'https://a2d2-2402-800-63b5-930f-acd2-f39f-14cb-5625.ngrok-free.app/api/v1',
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

apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response: ${response.config.url}`, { status: response.status });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(`Response error for ${originalRequest.url}:`, {
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