import React, { useState } from 'react';
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
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import apiAuthService from 'services/apiAuthService';
import { useNavigation } from '@react-navigation/native';
import FlashMessage from 'react-native-flash-message';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Handle input changes with length validation
  const handleEmailChange = (text) => {
    if (text.length > 255) {
      Alert.alert('Error', 'The email must not exceed 255 characters.');
      return;
    }
    setEmail(text);
  };

  const handlePasswordChange = (text) => {
    if (text.length > 255) {
      Alert.alert('Error', 'The email must not exceed 255 characters.');
      return;
    }
    setPassword(text);
  };

  const handleLogin = async () => {
    // Validate empty fields
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      console.log('Login validation failed: Missing email or password');
      return;
    }

    // Validate email format using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Invalid email format. Please check and try again.');
      console.log('Login validation failed: Invalid email format');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiAuthService.login({ email, password });
      console.log('Login response:', response);
      Alert.alert('Success', 'Login success!');
      navigation.replace('Main');
    } catch (error) {
      console.log('Login failed with status:', error.response?.status);
      let message = 'An error has occurred. Please try again.';

      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors) {
          const errors = errorData.errors;
          if (errors.Email) {
            if (errors.Email.includes('Email is required.')) {
              message = 'Please enter your email.';
            } else if (errors.Email.includes('Invalid email format.')) {
              message = 'Invalid email format. Please check and try again.';
            }
          } else if (errors.Password) {
            if (errors.Password.includes('Password is required.')) {
              message = 'Please enter the password.';
            } else if (errors.Password.includes('Password must be at least 6 characters.')) {
              message = 'The password must be at least 6 characters long.';
            }
          }
        } else if (errorData.message) {
          if (errorData.message.includes('Email or password is incorrect.')) {
            message = 'Email or password is incorrect. Please try again.';
          } else if (errorData.message.includes('Account is pending.')) {
            message = 'The account has not been activated yet. Please check your email to activate it.';
          } else if (errorData.message.includes('Account is blocked.')) {
            message = 'The account has been locked. Please contact support.';
          } else {
            message = errorData.message;
          }
        }
      } else if (error.response?.status === 401) {
        message = 'An authentication error has occurred. Please try again.';
      } else if (error.response?.status === 500) {
        message = 'Server error. Please try again later.';
      }

      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email to reset the password.');
      console.log('Forgot password validation failed: Missing email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Invalid email format. Please check and try again.');
      console.log('Forgot password validation failed: Invalid email format');
      return;
    }
    navigation.navigate('Otp', { email });
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      console.log('Facebook login simulated');
      Alert.alert('Success', 'Logged in with Facebook successfully!');
      navigation.replace('Main');
    } catch (error) {
      console.log('Facebook login failed with status:', error.response?.status);
      let message = 'Cannot log in with Facebook. Please try again.';
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.message) {
          if (errorData.message.includes('Invalid Facebook token.')) {
            message = 'Invalid Facebook token. Please try again.';
          } else if (errorData.message.includes('Account is pending.')) {
            message = 'The account has not been activated yet. Please check your email to activate.';
          } else if (errorData.message.includes('Account is blocked.')) {
            message = 'The account has been locked. Please contact support.';
          } else {
            message = errorData.message;
          }
        }
      }
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      console.log('Google login simulated');
      Alert.alert('Success', 'Logged in with Google successfully!');
      navigation.replace('Main');
    } catch (error) {
      console.log('Google login failed with status:', error.response?.status);
      let message = 'Cannot log in with Google. Please try again.';
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.message) {
          if (errorData.message.includes('Invalid Google token.')) {
            message = 'Invalid Google token. Please try again.';
          } else if (errorData.message.includes('Account is pending.')) {
            message = 'The account has not been activated yet. Please check your email to activate.';
          } else if (errorData.message.includes('Account is blocked.')) {
            message = 'The account has been locked. Please contact support.';
          } else {
            message = errorData.message;
          }
        }
      }
      Alert.alert('Lỗi', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.innerContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>3DO APP</Text>
          <View style={styles.bottom}></View>
        </View>
        <Text style={styles.welcome}>Welcome F88</Text>
        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color="#757575" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#757575"
            value={email}
            onChangeText={handleEmailChange}
            maxLength={255}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#757575" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#757575"
              value={password}
              onChangeText={handlePasswordChange}
              maxLength={255}
              secureTextEntry
            />
          </View>
          <View style={styles.forgotPasswordContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Otp')}>
              <Text style={styles.forgotPasswordText}>Forget Password?</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={styles.loginButton}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>LOG IN</Text>
            )}
          </TouchableOpacity>
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>Or connect using</Text>
            <View style={styles.separatorLine} />
          </View>
          <View style={styles.socialContainer}>
            <TouchableOpacity onPress={handleFacebookLogin} disabled={isLoading} style={styles.socialButton}>
              <FontAwesome name="facebook" size={24} color="#1877F2" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGoogleLogin} disabled={isLoading} style={styles.googleButton}>
              <FontAwesome name="google" size={24} color="#DB4437" style={styles.socialIcon} />
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Don't have an account, Sign up</Text>
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
    marginBottom: 300,
  },
  headerContainer: {
    backgroundColor: '#1877f2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 0,
    alignItems: 'center',
    width: '100%',
    height: '42%',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 35,
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
    position: 'absolute',
    bottom: 20,
  },
  bottom: {
    backgroundColor: '#FFFFFF',
    width: '115%',
    height: '30%',
    top: 270,
    borderRadius: 50,
  },
  welcome: {
    fontFamily: 'Inter_600SemiBold',
    color: '#000000',
    fontSize: 30,
    backgroundColor: '#FFFFFF',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    height: '58%',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 5,
    marginBottom: 10,
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
  forgotPasswordContainer: {
    width: '80%',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontFamily: 'Inter_400Regular',
    color: '#757575',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#1877f2',
    borderRadius: 5,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 10,
    width: '80%',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  socialContainer: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  socialButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#000000',
    borderWidth: 1,
    flexDirection: 'row',
  },
  socialButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#000000',
    fontSize: 16,
    marginLeft: 10,
  },
  googleButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#000000',
    borderWidth: 1,
    flexDirection: 'row',
  },
  googleButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#000000',
    fontSize: 16,
    marginLeft: 10,
  },
  socialIcon: {
    marginRight: 10,
  },
  registerText: {
    fontFamily: 'Inter_400Regular',
    color: '#000000',
    fontSize: 17,
    top: 115,
    padding: 13,
    borderRadius: 10,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '80%',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    marginHorizontal: 10,
    color: '#757575',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});