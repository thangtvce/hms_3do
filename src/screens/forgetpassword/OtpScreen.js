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
export default function OtpScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });
  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  if (!fontsLoaded) {
    return null;
  }
  const handleEmailChange = (text) => {
    if (!text) {
      setEmailError('Please enter your email.');
      return;
    }

    if (text.length > 255) {
      Alert.alert('Error', 'The email must not exceed 255 characters.');
      return;
    }
    setEmail(text);
  };

  const handleSendOtp = async () => {
    // if (!email) {
    //   Alert.alert('Error', 'Please enter email.');
    //   return;
    // }
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(email)) {
    //   Alert.alert('Error', 'Invalid email format. Please check and try again.');
    //   return;
    // }
    setIsLoading(true);
    try {
      const response = await apiAuthService.forgotPassword({ email });
      console.log('Send success:', response.message);
      Alert.alert('Success', response.message);
      navigation.navigate('ForgetPassword', { email });
    } catch (error) {
      console.log('OTP request failed with status:', error.response?.data);
      // let message = 'An error occurred. Please try again.';

      if (error.response?.data.statusCode >= 400 || error.response?.data.status >= 400) {
        const errorData = error.response.data;
        if (errorData.errors) {        
          const errors = errorData.errors;       
          Alert.alert('Error', errors.Email[0]);
          // if (errors.Email && errors.Email.includes('Invalid email format.')) {
          //   // message = 'Invalid email format. Please check and try again.';
          // }
        } else if (errorData.message) {
          Alert.alert('Error', errorData.message);
          // if (errorData.message.includes('Invalid email format.')) {
          //   // message = 'Invalid email format. Please check and try again.';
          // } else {
          //   message = errorData.message;
          // }
        }
      }
      // } else if (error.response?.status === 404) {
      //   message = 'Email is not registered. Please try again.';
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
    navigation.navigate('Login');
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
        <Text style={styles.welcome}>Forget Password</Text>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#757575" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nhập email của bạn"
              placeholderTextColor="#757575"
              value={email}
              onChangeText={handleEmailChange}
              maxLength={255}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity onPress={handleSendOtp} disabled={isLoading} style={styles.submitButton}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
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
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 20,
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
  registerText: {
    color: '#000000',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 20,
  },
});