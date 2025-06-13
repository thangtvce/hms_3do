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
    console.error(`Response error for ${originalRequest.url}:`,{
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

export const apiUserService = {
  async getAllUsers(queryParams = {}) {
    try {
      const response = await apiClient.get('/User/manage-users',{
        params: {
          PageNumber: queryParams.pageNumber || 1,
          PageSize: queryParams.pageSize || 10,
          SearchTerm: queryParams.searchTerm,
          SortBy: queryParams.sortBy,
          SortOrder: queryParams.sortOrder,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getAllUsersNoPagination() {
    try {
      const response = await apiClient.get('/User/all-users');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getUsersByRole(roleId) {
    try {
      const response = await apiClient.get(`/User/by-role/${roleId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getUserById(userId) {
    try {
      const response = await apiClient.get(`/User/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getTrainers() {
    try {
      const response = await apiClient.get('/User/trainers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateUser(userId,userDto) {
    try {
      const response = await apiClient.put(`/User/${userId}`,userDto);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      const response = await apiClient.delete(`/User/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getUserStatistics(startDate,endDate) {
    try {
      const response = await apiClient.get('/User/statistics',{
        params: {
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateAvatar(userId,avatarUrl) {
    try {
      const response = await apiClient.put(`/User/${userId}/avatar`,{ AvatarUrl: avatarUrl });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateStatus(userId,status) {
    try {
      const response = await apiClient.put(`/User/${userId}/status`,{ Status: status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getDeletedUsers(queryParams = {}) {
    try {
      const response = await apiClient.get('/User/deleted',{
        params: {
          PageNumber: queryParams.pageNumber || 1,
          PageSize: queryParams.pageSize || 10,
          SearchTerm: queryParams.searchTerm,
          SortBy: queryParams.sortBy,
          SortOrder: queryParams.sortOrder,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async permanentlyDeleteUser(userId) {
    try {
      const response = await apiClient.delete(`/User/${userId}/permanent`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async restoreUser(userId,status = 'active') {
    try {
      const response = await apiClient.post(`/User/${userId}/restore`,{ Status: status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async restoreUsers(userIds,status = 'active') {
    try {
      const response = await apiClient.post('/User/restore',{ UserIds: userIds,Status: status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default apiUserService;