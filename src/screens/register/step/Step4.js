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

export default function Step4({
  formData,
  handleHealthyHabitToggle,
  handleNextStep,
  handlePreviousStep,
  stepIndex,
  totalSteps,
}) {
  const navigation = useNavigation();
  const habitsOptions = [
    'Eat more protein',
    'Plan meals more often',
    'Prep and cook meals',
    'Eat more fiber',
    'Move more',
    'Exercise more',
    'Track nutrition',
    'Track calories',
    'Track macros',
    'Eat mindfully',
    'Eat a balanced diet',
    'Eat whole foods',
    'Eat more vegetables',
    'Eat more fruits',
    'Drink more water',
    'Prioritize sleep',
    'Something else',
    'Not sure',
  ];

  // Handle back navigation
  const handleBack = () => {
    handlePreviousStep();
  };

  // Validate and proceed to next step
  const handleNext = () => {
    if (formData.healthyHabits.length === 0) {
      Alert.alert('Error', 'Please select at least one healthy habit.');
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
        <Text style={styles.title}>Healthy Habits</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${((stepIndex + 1) / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.subtitle}>Which healthy habits are most important to you?</Text>
        <Text style={styles.label}>Recommended for you</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {habitsOptions.map((habit, index) => (
              <TouchableOpacity
                key={habit}
                style={[
                  styles.habitButton,
                  index < 6 && styles.recommendedHabitButton,
                  formData.healthyHabits.includes(habit) && { backgroundColor: '#DBEAFE' },
                ]}
                onPress={() => handleHealthyHabitToggle(habit)}
              >
                <Text style={styles.habitText}>{habit}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  habitButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
    alignItems: 'center',
  },
  recommendedHabitButton: {
    borderWidth: 1,
    borderColor: '#1877F2',
  },
  habitText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#000000',
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