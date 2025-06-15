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
  (error) => Promise.reject(error),
);

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
        const response = await apiClient.post('/Auth/refresh-token',{ refreshToken });
        if (response.data.statusCode === 200 && response.data.data) {
          const { accessToken: newAccessToken,refreshToken: newRefreshToken } = response.data.data;
          await AsyncStorage.setItem('accessToken',newAccessToken);
          await AsyncStorage.setItem('refreshToken',newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Failed to refresh token in interceptor:',refreshError);
        await AsyncStorage.multiRemove(['accessToken','refreshToken','user']);
        throw refreshError;
      }
    }
    return Promise.reject(error);
  },
);

export const trainerService = {
  async getAllActiveServicePackage(queryParams = {}) {
    try {
      const response = await apiClient.get('/ServicePackage/all-active-package',{ params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getServicePackage(queryParams = {}) {
    try {
      const response = await apiClient.get('/ServicePackage',{ params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async fetchRelatedPackages(trainerId,packageId) {
    try {
      const response = await apiClient.get(`/ServicePackage/trainer${trainerId}/${packageId}/active`,{ packageId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getServicePackageById(id) {
    try {
      const response = await apiClient.get(`/ServicePackage/active/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getActiveServicePackage(id) {
    try {
      const response = await apiClient.get(`/ServicePackage/active/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getTrainerServicePackage(trainerId,packageId) {
    try {
      const response = await apiClient.get(`/ServicePackage/trainer/${trainerId}/${packageId}/active`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async createServicePackage(packageData) {
    try {
      const response = await apiClient.post('/ServicePackage',packageData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateServicePackage(id,packageData) {
    try {
      const response = await apiClient.put(`/ServicePackage/${id}`,packageData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteServicePackage(id) {
    try {
      const response = await apiClient.delete(`/ServicePackage/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async restoreServicePackage(id) {
    try {
      const response = await apiClient.post(`/ServicePackage/restore/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async restoreMultipleServicePackage(packageIds) {
    try {
      const response = await apiClient.post('/ServicePackage/restore-multiple',{ packageIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async restoreAllServicePackage() {
    try {
      const response = await apiClient.post('/ServicePackage/restore-all');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getServicePackageStatistics() {
    try {
      const response = await apiClient.get('/ServicePackage/statistics');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/api/userpayment',paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  initializePaymentSheet: async (paymentData) => {
    try {
      const response = await apiClient.post('/api/payment/initialize',paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getProgressPhotos: async (queryParams = {}) => {
    try {
      const params = new URLSearchParams({
        PageNumber: queryParams.pageNumber || 1,
        PageSize: queryParams.pageSize || 10,
        ...(queryParams.userId && { userId: queryParams.userId }),
        ...(queryParams.packageId && { packageId: queryParams.packageId }),
      }).toString();
      const response = await apiClient.get(`/api/progressphoto?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  uploadProgressPhoto: async (formData) => {
    try {
      const response = await apiClient.post('/api/progressphoto',formData,{
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const photoData = response.data;
      return {
        statusCode: response.status,
        data: photoData,
        message: 'Photo uploaded successfully',
      };
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getProgressComparisons: async (queryParams = {}) => {
    try {
      const params = new URLSearchParams({
        PageNumber: queryParams.pageNumber || 1,
        PageSize: queryParams.pageSize || 10,
        ...(queryParams.userId && { userId: queryParams.userId }),
      }).toString();
      const response = await apiClient.get(`/api/progresscomparison?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  createComparison: async (comparisonData) => {
    try {
      const response = await apiClient.post('/api/progresscomparison',comparisonData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },updateComparison: async (comparisonId,comparisonData) => {
    try {
      const response = await apiClient.put(`/api/progresscomparison/${comparisonId}`,comparisonData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default trainerService;