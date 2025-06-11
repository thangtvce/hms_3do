import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from 'screens/home/HomeScreen';
import ProfileScreen from 'screens/profile/ProfileScreen';
import SettingsScreen from 'screens/setting/SettingsScreen';
import CommunityScreen from 'screens/community/CommunityScreen'; // Thêm

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = 'home-outline';
              break;
            case 'Profile':
              iconName = 'compass-outline';
              break;
            case 'Settings':
              iconName = 'settings-outline';
              break;
            case 'Community':
              iconName = 'people-outline'; // Biểu tượng cho Community
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5722',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 60,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: '#fff',
          position: 'absolute',
        },
        tabBarLabelStyle: { fontSize: 12, paddingBottom: 5 },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
}