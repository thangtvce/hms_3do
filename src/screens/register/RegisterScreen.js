import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Step1 from '../register/step/Step1';
import Step2 from '../register/step/Step2';
import Step3 from '../register/step/Step3';
import Step4 from '../register/step/Step4';
import Step5 from '../register/step/Step5';
import Step6 from '../register/step/Step6';
import Step7 from '../register/step/Step7';
import Step8 from '../register/step/Step8';
import Step9 from '../register/step/Step9';
import Step10 from '../register/step/Step10';
import Step11 from '../register/step/Step11';
import Step12 from '../register/step/Step12';
import Step13 from '../register/step/Step13';
import Step14 from '../register/step/Step14';
import { authService } from '../../services/apiAuthService';
import { profileService } from '../../services/apiProfileService';

export default function RegisterScreen({ navigation }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 14;
  const [formData, setFormData] = useState({
    firstName: '',
    goals: [],
    barriers: [],
    healthyHabits: [],
    mealPlanningFrequency: '',
    wantsMealPlans: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    rememberMe: false,
    age: '',
    height: '',
    heightUnit: 'cm',
    weight: '',
    weightUnit: 'kg',
    recipePreferences: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleGoalToggle = (goal) => {
    setFormData((prev) => {
      const goals = prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal];
      return { ...prev, goals };
    });
  };

  const handleBarrierToggle = (barrier) => {
    setFormData((prev) => {
      const barriers = prev.barriers.includes(barrier)
        ? prev.barriers.filter((b) => b !== barrier)
        : [...prev.barriers, barrier];
      return { ...prev, barriers };
    });
  };

  const handleHealthyHabitToggle = (habit) => {
    setFormData((prev) => {
      const healthyHabits = prev.healthyHabits.includes(habit)
        ? prev.healthyHabits.filter((h) => h !== habit)
        : [...prev.healthyHabits, habit];
      return { ...prev, healthyHabits };
    });
  };

  const handleMealPlanningFrequency = (frequency) => {
    setFormData((prev) => ({ ...prev, mealPlanningFrequency: frequency }));
  };

  const handleWantsMealPlans = (option) => {
    setFormData((prev) => ({ ...prev, wantsMealPlans: option }));
  };

  const handleHeightChange = (value) => {
    setFormData((prev) => ({ ...prev, height: value }));
  };

  const handleHeightUnitChange = (unit) => {
    setFormData((prev) => ({ ...prev, heightUnit: unit }));
  };

  const handleWeightChange = (value) => {
    setFormData((prev) => ({ ...prev, weight: value }));
  };

  const handleWeightUnitChange = (unit) => {
    setFormData((prev) => ({ ...prev, weightUnit: unit }));
  };

  const handleRecipePreferenceToggle = (preference) => {
    setFormData((prev) => {
      const recipePreferences = prev.recipePreferences.includes(preference)
        ? prev.recipePreferences.filter((p) => p !== preference)
        : [...prev.recipePreferences, preference];
      return { ...prev, recipePreferences };
    });
  };

  const handleNextStep = () => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleBackStep = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleRegister = async () => {
    const { email, password, phone, firstName, height, heightUnit, weight, weightUnit, goals, recipePreferences } = formData;
    if (!email || !password || !phone || !firstName) {
      Alert.alert('Error', 'Please fill in all required fields (email, password, phone, first name).');
      console.log('Registration failed: Missing fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Invalid email format. Please try again.');
      console.log('Registration failed: Invalid email format');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'Phone number must be 10 digits.');
      console.log('Registration failed: Invalid phone format');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // Đăng ký user
      const registerResponse = await authService.register({
        username: email,
        password,
        fullName: firstName,
        email,
        phone,
        roles: ['User'],
      });

      if (registerResponse.statusCode === 200) {
        // Lấy userId từ response hoặc login ngay sau để lấy token
        const loginResponse = await authService.login({ email, password });
        if (loginResponse.statusCode === 200 && loginResponse.data?.data?.userId) {
          const userId = loginResponse.data.data.userId;

          // Tính BMI
          let heightInMeters = parseFloat(height);
          if (heightUnit === 'ft') {
            heightInMeters = heightInMeters * 0.3048; // Chuyển ft sang m
          } else {
            heightInMeters = heightInMeters / 100; // Chuyển cm sang m
          }
          let weightInKg = parseFloat(weight);
          if (weightUnit === 'lb') {
            weightInKg = weightInKg * 0.453592; // Chuyển lb sang kg
          }
          const bmi = weightInKg / (heightInMeters ** 2);

          // Chuẩn bị profileData
          const profileData = {
            userId,
            height: parseFloat(height),
            weight: parseFloat(weight),
            bmi: parseFloat(bmi.toFixed(1)),
            bodyFatPercentage: null, // Có thể thêm logic để tính
            activityLevel: formData.mealPlanningFrequency || null,
            dietaryPreference: recipePreferences.join(',') || null,
            fitnessGoal: goals.join(',') || null,
          };

          // Thêm hồ sơ
          const profileResponse = await profileService.addProfile(profileData);
          if (profileResponse.statusCode === 201) {
            console.log('Profile created successfully:', profileResponse.data);
            Alert.alert('Success', 'Registration and profile creation successful! Please check your email to activate.');
            navigation.replace('Login');
          } else {
            Alert.alert('Error', profileResponse.message || 'Failed to create profile.');
          }
        } else {
          Alert.alert('Error', 'Login failed after registration.');
        }
      } else {
        let message = registerResponse.message || 'Failed to register.';
        if (registerResponse.statusCode === 400 && registerResponse.errors) {
          const errors = registerResponse.errors;
          if (errors.Username) message = 'Username must be at least 3 characters.';
          else if (errors.Password) message = 'Password must be at least 6 characters.';
          else if (errors.FullName) message = 'Full name is required.';
          else if (errors.Email) message = 'Invalid email format.';
          else if (errors.Phone) message = 'Phone number must be 10 digits.';
          else if (registerResponse.message?.includes('already exists')) message = 'Email already exists.';
        }
        Alert.alert('Error', message);
      }
    } catch (error) {
      console.log('Registration error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData,
      handleChange,
      handleNextStep,
      handlePreviousStep: handleBackStep,
      stepIndex,
      totalSteps,
      handleGoalToggle,
      handleBarrierToggle,
      handleHealthyHabitToggle,
      handleMealPlanningFrequency,
      handleWantsMealPlans,
      handleHeightChange,
      handleHeightUnitChange,
      handleWeightChange,
      handleWeightUnitChange,
      handleRecipePreferenceToggle,
      handleRegister,
      showPassword,
      setShowPassword,
      showConfirmPassword,
      setShowConfirmPassword,
      rememberMe: formData.rememberMe,
      setRememberMe: (value) => setFormData((prev) => ({ ...prev, rememberMe: value })),
    };

    switch (stepIndex) {
      case 0: return <Step1 {...stepProps} />;
      case 1: return <Step2 {...stepProps} />;
      case 2: return <Step3 {...stepProps} />;
      case 3: return <Step4 {...stepProps} />;
      case 4: return <Step5 {...stepProps} />;
      case 5: return <Step6 {...stepProps} />;
      case 6: return <Step7 {...stepProps} />;
      case 7: return <Step8 {...stepProps} />;
      case 8: return <Step9 {...stepProps} />;
      case 9: return <Step10 {...stepProps} />;
      case 10: return <Step11 {...stepProps} />;
      case 11: return <Step12 {...stepProps} />;
      case 12: return <Step13 {...stepProps} />;
      case 13: return <Step14 {...stepProps} />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
});