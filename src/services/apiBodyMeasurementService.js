import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'https://a2d2-2402-800-63b5-930f-acd2-f39f-14cb-5625.ngrok-free.app/api/v1',
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
    console.log(`Response: ${response.config.url}`, { status: response.status });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(`Response error for ${originalRequest.url}:`, JSON.stringify(error.response?.data, null, 2));

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
        throw new Error('Failed to refresh token');
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        throw new Error('Unauthorized access, please log in again.');
      }
    }

    if (error.response?.status === 400 && error.response?.data?.errors) {
      const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
      throw new Error(errorMessages || 'Invalid request data.');
    }

    throw new Error(error.response?.data?.message || error.message);
  }
);

export const bodyMeasurementService = {
  async getAllMeasurements(queryParams = {}) {
    try {
      const response = await apiClient.get('/BodyMeasurement', { params: queryParams });
      console.log('getAllMeasurements response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMeasurementsByUserId(userId, queryParams = {}) {
    try {
      const response = await apiClient.get(`/BodyMeasurement/user/${userId}`, { params: queryParams });
      console.log('getMeasurementsByUserId response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMyMeasurements(queryParams = {}) {
    try {
      const response = await apiClient.get('/BodyMeasurement/me', { params: queryParams });
      console.log('getMyMeasurements response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('getMyMeasurements error:', error);
      throw error;
    }
  },

  async getMeasurementById(measurementId) {
    try {
      const response = await apiClient.get(`/BodyMeasurement/${measurementId}`);
      console.log('getMeasurementById response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async addMeasurement(measurementData) {
    try {
      const response = await apiClient.post('/BodyMeasurement', measurementData);
      console.log('addMeasurement response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('addMeasurement error:', error);
      throw error;
    }
  },

  async updateMeasurement(measurementId, measurementData) {
    try {
      const response = await apiClient.put(`/BodyMeasurement/${measurementId}`, measurementData);
      console.log('updateMeasurement response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteMeasurement(measurementId) {
    try {
      const response = await apiClient.delete(`/BodyMeasurement/${measurementId}`);
      console.log('deleteMeasurement response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getUserStatistics(userId, startDate, endDate) {
    try {
      const params = { startDate, endDate };
      const response = await apiClient.get(`/BodyMeasurement/user/${userId}/statistics`, { params });
      console.log('getUserStatistics response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMyStatistics(startDate, endDate) {
    try {
      const params = { startDate, endDate };
      const response = await apiClient.get('/BodyMeasurement/me/statistics', { params });
      console.log('getMyStatistics response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getAverageMeasurementsByPeriod(userId, period) {
    try {
      const response = await apiClient.get(`/BodyMeasurement/user/${userId}/average/period`, { params: { period } });
      console.log('getAverageMeasurementsByPeriod response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMyAverageMeasurementsByPeriod(period) {
    try {
      const response = await apiClient.get('/BodyMeasurement/me/average/period', { params: { period } });
      console.log('getMyAverageMeasurementsByPeriod response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default bodyMeasurementService;