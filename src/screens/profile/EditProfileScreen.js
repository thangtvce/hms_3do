import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { profileService } from 'services/apiProfileService';
import { useAuth } from 'context/AuthContext';

export default function EditProfileScreen({ navigation, route }) {
  const { user } = useAuth();
  const initialProfile = route.params?.profile || {};
  const [formData, setFormData] = useState({
    height: initialProfile.height || '',
    weight: initialProfile.weight || '',
    bodyFatPercentage: initialProfile.bodyFatPercentage || '',
    activityLevel: initialProfile.activityLevel || '',
    dietaryPreference: initialProfile.dietaryPreference || '',
    fitnessGoal: initialProfile.fitnessGoal || '',
  });

  const handleSubmit = async () => {
    try {
      const response = await profileService.updateProfile(user.userId, {
        ...formData,
        userId: user.userId,
        height: parseFloat(formData.height) || 0,
        weight: parseFloat(formData.weight) || 0,
        bodyFatPercentage: parseFloat(formData.bodyFatPercentage) || 0,
      });
      if (response.statusCode === 200) {
        Alert.alert('Success', 'Profile updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Height (cm)"
          keyboardType="numeric"
          value={formData.height.toString()}
          onChangeText={(text) => setFormData({ ...formData, height: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          keyboardType="numeric"
          value={formData.weight.toString()}
          onChangeText={(text) => setFormData({ ...formData, weight: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Body Fat Percentage (%)"
          keyboardType="numeric"
          value={formData.bodyFatPercentage.toString()}
          onChangeText={(text) => setFormData({ ...formData, bodyFatPercentage: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Activity Level"
          value={formData.activityLevel}
          onChangeText={(text) => setFormData({ ...formData, activityLevel: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Dietary Preference"
          value={formData.dietaryPreference}
          onChangeText={(text) => setFormData({ ...formData, dietaryPreference: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Fitness Goal"
          value={formData.fitnessGoal}
          onChangeText={(text) => setFormData({ ...formData, fitnessGoal: text })}
        />
        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Save Changes</Text>
        </TouchableOpacity>
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
  },
  form: {
    margin: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});