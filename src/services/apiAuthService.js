import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'https://deba-2402-800-63b5-930f-556-5cca-e20-f136.ngrok-free.app/api',
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

export const authService = {
  async register({ username, password, fullName, email, phone, roles = ['User'] }) {
    try {
      const response = await apiClient.post('/Auth/register', { username, password, fullName, email, phone, roles });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async login({ email, password }) {
    try {
      const response = await apiClient.post('/Auth/login', { email, password });
      if (response.data.statusCode === 200 && response.data.data) {
        const { accessToken, refreshToken, userId, username, roles } = response.data.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify({ userId, email: username, roles }));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async googleLogin({ token }) {
    try {
      const response = await apiClient.post('/Auth/google-login', { token });
      if (response.data.statusCode === 200 && response.data.data) {
        const { accessToken, refreshToken, userId, username, roles } = response.data.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify({ userId, email: username, roles }));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async facebookLogin({ token }) {
    try {
      const response = await apiClient.post('/Auth/facebook-login', { token });
      if (response.data.statusCode === 200 && response.data.data) {
        const { accessToken, refreshToken, userId, username, roles } = response.data.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify({ userId, email: username, roles }));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async activateAccount({ userId, token }) {
    try {
      const response = await apiClient.get(`/Auth/activate?userId=${userId}&token=${encodeURIComponent(token)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    try {
      const response = await apiClient.post('/Auth/logout');
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token available');
      const response = await apiClient.post('/Auth/refresh-token', { refreshToken });
      if (response.data.statusCode === 200 && response.data.data) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
        await AsyncStorage.setItem('accessToken', newAccessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      throw error;
    }
  },

  async forgotPassword({ email }) {
    try {
      const response = await apiClient.post('/Auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async changePassword({ email }) {
    try {
      const response = await apiClient.post('/Auth/change-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async resetPassword({ email, otpCode, newPassword }) {
    try {
      const response = await apiClient.post('/Auth/reset-password', { email, otpCode, newPassword });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default authService;