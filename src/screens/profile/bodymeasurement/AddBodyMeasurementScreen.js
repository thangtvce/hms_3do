import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bodyMeasurementService } from 'services/apiBodyMeasurementService';
import { useAuth } from 'context/AuthContext';

export default function AddBodyMeasurementScreen({ navigation }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    weight: '',
    bodyFatPercentage: '',
    chestCm: '',
    waistCm: '',
    hipCm: '',
    bicepCm: '',
    thighCm: '',
    neckCm: '',
    notes: '',
  });

  const handleSubmit = async () => {
    try {
      if (!user || !user.userId) {
        Alert.alert('Error', 'You are not authenticated. Please log in.');
        navigation.replace('Login');
        return;
      }

      // Validate inputs
      const weight = formData.weight ? parseFloat(formData.weight) : null;
      if (!weight || weight < 0.1 || weight > 500) {
        Alert.alert('Error', 'Weight must be between 0.1 and 500 kg.');
        return;
      }

      const bodyFatPercentage = formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : null;
      if (bodyFatPercentage !== null && (bodyFatPercentage < 0 || bodyFatPercentage > 100)) {
        Alert.alert('Error', 'Body fat percentage must be between 0 and 100.');
        return;
      }

      const chestCm = formData.chestCm ? parseFloat(formData.chestCm) : null;
      if (chestCm !== null && (chestCm < 10 || chestCm > 300)) {
        Alert.alert('Error', 'Chest measurement must be between 10 and 300 cm.');
        return;
      }

      const waistCm = formData.waistCm ? parseFloat(formData.waistCm) : null;
      if (waistCm !== null && (waistCm < 10 || waistCm > 300)) {
        Alert.alert('Error', 'Waist measurement must be between 10 and 300 cm.');
        return;
      }

      const hipCm = formData.hipCm ? parseFloat(formData.hipCm) : null;
      if (hipCm !== null && (hipCm < 10 || hipCm > 300)) {
        Alert.alert('Error', 'Hip measurement must be between 10 and 300 cm.');
        return;
      }

      const bicepCm = formData.bicepCm ? parseFloat(formData.bicepCm) : null;
      if (bicepCm !== null && (bicepCm < 10 || bicepCm > 300)) {
        Alert.alert('Error', 'Bicep measurement must be between 10 and 300 cm.');
        return;
      }

      const thighCm = formData.thighCm ? parseFloat(formData.thighCm) : null;
      if (thighCm !== null && (thighCm < 10 || thighCm > 300)) {
        Alert.alert('Error', 'Thigh measurement must be between 10 and 300 cm.');
        return;
      }

      const neckCm = formData.neckCm ? parseFloat(formData.neckCm) : null;
      if (neckCm !== null && (neckCm < 10 || neckCm > 300)) {
        Alert.alert('Error', 'Neck measurement must be between 10 and 300 cm.');
        return;
      }

      const notes = formData.notes || null;
      if (notes && notes.length > 500) {
        Alert.alert('Error', 'Notes cannot exceed 500 characters.');
        return;
      }

      const payload = {
        UserId: user.userId,
        MeasurementDate: new Date().toISOString().split('T')[0],
        Weight: weight,
        BodyFatPercentage: bodyFatPercentage,
        ChestCm: chestCm,
        WaistCm: waistCm,
        HipCm: hipCm,
        BicepCm: bicepCm,
        ThighCm: thighCm,
        NeckCm: neckCm,
        Notes: notes,
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      const response = await bodyMeasurementService.addMeasurement(payload);
      console.log('Response:', JSON.stringify(response, null, 2));

      if (response.statusCode === 201) {
        Alert.alert('Success', 'Body measurement added successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to add body measurement.');
      }
    } catch (error) {
      console.error('Error adding measurement:', error);
      Alert.alert('Error', error.message || 'Failed to add body measurement.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Body Measurement</Text>
      </View>
      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Weight (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter weight"
            keyboardType="numeric"
            value={formData.weight}
            onChangeText={(text) => setFormData({ ...formData, weight: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Body Fat Percentage (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter body fat percentage"
            keyboardType="numeric"
            value={formData.bodyFatPercentage}
            onChangeText={(text) => setFormData({ ...formData, bodyFatPercentage: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Chest (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter chest measurement"
            keyboardType="numeric"
            value={formData.chestCm}
            onChangeText={(text) => setFormData({ ...formData, chestCm: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Waist (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter waist measurement"
            keyboardType="numeric"
            value={formData.waistCm}
            onChangeText={(text) => setFormData({ ...formData, waistCm: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Hip (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter hip measurement"
            keyboardType="numeric"
            value={formData.hipCm}
            onChangeText={(text) => setFormData({ ...formData, hipCm: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bicep (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter bicep measurement"
            keyboardType="numeric"
            value={formData.bicepCm}
            onChangeText={(text) => setFormData({ ...formData, bicepCm: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Thigh (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter thigh measurement"
            keyboardType="numeric"
            value={formData.thighCm}
            onChangeText={(text) => setFormData({ ...formData, thighCm: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Neck (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter neck measurement"
            keyboardType="numeric"
            value={formData.neckCm}
            onChangeText={(text) => setFormData({ ...formData, neckCm: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter notes"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
          />
        </View>
        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Add Measurement</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginTop:30,
    textAlign: 'center',

  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 16,
    flex: 0.5,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    margin: 16,
  },
  formContent: {
    paddingBottom: 32,
  },
  inputContainer: {
    marginBottom: 12,
    width: '100%',

  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
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