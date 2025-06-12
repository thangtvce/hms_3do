import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { weightHistoryService } from 'services/apiWeightHistoryService';
import { useAuth } from 'context/AuthContext';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function WeightHistoryScreen({ navigation }) {
    const { user, authToken } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFrame, setTimeFrame] = useState('all');

    const fetchWeightHistory = async () => {
        try {
            setLoading(true);
            if (user && authToken) {
                const response = await weightHistoryService.getMyWeightHistory({ pageNumber: 1, pageSize: 50 });
                if (response.statusCode === 200 && response.data) {
                    const sortedRecords = (response.data.records || []).sort((a, b) =>
                        new Date(b.recordedAt) - new Date(a.recordedAt)
                    );
                    setHistory(sortedRecords);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load weight history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeightHistory();
    }, [user, authToken]);

    const handleDelete = async (historyId) => {
        Alert.alert(
            "Delete Entry",
            "Are you sure you want to delete this weight entry?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    onPress: async () => {
                        try {
                            const response = await weightHistoryService.deleteWeightHistory(historyId);
                            if (response.statusCode === 200) {
                                // Gọi lại fetchWeightHistory để tải lại dữ liệu từ API
                                await fetchWeightHistory();
                                Alert.alert('Success', 'Weight entry deleted.');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete weight entry.');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (item) => {
        if (!user || !user.id) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
            return;
        }
        navigation.navigate('EditWeightScreen', {
            historyId: item.historyId,
            weight: item.weight,
            recordedAt: item.recordedAt,
            userId: user.id,
        });
    };

    const filterHistoryByTimeFrame = (data) => {
        const now = new Date();
        switch (timeFrame) {
            case '7days':
                return data.filter(item => {
                    const itemDate = new Date(item.recordedAt);
                    return (now - itemDate) <= 7 * 24 * 60 * 60 * 1000;
                });
            case '30days':
                return data.filter(item => {
                    const itemDate = new Date(item.recordedAt);
                    return (now - itemDate) <= 30 * 24 * 60 * 60 * 1000;
                });
            case 'all':
            default:
                return data;
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.listItem}>
            <View style={styles.itemContent}>
                <Text style={styles.listItemText}>
                    {new Date(item.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - **{item.weight} kg**
                </Text>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                        <Ionicons name="create" size={20} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.historyId)} style={styles.actionButton}>
                        <Ionicons name="trash" size={20} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const filteredHistory = filterHistoryByTimeFrame(history);
    const chartData = {
        labels: filteredHistory.slice(0, 8).reverse().map(item => 
            new Date(item.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        ),
        datasets: [{
            data: filteredHistory.slice(0, 8).reverse().map(item => item.weight)
        }]
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading weight history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Weight History</Text>
            </View>

            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, timeFrame === 'all' && styles.filterButtonActive]}
                    onPress={() => setTimeFrame('all')}
                >
                    <Text style={[styles.filterButtonText, timeFrame === 'all' && styles.filterButtonTextActive]}>All Time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, timeFrame === '7days' && styles.filterButtonActive]}
                    onPress={() => setTimeFrame('7days')}
                >
                    <Text style={[styles.filterButtonText, timeFrame === '7days' && styles.filterButtonTextActive]}>Last 7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, timeFrame === '30days' && styles.filterButtonActive]}
                    onPress={() => setTimeFrame('30days')}
                >
                    <Text style={[styles.filterButtonText, timeFrame === '30days' && styles.filterButtonTextActive]}>Last 30 Days</Text>
                </TouchableOpacity>
            </View>
            {filteredHistory.length > 0 ? (
                <>
                    <LineChart
                        data={chartData}
                        width={screenWidth - 32}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=" kg"
                        chartConfig={{
                            backgroundGradientFrom: '#F3E5F5',
                            backgroundGradientTo: '#E1BEE7',
                            decimalPlaces: 1,
                            color: (opacity = 1) => `rgba(103, 58, 183, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(66, 66, 66, ${opacity})`,
                            style: {
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: '#CE93D8',
                                shadowColor: '#AB47BC',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 6,
                                elevation: 5,
                            },
                            propsForDots: {
                                r: '6',
                                strokeWidth: '2',
                                stroke: '#8E24AA',
                            },
                            propsForLabels: {
                                fontSize: 10,
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            marginHorizontal: 16,
                            borderRadius: 16,
                        }}
                    />
                    <FlatList
                        data={filteredHistory}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.historyId.toString()}
                        contentContainerStyle={styles.flatListContent}
                    />
                </>
            ) : (
                <Text style={styles.noDataText}>No weight history available for this period.</Text>
            )}
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
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingHorizontal: 16,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#E0E7FF',
    },
    filterButtonActive: {
        backgroundColor: '#4C51BF',
    },
    filterButtonText: {
        color: '#4338CA',
        fontWeight: '600',
    },
    filterButtonTextActive: {
        color: '#FFFFFF',
    },
    listItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    itemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listItemText: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        padding: 4,
    },
    noDataText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#2563EB',
        textAlign: 'center',
        marginTop: 20,
    },
    flatListContent: {
        paddingBottom: 20,
    },
});