import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { weightHistoryService } from 'services/apiWeightHistoryService';

export default function EditWeightScreen({ navigation, route }) {
    const { historyId, weight, recordedAt, userId } = route.params;
    const [newWeight, setNewWeight] = useState(weight.toString());
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!newWeight || isNaN(parseFloat(newWeight))) {
            Alert.alert('Đầu vào không hợp lệ', 'Vui lòng nhập số hợp lệ cho cân nặng.');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                historyId,
                userId,
                weight: parseFloat(newWeight),
                recordedAt,
            };

            const response = await weightHistoryService.updateWeightHistory(historyId, payload);
            if (response.statusCode === 200) {
                Alert.alert('Thành công', 'Cân nặng đã được cập nhật thành công.', [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật cân nặng:", error.response?.data || error.message);
            Alert.alert('Lỗi', 'Không thể cập nhật mục cân nặng.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chỉnh sửa cân nặng</Text>
            </View>
            <View style={styles.formContainer}>
                <Text style={styles.label}>Cân nặng (kg)</Text>
                <TextInput
                    style={styles.input}
                    value={newWeight}
                    onChangeText={setNewWeight}
                    keyboardType="numeric"
                    placeholder="Nhập cân nặng"
                />
                <Text style={styles.dateText}>
                    Ngày ghi nhận: {new Date(recordedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </Text>
                <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    <Text style={styles.saveButtonText}>
                        {isLoading ? 'Đang lưu...' : 'Lưu'}
                    </Text>
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
        paddingTop: 40,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginLeft: 16,
    },
    formContainer: {
        padding: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    dateText: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
    },
    saveButton: {
        backgroundColor: '#4C51BF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#A5B4FC',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});