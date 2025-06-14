import React,{ useState } from 'react';
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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bodyMeasurementService } from 'services/apiBodyMeasurementService';
import { useAuth } from 'context/AuthContext';

export default function AddBodyMeasurementScreen({ navigation }) {
  const { user } = useAuth();
  const [formData,setFormData] = useState({
    weight: '',
    height: '',
    bodyFatPercentage: '',
    chestCm: '',
    waistCm: '',
    hipCm: '',
    bicepCm: '',
    thighCm: '',
    neckCm: '',
    notes: '',
  });

  const [activeField,setActiveField] = useState(null);

  const handleSubmit = async () => {
    try {
      if (!user || !user.userId) {
        Alert.alert('Error','You are not authenticated. Please log in.');
        navigation.replace('Login');
        return;
      }

      // Validate required field
      if (!formData.weight.trim()) {
        Alert.alert('Error','Weight is required.');
        return;
      }

      // Validate inputs
      const weight = formData.weight ? parseFloat(formData.weight) : null;
      if (!weight || isNaN(weight) || weight < 0.1 || weight > 500) {
        Alert.alert('Error','Weight must be between 0.1 and 500 kg.');
        return;
      }

      // Validate height
      const height = formData.height ? parseFloat(formData.height) : null;
      if (height !== null && (isNaN(height) || height < 50 || height > 300)) {
        Alert.alert('Error','Height must be between 50 and 300 cm.');
        return;
      }

      const bodyFatPercentage = formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : null;
      if (bodyFatPercentage !== null && (isNaN(bodyFatPercentage) || bodyFatPercentage < 0 || bodyFatPercentage > 100)) {
        Alert.alert('Error','Body fat percentage must be between 0 and 100.');
        return;
      }

      // Validate all measurements with the same pattern
      const validateMeasurement = (value,name,min = 10,max = 300) => {
        const parsed = value ? parseFloat(value) : null;
        if (parsed !== null && (isNaN(parsed) || parsed < min || parsed > max)) {
          Alert.alert('Error',`${name} measurement must be between ${min} and ${max} cm.`);
          return false;
        }
        return true;
      };

      if (!validateMeasurement(formData.chestCm,'Chest')) return;
      if (!validateMeasurement(formData.waistCm,'Waist')) return;
      if (!validateMeasurement(formData.hipCm,'Hip')) return;
      if (!validateMeasurement(formData.bicepCm,'Bicep')) return;
      if (!validateMeasurement(formData.thighCm,'Thigh')) return;
      if (!validateMeasurement(formData.neckCm,'Neck')) return;

      const notes = formData.notes || null;
      if (notes && notes.length > 500) {
        Alert.alert('Error','Notes cannot exceed 500 characters.');
        return;
      }

      const payload = {
        UserId: user.userId,
        MeasurementDate: new Date().toISOString().split('T')[0],
        Weight: weight,
        Height: height,
        BodyFatPercentage: bodyFatPercentage,
        ChestCm: formData.chestCm ? parseFloat(formData.chestCm) : null,
        WaistCm: formData.waistCm ? parseFloat(formData.waistCm) : null,
        HipCm: formData.hipCm ? parseFloat(formData.hipCm) : null,
        BicepCm: formData.bicepCm ? parseFloat(formData.bicepCm) : null,
        ThighCm: formData.thighCm ? parseFloat(formData.thighCm) : null,
        NeckCm: formData.neckCm ? parseFloat(formData.neckCm) : null,
        Notes: notes,
      };

      console.log('Sending payload:',JSON.stringify(payload,null,2));
      const response = await bodyMeasurementService.addMeasurement(payload);
      console.log('Response:',JSON.stringify(response,null,2));

      if (response.statusCode === 201) {
        Alert.alert('Success','Body measurement added successfully.',[
          { text: 'OK',onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error',response.message || 'Failed to add body measurement.');
      }
    } catch (error) {
      console.log('Error adding measurement:',error);
      Alert.alert('Error',error.message || 'Failed to add body measurement.');
    }
  };

  const renderInputField = (label,placeholder,field,icon,required = false) => {
    return (
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <Ionicons name={icon} size={18} color="#64748B" style={styles.labelIcon} />
          <Text style={styles.label}>
            {label} {required && <Text style={styles.requiredStar}>*</Text>}
          </Text>
        </View>
        <View style={[
          styles.inputWrapper,
          activeField === field && styles.activeInput
        ]}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={formData[field]}
            onChangeText={(text) => setFormData({ ...formData,[field]: text })}
            onFocus={() => setActiveField(field)}
            onBlur={() => setActiveField(null)}
          />
          {field === 'weight' && <Text style={styles.unitText}>kg</Text>}
          {field === 'height' && <Text style={styles.unitText}>cm</Text>}
          {field === 'bodyFatPercentage' && <Text style={styles.unitText}>%</Text>}
          {(field !== 'weight' && field !== 'height' && field !== 'bodyFatPercentage' && field !== 'notes') &&
            <Text style={styles.unitText}>cm</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Body Measurement</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Primary Measurements</Text>
            {renderInputField('Weight','Enter weight','weight','scale-outline',true)}
            {renderInputField('Height','Enter height','height','resize-outline')}
            {renderInputField('Body Fat','Enter body fat percentage','bodyFatPercentage','analytics-outline')}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Body Measurements</Text>
            <View style={styles.measurementsGrid}>
              <View style={styles.measurementColumn}>
                {renderInputField('Chest','Enter chest','chestCm','body-outline')}
                {renderInputField('Waist','Enter waist','waistCm','ellipse-outline')}
                {renderInputField('Hip','Enter hip','hipCm','ellipse-outline')}
              </View>
              <View style={styles.measurementColumn}>
                {renderInputField('Bicep','Enter bicep','bicepCm','fitness-outline')}
                {renderInputField('Thigh','Enter thigh','thighCm','barbell-outline')}
                {renderInputField('Neck','Enter neck','neckCm','shirt-outline')}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Ionicons name="document-text-outline" size={18} color="#64748B" style={styles.labelIcon} />
                <Text style={styles.label}>Notes</Text>
              </View>
              <View style={[
                styles.inputWrapper,
                styles.notesWrapper,
                activeField === 'notes' && styles.activeInput
              ]}>
                <TextInput
                  style={[styles.input,styles.notesInput]}
                  placeholder="Enter any additional notes"
                  placeholderTextColor="#94A3B8"
                  multiline={true}
                  numberOfLines={4}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData,notes: text })}
                  onFocus={() => setActiveField('notes')}
                  onBlur={() => setActiveField(null)}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Ionicons name="save-outline" size={20} color="#FFFFFF" style={styles.submitIcon} />
            <Text style={styles.submitButtonText}>Save Measurement</Text>
          </TouchableOpacity>

          {/* Add extra padding at the bottom to ensure the form is scrollable past the bottom tab bar */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0,height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerRight: {
    width: 40,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0,height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  measurementsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measurementColumn: {
    width: '48%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  activeInput: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#0F172A',
  },
  unitText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  notesWrapper: {
    alignItems: 'flex-start',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0,height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 80,
  },
});