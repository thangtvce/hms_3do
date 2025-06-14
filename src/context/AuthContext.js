import React, { createContext, useEffect, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/apiAuthService';
import jwtDecode from 'jwt-decode';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimer, setRefreshTimer] = useState(null);

  const validateUserData = (userData) => {
    if (!userData || typeof userData !== 'object') return false;
    const { userId, email, roles } = userData;
    return (
      userId &&
      typeof userId === 'number' &&
      email &&
      typeof email === 'string' &&
      Array.isArray(roles) &&
      roles.every((role) => typeof role === 'string')
    );
  };

  const validateToken = (token) => {
    return typeof token === 'string' && token.length > 0;
  };

  const loadToken = async () => {
    try {
      setLoading(true);
      const [token, refreshToken, userData] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken'),
        AsyncStorage.getItem('user'),
      ]);

      console.log('Loaded token:', token ? 'Exists' : 'Null');
      console.log('Loaded refreshToken:', refreshToken ? 'Exists' : 'Null');
      console.log('Loaded user:', userData ? userData : 'Null');

      if (token && refreshToken && userData) {
        if (!validateToken(token) || !validateToken(refreshToken)) {
          console.log('Invalid token or refreshToken format');
          await logout();
          return;
        }

        let parsedUser;
        try {
          parsedUser = JSON.parse(userData);
          if (!validateUserData(parsedUser)) {
            console.log('Invalid user data format');
            await logout();
            return;
          }
        } catch (parseErr) {
          console.log('Failed to parse user data:', parseErr);
          await logout();
          return;
        }

        try {
          const decoded = jwtDecode(token);
          const { exp } = decoded;
          if (!exp || typeof exp !== 'number') {
            console.log('Token missing or invalid expiration');
            await tryRefreshToken(refreshToken, parsedUser);
            return;
          }

          const currentTime = Math.floor(Date.now() / 1000); 
          if (exp > currentTime) {
            setAuthToken(token);
            setUser(parsedUser);
            scheduleTokenRefresh(token);
          } else {
            console.log('Token expired, attempting to refresh');
            await tryRefreshToken(refreshToken, parsedUser);
          }
        } catch (decodeErr) {
          console.log('Failed to decode token:', decodeErr);
          await tryRefreshToken(refreshToken, parsedUser);
        }
      } else {
        console.log('Missing token, refreshToken, or user data');
        setAuthToken(null);
        setUser(null);
      }
    } catch (err) {
      console.log('Failed to load token or user:', err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const tryRefreshToken = async (refreshToken, parsedUser) => {
    try {
      const response = await authService.refreshToken();
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response;
      if (validateToken(newAccessToken) && validateToken(newRefreshToken)) {
        setAuthToken(newAccessToken);
        setUser(parsedUser);
        scheduleTokenRefresh(newAccessToken);
      } else {
        await logout();
      }
    } catch (refreshErr) {
      console.log('Token refresh failed:', refreshErr);
      await logout();
    }
  };

  const scheduleTokenRefresh = (token) => {
    try {
      const decoded = jwtDecode(token);
      const { exp } = decoded;
      if (!exp || typeof exp !== 'number') {
        console.warn('Token does not contain valid expiration time, refreshing immediately');
        refreshAccessToken();
        return;
      }
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = exp - currentTime;
      console.log(`Token expires in ${timeLeft} seconds`);

      if (timeLeft <= 300) {
        console.log('Token near expiration, refreshing immediately');
        refreshAccessToken();
      } else {
        console.log(`Scheduling token refresh in ${timeLeft - 300} seconds`);
        const timeout = setTimeout(refreshAccessToken, (timeLeft - 300) * 1000);
        setRefreshTimer(timeout);
      }
    } catch (err) {
      console.log('Failed to decode token in scheduleTokenRefresh:', err);
      refreshAccessToken();
    }
  };

  const refreshAccessToken = async () => {
    try {
      console.log('Attempting to refresh access token');
      const response = await authService.refreshToken();
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response;

      if (!validateToken(newAccessToken) || !validateToken(newRefreshToken)) {
        throw new Error('Invalid tokens returned from refresh');
      }

      setAuthToken(newAccessToken);
      console.log('Token refreshed successfully');
      scheduleTokenRefresh(newAccessToken);
    } catch (err) {
      console.log('Failed to refresh token:', err);
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
      console.log('Logout failed:', err);
    }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    console.log('User logged out, storage cleared');
  };

  const hasRole = (role) => {
    if (!user || !Array.isArray(user.roles)) return false;
    return user.roles.includes(role);
  };

  useEffect(() => {
    loadToken();
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ authToken, user, loading, refreshAccessToken, logout, hasRole, setAuthToken, setUser }}
    >
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