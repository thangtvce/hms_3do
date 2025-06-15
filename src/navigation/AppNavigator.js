import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View,ActivityIndicator } from 'react-native';
import { AuthProvider,useAuth } from 'context/AuthContext';
import LoginScreen from 'screens/login/LoginScreen';
import RegisterScreen from 'screens/register/RegisterScreen';
import BottomTabNavigator from 'navigation/BottomTabNavigator';
import OtpScreen from 'screens/forgetpassword/OtpScreen';
import ForgetPassword from 'screens/forgetpassword/ForgetPassword';
import SettingsScreen from 'screens/setting/SettingsScreen';
import ProfileScreen from 'screens/profile/ProfileScreen';
import CommunityScreen from 'screens/community/CommunityScreen';
import GroupScreen from 'screens/community/GroupsScreen';
import EditProfileScreen from 'screens/profile/EditProfileScreen';
import AddBodyMeasurementScreen from 'screens/profile/bodymeasurement/AddBodyMeasurementScreen';
import AddWeightHistoryScreen from 'screens/profile/weight/AddWeightHistoryScreen';
import ChangePasswordScreen from 'screens/profile/ChangePasswordScreen';
import BodyMeasurementsScreen from 'screens/profile/bodymeasurement/BodyMeasurementsScreen';
import WeightHistoryScreen from 'screens/profile/weight/WeightHistoryScreen';
import EditUserScreen from 'screens/profile/EditUserScreen';
import EditWeightScreen from 'screens/profile/weight/EditWeightScreen';
import FoodListScreen from 'screens/food/FoodListScreen';
import FoodDetailsScreen from 'screens/food/FoodDetailsScreen';
import WorkoutScreen from 'screens/workout/WorkoutScreen';
import CategoryDetailsScreen from 'screens/workout/CategoryDetailsScreen';
import ExerciseDetailsScreen from 'screens/workout/ExerciseDetailsScreen';
import NotificationScreen from 'screens/notification/NotificationScreen';
import StepCounterScreen from 'screens/notification/StepCounterScreen';
import FoodScannerScreen from 'screens/food/FoodScannerScreen';
import ServicePackageScreen from 'screens/servicePackage/ServicePackageScreen';
import PackageDetailScreen from 'screens/servicePackage/PackageDetailScreen';
import PaymentScreen from 'screens/servicePackage/PaymentScreen';
import QRPaymentScreen from 'screens/payment/QRPaymentScreen';
import PaymentSuccessScreen from 'screens/servicePackage/PaymentSuccessScreen';
import PaymentCancelledScreen from 'screens/servicePackage/PaymentCancelledScreen';
import MySubscriptionScreen from 'screens/subscription/MySubscriptionScreen';
import SubscriptionDetailScreen from 'screens/subscription/SubscriptionDetailScreen';
import ActiveGroupsScreen from 'screens/community/ActiveGroupsScreen';
import GroupDetailsScreen from 'screens/community/GroupDetailsScreen';
import CreatePostScreen from 'screens/community/CreatePostScreen';
import EditPostScreen from 'screens/community/EditPostScreen';

const Stack = createStackNavigator();

function RootNavigator() {
  const { user,loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={{ flex: 1,justifyContent: 'center',alignItems: 'center' }}>
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
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      <Stack.Screen name="Main" component={BottomTabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="AddBodyMeasurement" component={AddBodyMeasurementScreen} />
      <Stack.Screen name="AddWeightHistory" component={AddWeightHistoryScreen} />
      <Stack.Screen name="EditWeightScreen" component={EditWeightScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="BodyMeasurements" component={BodyMeasurementsScreen} />
      <Stack.Screen name="WeightHistory" component={WeightHistoryScreen} />
      <Stack.Screen name="EditUserScreen" component={EditUserScreen} />
      <Stack.Screen name="EditWeight" component={EditWeightScreen} />
      <Stack.Screen name="Food" component={FoodListScreen} />
      <Stack.Screen name="FoodDetails" component={FoodDetailsScreen} />
      <Stack.Screen name="Workouts" component={WorkoutScreen} />
      <Stack.Screen name="CategoryDetails" component={CategoryDetailsScreen} />
      <Stack.Screen name="ExerciseDetails" component={ExerciseDetailsScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="StepCounter" component={StepCounterScreen} />
      <Stack.Screen name="FoodScannerScreen" component={FoodScannerScreen} />
      <Stack.Screen name="ServicePackage" component={ServicePackageScreen} />
      <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="QRPaymentScreen" component={QRPaymentScreen} />
      <Stack.Screen name="PaymentSuccessScreen" component={PaymentSuccessScreen} />
      <Stack.Screen name="PaymentCancelled" component={PaymentCancelledScreen} />
      <Stack.Screen name="MySubscriptionScreen" component={MySubscriptionScreen} />
      <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
      <Stack.Screen name="ActiveGroups" component={ActiveGroupsScreen} />
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <Stack.Screen name="CreatePostScreen" component={CreatePostScreen} />
      <Stack.Screen name="EditPostScreen" component={EditPostScreen} />
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