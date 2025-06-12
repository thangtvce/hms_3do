import React from 'react';
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

export default function Step1({
  formData,
  handleChange,
  handleNextStep,
  stepIndex,
  totalSteps,
}) {
  const navigation = useNavigation();
  const [firstNameError, setFirstNameError] = React.useState('');
  const handleFirstNameChange = (value) => {
    if (value.length > 255) {
      setFirstNameError('Name cannot exceed 255 characters.');
      return;
    }

    if (!value) {
      setFirstNameError('First name is required.');
      return;
    }
    handleChange('firstName', value);
    setFirstNameError('');
  }
  // Handle back navigation
  const handleBack = () => {
    navigation.navigate('Login');
  };

  // Validate and proceed to next step
  const handleNext = () => {
    if (!formData.firstName) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }
    if (formData.firstName.length > 255) {
      Alert.alert('Error', 'Name cannot exceed 255 characters.');
      return;
    }
    handleNextStep();
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
        <Text style={styles.label}>Please enter your name</Text>
        <TextInput
          style={styles.input}
          value={formData.firstName}
          onChangeText={(value) => handleFirstNameChange(value)}
          placeholder="Enter your name"
          placeholderTextColor="#A0A0A0"
          accessibilityLabel="First name input"
          maxLength={50}
        />
        {firstNameError ? (<Text style={{ color: 'red', marginBottom: 10 }}>{firstNameError}</Text>) : null}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.backButton, stepIndex === 0 && styles.backButtonDisabled]} disabled={stepIndex === 0}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} disabled={firstNameError !== "" || formData.firstName === ""} onPress={handleNext}>
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
    top:40,
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
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
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
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 25,
  },
  backButtonDisabled: {
    opacity: 0.5,
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