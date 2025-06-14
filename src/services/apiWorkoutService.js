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
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log(`Request: ${config.url}`,{ method: config.method,params: config.params });
      }
      return config;
    } catch (error) {
      console.log(`Request interceptor error for ${config.url}:`,error.message);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.log('Request interceptor failed:',error.message);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response: ${response.config.url}`,{ status: response.status });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const errorResponse = error.response?.data || {};
    const status = error.response?.status || 500;
    const message = errorResponse.message || 'An unexpected error occurred';
    const devMessage = errorResponse.devMessage || error.message;

    console.log(`Response error for ${originalRequest.url}:`,{
      status,
      message,
      devMessage,
      data: errorResponse.data,
    });

    if (status === 401) {
      console.warn('401 Unauthorized, skipping token refresh for debugging');
      throw new Error(message || 'Unauthorized access');
    }

    throw new Error(message);
  }
);

export const workoutService = {

  async getAllActiveActivities({ pageNumber = 1,pageSize = 10 } = {}) {
    try {
      const response = await apiClient.get('/UserActivity/all-active-activities',{
        params: {
          pageNumber,
          pageSize,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch activities');
    }
  },


  async getAllExercises(queryParams) {
    try {
      const response = await apiClient.get('/FitnessExercise',{
        params: {
          PageNumber: queryParams.PageNumber,
          pageSize: queryParams.PageSize,
          CategoryId: queryParams?.CategoryId,
          searchTerm: queryParams.SearchTerm,
        },
      });
      console.log('Data:',response.data.data.exercises);
      return response.data.data.exercises;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch exercises');
    }
  },


  async getAllActiveCategories({ pageNumber = 1,pageSize = 10 } = {}) {
    try {
      const response = await apiClient.get('/ExerciseCategory/all-active-categories',{
        params: {
          pageNumber,
          pageSize,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch categories');
    }
  },
  async getAllCategories() {
    try {
      const response = await apiClient.get('ExerciseCategory/all-active-categories');
      console.log('Data:',response.data.data);

      return response.data.data.categories;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch categories');
    }
  },

  async getAllActiveActivityTypes({ pageNumber = 1,pageSize = 10 } = {}) {
    try {
      const response = await apiClient.get('/ActivityType/all-active-types',{
        params: {
          pageNumber,
          pageSize,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch activity types');
    }
  },
};

export default workoutService;