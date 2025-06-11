import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

export default function Step5({
  formData,
  handleMealPlanningFrequency,
  handleNextStep,
  handlePreviousStep,
  stepIndex,
  totalSteps,
}) {
  const navigation = useNavigation();
  const frequencyOptions = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

  // Handle back navigation
  const handleBack = () => {
    handlePreviousStep();
  };

  // Validate and proceed to next step
  const handleNext = () => {
    if (!formData.mealPlanningFrequency) {
      Alert.alert('Error', 'Please select a meal planning frequency.');
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
        <Text style={styles.title}>Meal Planning</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${((stepIndex + 1) / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.subtitle}>How often do you plan your meals in advance?</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {frequencyOptions.map((frequency) => (
            <TouchableOpacity
              key={frequency}
              style={styles.optionButton}
              onPress={() => handleMealPlanningFrequency(frequency)}
            >
              <Text style={styles.optionText}>{frequency}</Text>
              <View
                style={
                  formData.mealPlanningFrequency === frequency
                    ? styles.checkedBox
                    : styles.uncheckedBox
                }
              >
                {formData.mealPlanningFrequency === frequency && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
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
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    marginBottom: 10,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
  },
  checkedBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#1877F2',
    backgroundColor: '#1877F2',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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