import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from 'context/AuthContext';
import LoginScreen from 'screens/login/LoginScreen';
import RegisterScreen from 'screens/register/RegisterScreen';
import BottomTabNavigator from 'navigation/BottomTabNavigator';
import OtpScreen from 'screens/forgetpassword/OtpScreen';
import ForgetPassword from 'screens/forgetpassword/ForgetPassword';
import SettingsScreen from 'screens/setting/SettingsScreen';
import ProfileScreen from 'screens/profile/ProfileScreen';
import CommunityScreen from 'screens/community/CommunityScreen'; 
import GroupScreen from 'screens/community/GroupsScreen'; 

const Stack = createStackNavigator();

function RootNavigator() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={user ? 'Main' : 'Login'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Main" component={BottomTabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="Group" component={GroupScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}