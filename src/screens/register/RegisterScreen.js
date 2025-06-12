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

import { authService } from 'services/apiAuthService';
// import { profileService } from 'services/apiProfileService';

export default function RegisterScreen({ navigation }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 14;
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');  
  const [phoneError, setPhoneError] = useState('');
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

  // Validate required fields
  // if (!email || !password || !phone || !firstName) {
  //   Alert.alert('Error', 'Please fill in all required fields (email, password, phone, first name).');
  //   console.log('Registration failed: Missing fields');
  //   return;
  // }

  // Email validation
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // if (!emailRegex.test(email)) {
  //   Alert.alert('Error', 'Invalid email format. Please try again.');
  //   console.log('Registration failed: Invalid email format');
  //   return;
  // }

  // Phone validation
  // const phoneRegex = /^\d{10}$/;
  // if (!phoneRegex.test(phone)) {
  //   Alert.alert('Error', 'Phone number must be exactly 10 digits with no spaces or special characters.');
  //   console.log('Registration failed: Invalid phone format');
  //   return;
  // }

  // Password validation
  // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
  // if (!passwordRegex.test(password)) {
  //   Alert.alert(
  //     'Error',
  //     'Password must be at least 6 characters and include at least one uppercase letter, one lowercase letter, and one number.'
  //   );
  //   console.log('Registration failed: Invalid password format');
  //   return;
  // }

  // if (formData.recipePreferences.length === 0) {
  //   Alert.alert('Error', 'Please select at least one recipe preference.');
  //   return;
  // }

  setIsLoading(true);
  try {
    // Register user
    const registerResponse = await authService.register({
      username: email,
      password,
      fullName: firstName,
      email,
      phone,
      roles: ['User'],
    });

    if (registerResponse.statusCode === 200) {
      // Login to get userId and tokens
      // const loginResponse = await authService.login({ email, password });
      // if (loginResponse.statusCode === 200 && loginResponse.data?.data?.userId) {
      //   const userId = loginResponse.data.data.userId;

      //   // Calculate BMI
      //   let heightInMeters = parseFloat(height) || 0;
      //   if (heightUnit === 'ft') {
      //     heightInMeters = heightInMeters * 0.3048; // Convert ft to m
      //   } else {
      //     heightInMeters = heightInMeters / 100; // Convert cm to m
      //   }
      //   let weightInKg = parseFloat(weight) || 0;
      //   if (weightUnit === 'lb') {
      //     weightInKg = weightInKg * 0.453592; // Convert lb to kg
      //   }
      //   const bmi = heightInMeters > 0 ? weightInKg / (heightInMeters ** 2) : 0;

      //   // Prepare profile data
      //   const profileData = {
      //     userId,
      //     height: parseFloat(height) || null,
      //     weight: parseFloat(weight) || null,
      //     bmi: bmi > 0 ? parseFloat(bmi.toFixed(1)) : null,
      //     bodyFatPercentage: null,
      //     activityLevel: formData.mealPlanningFrequency || null,
      //     dietaryPreference: recipePreferences.join(',') || null,
      //     fitnessGoal: goals.join(',') || null,
      //   };

      //   // Add user profile
      //   const profileResponse = await profileService.addProfile(profileData);
      //   if (profileResponse.statusCode === 201) {
      //     console.log('Profile created successfully:', profileResponse.data);
      //     Alert.alert(
      //       'Success',
      //       'Registration completed successfully! Please check your email to activate your account.'
      //     );
      //     navigation.replace('Login');
      //   } else {
      //     Alert.alert('Error', profileResponse.message || 'Failed to create user profile.');
      //   }
      // } else {
      //   Alert.alert('Error', loginResponse.message || 'Login failed after registration. Please try logging in manually.');
      // }


      // Create profile with hard coded values
      // const profileData = {
      //   userId: registerResponse.data.userId, // Assuming registerResponse contains userId
      //   height: 0,
      //   weight: 0,
      //   bmi: 0, // BMI will be calculated later
      //   bodyFatPercentage: 0,        
      // };
      // const profileResponse = await profileService.addProfile(profileData);
      // console.log('Profile created successfully:', profileResponse.data);
      // Redirect to login screen
      Alert.alert(
        'Success',
        'Registration completed successfully! Please check your email to activate your account.'
      );
      console.log('Registration successful:', registerResponse);
      navigation.replace('Login');

    } 
    // else {
    //   console.log('Register failed:', registerResponse);
    //   // Handle registration error
    //   let message = registerResponse.message || 'Failed to register.';
    //   if (registerResponse.statusCode === 400) {
    //     if (registerResponse.message?.includes('already exists')) {
    //       message = 'Email already exists. Please use a different email.';
    //     } else if (registerResponse.message?.includes('incorrect')) {
    //       message = 'Registration failed. Please check your email and password or try a different email.';
    //     } else if (registerResponse.errors) {
    //       const errors = registerResponse.errors;
    //       if (errors.Username) message = 'Username must be at least 3 characters.';
    //       else if (errors.Password) message = 'Password must meet complexity requirements.';
    //       else if (errors.FullName) message = 'Full name is required.';
    //       else if (errors.Email) message = 'Invalid email format.';
    //       else if (errors.Phone) message = 'Phone number must be 10 digits.';
    //     }
    //   }
    //   Alert.alert('Error', message);
    // }
  } catch (error) {
    console.log('Registration failed:', error.response?.data, error.message);

    if (error.response?.data.status >= 400 || error.response?.data.statusCode >= 400) {
      const errorData = error.response.data;
      if (errorData.errors) {
        const errors = errorData.errors;
        // if (errors.Username) errorMessage = errors.Username[0];
        // if (errors.Email) errorMessage = errors.Email[0];
        // if (errors.Password) errorMessage = errors.Password[0];
        // if (errors.FullName) errorMessage = errors.FullName[0];
        // if (errors.Phone) errorMessage = errors.Phone[0];
        if (errors.Email) setEmailError(errors.Email[0]);
        if (errors.Password) setPasswordError(errors.Password[0]);
        // if (errors.FullName) setConfirmPasswordError(errors.FullName[0]);
        if (errors.Phone) setPhoneError(errors.Phone[0]);
      } else if (errorData.message) {
        Alert.alert('Error', errorData.message);
      }      
      return;
    }

    // const errorMessage = error.message || error.Message || 'An unexpected error occurred during registration.';
    // console.log('Registration error:', {
    //   message: errorMessage,
    //   status: error.statusCode || error.status,
    //   details: error.errors || error,
    // });
    // Alert.alert('Error', errorMessage);
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
      isLoading,
      emailError,
      // setEmailError,
      passwordError,
      // setPasswordError,      
      phoneError,
      // setPhoneError,
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