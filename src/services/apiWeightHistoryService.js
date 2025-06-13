import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Khởi tạo apiClient với cấu hình tương tự profileService.js
const apiClient = axios.create({
  baseURL: 'https://24a1-2402-800-63b5-930f-ac5d-a560-ce0b-8912.ngrok-free.app/api/v1',
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

export const weightHistoryService = {
  async getAllWeightHistory(queryParams = {}, minWeight, maxWeight) {
    try {
      const params = { ...queryParams, minWeight, maxWeight };
      const response = await apiClient.get('/WeightHistory', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy weight history theo userId
  async getWeightHistoryByUserId(userId, queryParams = {}) {
    try {
      const response = await apiClient.get(`/WeightHistory/user/${userId}`, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMyWeightHistory(queryParams = {}) {
    try {
      const response = await apiClient.get('/WeightHistory/me', { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy weight history theo historyId
  async getWeightHistoryById(historyId) {
    try {
      const response = await apiClient.get(`/WeightHistory/${historyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
 async addWeightHistory(weightHistoryData) {
    try {
      const response = await apiClient.post('/WeightHistory', weightHistoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // Thêm weight history mới
 // Cập nhật weight history
async updateWeightHistory(historyId, weightHistoryData) {
  try {
    const response = await apiClient.put(`/WeightHistory/${historyId}`, weightHistoryData);
    return response.data;
  } catch (error) {
    throw error;
  }
},

// Xóa weight history
async deleteWeightHistory(historyId) {
  try {
    const response = await apiClient.delete(`/WeightHistory/${historyId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
},

  // Xóa weight history
  async deleteWeightHistory(historyId) {
    try {
      const response = await apiClient.delete(`/WeightHistory/${historyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy thống kê weight history theo userId
  async getUserStatistics(userId, startDate, endDate) {
    try {
      const params = { startDate, endDate };
      const response = await apiClient.get(`/WeightHistory/user/${userId}/statistics`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy thống kê weight history của người dùng hiện tại
  async getMyStatistics(startDate, endDate) {
    try {
      const params = { startDate, endDate };
      const response = await apiClient.get('/WeightHistory/me/statistics', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy cân nặng trung bình theo khoảng thời gian và userId
  async getAverageWeightByPeriod(userId, period) {
    try {
      const response = await apiClient.get(`/WeightHistory/user/${userId}/average/period`, { params: { period } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy cân nặng trung bình theo khoảng thời gian của người dùng hiện tại
  async getMyAverageWeightByPeriod(period) {
    try {
      const response = await apiClient.get('/WeightHistory/me/average/period', { params: { period } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy cân nặng trung bình theo khoảng thời gian tùy chỉnh và userId
  async getAverageWeight(userId, startDate, endDate) {
    try {
      const params = { startDate, endDate };
      const response = await apiClient.get(`/WeightHistory/user/${userId}/average`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy cân nặng trung bình theo khoảng thời gian tùy chỉnh của người dùng hiện tại
  async getMyAverageWeight(startDate, endDate) {
    try {
      const params = { startDate, endDate };
      const response = await apiClient.get('/WeightHistory/me/average', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default weightHistoryService;