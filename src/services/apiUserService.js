import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize apiClient with base configuration
const apiClient = axios.create({
  baseURL: 'https://a2d2-2402-800-63b5-930f-acd2-f39f-14cb-5625.ngrok-free.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add token to headers
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

// Response interceptor: Log responses and handle errors
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

export const apiUserService = {
  // Get paginated list of users
  async getAllUsers(queryParams = {}) {
    try {
      const response = await apiClient.get('/User/manage-users', {
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

  // Get all users without pagination
  async getAllUsersNoPagination() {
    try {
      const response = await apiClient.get('/User/all-users');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get users by role
  async getUsersByRole(roleId) {
    try {
      const response = await apiClient.get(`/User/by-role/${roleId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await apiClient.get(`/User/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get trainers
  async getTrainers() {
    try {
      const response = await apiClient.get('/User/trainers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user
  async updateUser(userId, userDto) {
    try {
      const response = await apiClient.put(`/User/${userId}`, userDto);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete user (soft delete)
  async deleteUser(userId) {
    try {
      const response = await apiClient.delete(`/User/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user statistics
  async getUserStatistics(startDate, endDate) {
    try {
      const response = await apiClient.get('/User/statistics', {
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

  // Update user avatar
  async updateAvatar(userId, avatarUrl) {
    try {
      const response = await apiClient.put(`/User/${userId}/avatar`, { AvatarUrl: avatarUrl });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user status
  async updateStatus(userId, status) {
    try {
      const response = await apiClient.put(`/User/${userId}/status`, { Status: status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get deleted users (paginated)
  async getDeletedUsers(queryParams = {}) {
    try {
      const response = await apiClient.get('/User/deleted', {
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

  // Permanently delete user
  async permanentlyDeleteUser(userId) {
    try {
      const response = await apiClient.delete(`/User/${userId}/permanent`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Restore a single user
  async restoreUser(userId, status = 'active') {
    try {
      const response = await apiClient.post(`/User/${userId}/restore`, { Status: status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Restore multiple users
  async restoreUsers(userIds, status = 'active') {
    try {
      const response = await apiClient.post('/User/restore', { UserIds: userIds, Status: status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default apiUserService;