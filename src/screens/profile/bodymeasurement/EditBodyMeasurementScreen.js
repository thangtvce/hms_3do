import React,{ useState,useEffect } from 'react';
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
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bodyMeasurementService } from 'services/apiBodyMeasurementService';
import { useAuth } from 'context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator } from 'react-native';
import DynamicStatusBar from 'screens/statusBar/DynamicStatusBar';
import { theme } from 'theme/color';
import FloatingMenuButton from 'components/FloatingMenuButton';

const { width,height } = Dimensions.get("window")

export default function EditBodyMeasurementScreen({ navigation,route }) {
    const { user } = useAuth();
    const { measurement } = route.params;
    const [formData,setFormData] = useState({
        weight: measurement.weight?.toString() || '',
        height: measurement.height?.toString() || '',
        bodyFatPercentage: measurement.bodyFatPercentage?.toString() || '',
        chestCm: measurement.chestCm?.toString() || '',
        waistCm: measurement.waistCm?.toString() || '',
        hipCm: measurement.hipCm?.toString() || '',
        bicepCm: measurement.bicepCm?.toString() || '',
        thighCm: measurement.thighCm?.toString() || '',
        neckCm: measurement.neckCm?.toString() || '',
        notes: measurement.notes || '',
    });

    const [activeField,setActiveField] = useState(null);
    const [isSubmitting,setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!measurement) {
            Alert.alert('Error','No measurement data provided.');
            navigation.goBack();
        }
    },[measurement,navigation]);

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
                MeasurementId: measurement.measurementId,
                UserId: user.userId,
                MeasurementDate: measurement.measurementDate || new Date().toISOString().split('T')[0],
                Weight: weight,
                Height: height,
                BodyFatPercentage: bodyFatPercentage,
                ChestCm: formData.chestCm
                    ? parseFloat(formData.chestCm) : null,
                WaistCm: formData.waistCm ? parseFloat(formData.waistCm) : null,
                HipCm: formData.hipCm ? parseFloat(formData.hipCm) : null,
                BicepCm: formData.bicepCm ? parseFloat(formData.bicepCm) : null,
                ThighCm: formData.thighCm ? parseFloat(formData.thighCm) : null,
                NeckCm: formData.neckCm ? parseFloat(formData.neckCm) : null,
                Notes: notes,
            };

            setIsSubmitting(true);
            const response = await bodyMeasurementService.updateMeasurement(measurement.measurementId,payload);
            console.log('Response:',JSON.stringify(response,null,2));

            if (response.statusCode === 200) {
                Alert.alert('Success','Body measurement updated successfully.',[
                    { text: 'OK',onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('Error',response.message || 'Failed to update body measurement.');
            }
        } catch (error) {
            console.log('Error updating measurement:',error);
            Alert.alert('Error',error.message || 'Failed to update body measurement.');
        } finally {
            setIsSubmitting(false);
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
                    activeField === field && styles.activeInput,
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
                    {field === 'bodyFatPercentage' &&
                        <Text style={styles.unitText}>%</Text>}
                    {(field !== 'weight' && field !== 'height' && field !== 'bodyFatPercentage' && field !== 'notes') &&
                        <Text style={styles.unitText}>cm</Text>}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <DynamicStatusBar backgroundColor={theme.primaryColor} />
            <LinearGradient colors={["#4F46E5","#6366F1","#818CF8"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Body Measurement</Text>
                    <View style={styles.headerRight} />
                </View>
            </LinearGradient>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : null}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
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

                    <TouchableOpacity
                        onPress={handleSubmit}
                        style={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={20} color="#FFFFFF" style={styles.submitIcon} />
                                <Text style={styles.submitButtonText}>Save Measurement</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.bottomPadding} />
                </ScrollView>
            </KeyboardAvoidingView>
            <FloatingMenuButton
                initialPosition={{ x: width - 70,y: height - 100 }}
                autoHide={true}
                navigation={navigation}
                autoHideDelay={4000}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.primaryColor
    },
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        paddingBottom: 16,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        color: "#fff"
    },
    headerTitle: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 18,
        color: "#FFFFFF",
        textAlign: "center",
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#4F46E5",
        paddingVertical: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 8,
        ...Platform.select({
            ios: {
                shadowColor: "#4F46E5",
                shadowOffset: { width: 0,height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
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