import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from 'services/apiAuthService';
import { useAuth } from 'context/AuthContext';

export default function ChangePasswordScreen({ navigation }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    otpCode: '',
    newPassword: '',
  });
  const [otpRequested, setOtpRequested] = useState(false);

  const handleRequestOtp = async () => {
    try {
      const response = await authService.forgotPassword({ email: formData.email });
      if (response.statusCode === 200) {
        Alert.alert('Success', 'OTP sent to your email.');
        setOtpRequested(true);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to request OTP.');
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await authService.resetPassword({
        email: formData.email,
        otpCode: formData.otpCode,
        newPassword: formData.newPassword,
      });
      if (response.statusCode === 200) {
        Alert.alert('Success', 'Password changed successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change password.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          editable={!otpRequested}
        />
        {!otpRequested ? (
          <TouchableOpacity onPress={handleRequestOtp} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Request OTP</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="OTP Code"
              value={formData.otpCode}
              onChangeText={(text) => setFormData({ ...formData, otpCode: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={formData.newPassword}
              onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
            />
            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Change Password</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    top: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 16,
        top: 30,
        flex: 0.5,
    textAlign: 'center',

  },
  form: {
marginTop: 30,
  },
  input: {
    borderWidth: '1',
    borderColor: '#E5E7EB',
    borderRadius: '8',
    padding: '12',
    marginBottom: 12,

    fontSize: '16',
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: '12',
    borderRadius: '10',
    alignItems: 'center',
    marginTop: '16',
  },
  submitButtonText: {
    fontSize: '16',
    color: '#fff',
    fontWeight: '600',
  },
});