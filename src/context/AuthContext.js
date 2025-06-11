import React, { createContext, useEffect, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/apiAuthService';
import jwtDecode from 'jwt-decode';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshTimer, setRefreshTimer] = useState(null);

  const loadToken = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userData = await AsyncStorage.getItem('user');
      setAuthToken(token);
      if (userData) {
        setUser(JSON.parse(userData));
      }
      if (token) {
        scheduleTokenRefresh(token);
      }
    } catch (err) {
      console.error('Failed to load token or user', err);
    }
  };

  const scheduleTokenRefresh = (token) => {
    try {
      const decoded = jwtDecode(token);
      const { exp } = decoded;
      if (!exp) {
        console.warn('Token does not contain expiration time');
        return;
      }
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = exp - currentTime;
      console.log(`Token expires in ${timeLeft} seconds`);

      if (timeLeft <= 300) {
        refreshAccessToken();
      } else {
        const timeout = setTimeout(refreshAccessToken, (timeLeft - 300) * 1000);
        setRefreshTimer(timeout);
      }
    } catch (err) {
      console.error('Failed to decode token', err);
      // Không crash app, có thể logout hoặc bỏ qua
      // logout(); // Tùy chọn: Đăng xuất nếu token không hợp lệ
    }
  };

  const refreshAccessToken = async () => {
    try {
      const { accessToken: newAccessToken } = await authService.refreshToken();
      setAuthToken(newAccessToken);
      scheduleTokenRefresh(newAccessToken);
    } catch (err) {
      console.error('Failed to refresh token', err);
      await logout();
    }
  };

  const logout = async () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    setAuthToken(null);
    setUser(null);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  };

  useEffect(() => {
    loadToken();
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authToken, user, refreshAccessToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};