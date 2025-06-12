import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { weightHistoryService } from 'services/apiWeightHistoryService';
import { useAuth } from 'context/AuthContext';

export default function AddWeightHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ weight: '' });

  const handleSubmit = async () => {
    try {
      if (!formData.weight || isNaN(parseFloat(formData.weight))) {
        Alert.alert('Error', 'Please enter a valid weight.');
        return;
      }
      const response = await weightHistoryService.addWeightHistory({
        userId: user.userId,
        weight: parseFloat(formData.weight),
        recordedAt: new Date().toISOString(),
      });
      if (response.statusCode === 201) {
        Alert.alert('Success', 'Weight history added successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to add weight history.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add weight history.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Weight History</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          keyboardType="numeric"
          value={formData.weight}
          onChangeText={(text) => setFormData({ ...formData, weight: text })}
        />
        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Add Weight</Text>
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
      marginTop: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 16,
    marginTop
    : 30,
    textAlign: 'center',
    flex: 0.5,
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