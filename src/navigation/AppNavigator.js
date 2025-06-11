import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from 'screens/login/LoginScreen';
import RegisterScreen from 'screens/register/RegisterScreen';
import BottomTabNavigator from 'navigation/BottomTabNavigator';
import { AuthProvider } from '../context/AuthContext'; // import mới
import OtpScreen from 'screens/forgetpassword/OtpScreen';
import ForgetPassword from 'screens/forgetpassword/ForgetPassword';
import SettingsScreen from 'screens/setting/SettingsScreen';
import ProfileScreen from 'screens/profile/ProfileScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Main" component={BottomTabNavigator} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
           <Stack.Screen name="Otp" component={OtpScreen} />
          <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
