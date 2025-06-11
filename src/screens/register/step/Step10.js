import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

export default function Step10({
  formData,
  handleChange,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  rememberMe,
  setRememberMe,
  handleNextStep,
  handlePreviousStep,
  stepIndex,
  totalSteps,
}) {
  const navigation = useNavigation();
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  // Handle back navigation
  const handleBack = () => {
    handlePreviousStep();
  };

  const validateInputs = () => {
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    };
    let hasError = false;

    // Check required fields
    if (!formData.email) {
      newErrors.email = 'Email is required.';
      hasError = true;
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
      hasError = true;
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required.';
      hasError = true;
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required.';
      hasError = true;
    }

    // If no missing fields, proceed with other validations
    if (!hasError) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email.';
        hasError = true;
      }

      // Validate password length
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
        hasError = true;
      }

      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
        hasError = true;
      }

      // Validate phone number format
      if (!/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = 'Phone number must be 10 digits.';
        hasError = true;
      }
    }

    setErrors(newErrors);
    if (hasError) {
      Alert.alert('Error', 'Please correct the errors in the form.');
      return false;
    }
    return true;
  };

  const onNextStep = () => {
    if (validateInputs()) {
      handleNextStep();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TouchableOpacity style={styles.backButtonArrow} onPress={handleBack}>
        <Icon name="arrow-back" size={30} color="#000000" />
      </TouchableOpacity>
      <View style={styles.formCard}>
        <Text style={styles.title}>Set Up Account</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${((stepIndex + 1) / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.subtitle}>Let's set up your account.</Text>

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholder="Enter your email"
          placeholderTextColor="#A0A0A0"
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email input"
        />
        {errors.email ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.email}</Text>
          </View>
        ) : null}

        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            placeholder="Enter your password"
            placeholderTextColor="#A0A0A0"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            accessibilityLabel="Password input"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {errors.password ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.password}</Text>
          </View>
        ) : null}

        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            placeholder="Confirm your password"
            placeholderTextColor="#A0A0A0"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            accessibilityLabel="Confirm password input"
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Text style={styles.toggleText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          </View>
        ) : null}

        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(value) => handleChange('phone', value.replace(/[^0-9]/g, ''))}
          placeholder="Enter your phone number (10 digits)"
          placeholderTextColor="#A0A0A0"
          keyboardType="numeric"
          accessibilityLabel="Phone number input"
        />
        {errors.phone ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.phone}</Text>
          </View>
        ) : null}

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View
              style={
                rememberMe ? styles.checkedBox : styles.uncheckedBox
              }
            >
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>Remember me</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={onNextStep}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    zIndex: 0,
  },
  backButtonArrow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    top: 40,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1877F2',
    borderRadius: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    marginBottom: 10,
  },
  inputLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
  },
  toggleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1877F2',
    marginLeft: 10,
  },
  errorContainer: {
    width: '100%',
    marginBottom: 10,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#CC0000',
  },
  checkboxContainer: {
    width: '100%',
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkedBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#1877F2',
    backgroundColor: '#1877F2',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 24,
    color: '#000000',
  },
  nextButton: {
    backgroundColor: '#1877F2',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  nextButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});