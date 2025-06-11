import React, { useState, useContext } from 'react';
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
import { AuthContext } from 'context/AuthContext'; // Import AuthContext
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigation = useNavigation();
  const { setAuthToken, setUser, hasRole } = useContext(AuthContext);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const validateEmail = (text) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!text) {
      return 'Email is required.';
    }
    if (text.length > 255) {
      return 'Email must not exceed 255 characters.';
    }
    if (!emailRegex.test(text)) {
      return 'Invalid email format.';
    }
    return '';
  };

  const validatePassword = (text) => {
    if (!text) {
      return 'Password is required.';
    }
    if (text.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (text.length > 255) {
      return 'Password must not exceed 255 characters.';
    }
    return '';
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError(validateEmail(text));
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setPasswordError(validatePassword(text));
  };

  const handleLogin = async () => {
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);

    if (emailValid || passwordValid) {
      setEmailError(emailValid);
      setPasswordError(passwordValid);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiAuthService.login({ email, password });
      if (response.statusCode !== 200 || !response.data) {
        throw new Error(response.message || 'Login failed.');
      }

      const { accessToken, refreshToken, userId, username, roles } = response.data;
      if (!accessToken || !userId || !username || !Array.isArray(roles)) {
        throw new Error('Invalid login response data.');
      }
      await AsyncStorage.setItem('refreshToken', refreshToken);
      const userData = { userId, username, roles };
      setAuthToken(accessToken);
      setUser(userData);

      const targetScreen = hasRole('Admin') ? 'AdminDashboard' : 'Main';
      navigation.replace(targetScreen);

      Alert.alert('Success', 'Login successful!');
    } catch (error) {
      console.log('Login failed:', error.response?.status, error.message);
      let message = 'An error occurred. Please try again.';

      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors) {
          const errors = errorData.errors;
          if (errors.Email) {
            message = errors.Email[0] || 'Invalid email.';
          } else if (errors.Password) {
            message = errors.Password[0] || 'Invalid password.';
          }
        } else if (errorData.message) {
          message = errorData.message.includes('Email or password is incorrect.')
            ? 'Invalid email or password.'
            : errorData.message.includes('Account is pending.')
            ? 'Account not activated. Check your email.'
            : errorData.message.includes('Account is blocked.')
            ? 'Account locked. Contact support.'
            : errorData.message;
        }
      } else if (error.response?.status === 401) {
        message = 'Invalid credentials.';
      } else if (error.response?.status === 500) {
        message = 'Server error. Please try later.';
      }

      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const emailValid = validateEmail(email);
    if (emailValid) {
      setEmailError(emailValid);
      return;
    }
    navigation.navigate('Otp', { email });
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      // Replace with actual Facebook SDK integration
      const token = 'mock_facebook_token'; // Placeholder
      const response = await apiAuthService.facebookLogin({ token });
      if (response.statusCode !== 200 || !response.data) {
        throw new Error(response.message || 'Facebook login failed.');
      }

      const { accessToken, refreshToken, userId, username, roles } = response.data;
      if (!accessToken || !userId || !username || !Array.isArray(roles)) {
        throw new Error('Invalid Facebook login response data.');
      }

      // Update AuthContext
      const userData = { userId, username, roles };
      setAuthToken(accessToken);
      setUser(userData);

      // Navigate based on role
      const targetScreen = hasRole('Admin') ? 'AdminDashboard' : 'Main';
      navigation.replace(targetScreen);

      Alert.alert('Success', 'Logged in with Facebook!');
    } catch (error) {
      console.log('Facebook login failed:', error.response?.status, error.message);
      let message = 'Failed to log in with Facebook.';
      if (error.response?.status === 400) {
        message = error.response.data.message || 'Invalid Facebook token.';
      }
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const token = 'mock_google_token'; 
      const response = await apiAuthService.googleLogin({ token });
      if (response.statusCode !== 200 || !response.data) {
        throw new Error(response.message || 'Google login failed.');
      }

      const { accessToken, refreshToken, userId, username, roles } = response.data;
      if (!accessToken || !userId || !username || !Array.isArray(roles)) {
        throw new Error('Invalid Google login response data.');
      }

      const userData = { userId, username, roles };
      setAuthToken(accessToken);
      setUser(userData);

      const targetScreen = hasRole('Admin') ? 'AdminDashboard' : 'Main';
      navigation.replace(targetScreen);

      Alert.alert('Success', 'Logged in with Google!');
    } catch (error) {
      console.log('Google login failed:', error.response?.status, error.message);
      let message = 'Failed to log in with Google.';
      if (error.response?.status === 400) {
        message = error.response.data.message || 'Invalid Google token.';
      }
      Alert.alert('Error', message);
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
            <TouchableOpacity onPress={handleForgotPassword}>
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

// Styles remain unchanged
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