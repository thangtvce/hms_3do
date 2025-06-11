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

export default function Step12({
  formData,
  handleHeightChange,
  handleHeightUnitChange,
  handleNextStep,
  handlePreviousStep,
  stepIndex,
  totalSteps,
}) {
  const navigation = useNavigation();
  const [error, setError] = useState('');

  // Handle back navigation
  const handleBack = () => {
    handlePreviousStep();
  };

  // Validate height
  const validateHeight = () => {
    const heightNum = parseFloat(formData.height);
    if (!formData.height) {
      setError('Height is required.');
      return false;
    }
    if (isNaN(heightNum)) {
      setError('Please enter a valid number.');
      return false;
    }

    if (formData.heightUnit === 'cm') {
      if (heightNum < 50 || heightNum > 300) {
        setError('Please enter a valid height between 50 cm and 300 cm.');
        return false;
      }
    } else if (formData.heightUnit === 'ft') {
      if (heightNum < 1.5 || heightNum > 10) {
        setError('Please enter a valid height between 1.5 ft and 10 ft.');
        return false;
      }
    }

    setError('');
    return true;
  };

  // Handle next step
  const onNextStep = () => {
    if (validateHeight()) {
      handleNextStep();
    } else {
      Alert.alert('Error', error);
    }
  };

  // Validate on blur
  const onBlurHeight = () => {
    validateHeight();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TouchableOpacity style={styles.backButtonArrow} onPress={handleBack}>
        <Icon name="arrow-back" size={30} color="#000000" />
      </TouchableOpacity>
      <View style={styles.formCard}>
        <Text style={styles.title}>Personal Information</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${((stepIndex + 1) / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.subtitle}>What is your height?</Text>
        <Text style={styles.label}>This helps us calculate your nutritional needs.</Text>
        <View style={styles.unitContainer}>
          <TextInput
            style={styles.unitInput}
            value={formData.height}
            onChangeText={(value) => handleHeightChange(value.replace(/[^0-9.]/g, ''))}
            onBlur={onBlurHeight}
            placeholder="Enter your height"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
            accessibilityLabel="Height input"
            maxLength={6}
          />
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                formData.heightUnit === 'cm' && styles.unitButtonSelected,
              ]}
              onPress={() => handleHeightUnitChange('cm')}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  formData.heightUnit === 'cm' && styles.unitButtonTextSelected,
                ]}
              >
                cm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                formData.heightUnit === 'ft' && styles.unitButtonSelected,
              ]}
              onPress={() => handleHeightUnitChange('ft')}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  formData.heightUnit === 'ft' && styles.unitButtonTextSelected,
                ]}
              >
                ft
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
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
    textAlign: 'center',
  },
  inputLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    marginBottom: 5,
  },
  unitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  unitInput: {
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
  unitToggle: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  unitButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginLeft: 5,
  },
  unitButtonSelected: {
    borderColor: '#1877F2',
    backgroundColor: '#DBEAFE',
  },
  unitButtonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
  },
  unitButtonTextSelected: {
    color: '#1877F2',
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