import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiAuthService from 'services/apiAuthService';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  // Pre-fill email from OtpScreen if provided
  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Handle input changes with validation
  const handleEmailChange = (text) => {
    if (text.length > 255) {
      Alert.alert('Error', 'Email cannot exceed 255 characters.');
      return;
    }
    setEmail(text);
  };

  const handleOtpChange = (text) => {
    if (text.length > 50) {
      Alert.alert('Error', 'OTP code cannot exceed 50 characters.');
      return;
    }
    setOtpCode(text);
  };

  const handleNewPasswordChange = (text) => {
    if (text.length > 255) {
      Alert.alert('Error', 'Password cannot exceed 255 characters.');
      return;
    }
    setNewPassword(text);
  };

  // Handle password reset
  const handleResetPassword = async () => {
    // Check for missing fields
    // if (!email || !otpCode || !newPassword) {
    //   Alert.alert('Error', 'Please fill in all fields.');
    //   console.log('Password reset failed: Missing fields');
    //   return;
    // }

    // // Validate email format using regex
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(email)) {
    //   Alert.alert('Error', 'Invalid email format. Please try again.');
    //   console.log('Password reset failed: Invalid email format');
    //   return;
    // }

    setIsLoading(true);
    try {
      const response = await apiAuthService.resetPassword({ email, otpCode, newPassword });
      console.log('Success:', response.message);
      Alert.alert('Success', response.message);
      navigation.replace('Login');
    } catch (error) {
      console.log('Password reset failed with status:', error.response?.data);
      let message = 'Failed to reset password. Please try again.';

      if (error.response?.status >= 400 || error.response?.data.statusCode >= 400) {
        const errorData = error.response.data;
        if (errorData.errors) {
          const errors = errorData.errors;
          if (errors.NewPassword) {
            setPasswordError(errors.NewPassword[0]);
            // message = 'New password must be at least 6 characters.';
          }
          if (errors.OtpCode) {
            setOtpError(errors.OtpCode[0]);
            // message = 'Invalid OTP code. Please try again.';
          }
        } else if (errorData.message) {
          // if (errorData.message.includes('Invalid email format.')) {
          //   message = 'Invalid email format. Please try again.';
          // } else {
          //   message = errorData.message;
          // }
          Alert.alert('Error', errorData.message);
        }
      }
      // } else if (error.response?.status === 500) {
      //   message = 'Server error. Please try again later.';
      // }

      // Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.navigate('Otp');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.innerContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={30} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.welcome}>Reset Password</Text>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#757575" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              // placeholder="Enter your email"
              // placeholderTextColor="#757575"
              value={email}
              disabled
              // onChangeText={handleEmailChange}
              // maxLength={255}
              // keyboardType="email-address"
              // autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Icon name="code" size={20} color="#757575" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter OTP code"
              placeholderTextColor="#757575"
              value={otpCode}
              onChangeText={handleOtpChange}
              maxLength={50}
              keyboardType="numeric"
            />
          </View>
          {otpError ? <Text style={{ color: 'red', marginBottom: 10 }}>{otpError}</Text> : null}
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#757575" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#757575"
              value={newPassword}
              onChangeText={handleNewPasswordChange}
              maxLength={255}
              secureTextEntry
            />
          </View>
          {passwordError ? <Text style={{ color: 'red', marginBottom: 10 }}>{passwordError}</Text> : null}
          <TouchableOpacity onPress={handleResetPassword} disabled={isLoading} style={styles.submitButton}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  innerContainer: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  welcome: {
    fontFamily: 'Inter_600SemiBold',
    color: '#000000',
    fontSize: 30,
    width: '100%',
    marginTop: Platform.OS === 'ios' ? 100 : 70,
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '99%',
    backgroundColor: '#ffffff',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#000000',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Inter_400Regular',
  },
  submitButton: {
    backgroundColor: '#1877f2',
    paddingVertical: 18,
    alignItems: 'center',
    width: '99%',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});