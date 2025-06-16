import React,{ useState,useEffect,useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Dimensions,
    RefreshControl,
    ActivityIndicator,
    SafeAreaView,
    Platform,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { weightHistoryService } from 'services/apiWeightHistoryService';
import { useAuth } from 'context/AuthContext';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import DynamicStatusBar from 'screens/statusBar/DynamicStatusBar';
import { theme } from 'theme/color';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;

export default function WeightHistoryScreen({ navigation }) {
    const { user,authToken } = useAuth();
    const [history,setHistory] = useState([]);
    const [loading,setLoading] = useState(true);
    const [refreshing,setRefreshing] = useState(false);
    const [timeFrame,setTimeFrame] = useState('all');
    const [stats,setStats] = useState({
        current: 0,
        lowest: 0,
        highest: 0,
        average: 0,
        change: 0,
    });

    const fetchWeightHistory = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            if (user && authToken) {
                const response = await weightHistoryService.getMyWeightHistory({ pageNumber: 1,pageSize: 100 });
                if (response.statusCode === 200 && response.data) {
                    const sortedRecords = (response.data.records || []).sort((a,b) =>
                        new Date(b.recordedAt) - new Date(a.recordedAt)
                    );
                    setHistory(sortedRecords);
                    calculateStats(sortedRecords);
                }
            }
        } catch (error) {
            console.log('Error fetching weight history:',error);
            Alert.alert('Error','Failed to load weight history. Please try again later.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (data) => {
        if (!data || data.length === 0) {
            setStats({
                current: 0,
                lowest: 0,
                highest: 0,
                average: 0,
                change: 0,
            });
            return;
        }

        const weights = data.map(item => item.weight);
        const current = data[0].weight;
        const lowest = Math.min(...weights);
        const highest = Math.max(...weights);
        const average = weights.reduce((sum,weight) => sum + weight,0) / weights.length;
        const change = data.length > 1 ? current - data[data.length - 1].weight : 0;

        setStats({
            current: parseFloat(current.toFixed(1)),
            lowest: parseFloat(lowest.toFixed(1)),
            highest: parseFloat(highest.toFixed(1)),
            average: parseFloat(average.toFixed(1)),
            change: parseFloat(change.toFixed(1)),
        });
    };

    useEffect(() => {
        fetchWeightHistory();
    },[user,authToken]);

    useFocusEffect(
        useCallback(() => {
            fetchWeightHistory();
        },[])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchWeightHistory(false);
    };

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
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await weightHistoryService.deleteWeightHistory(historyId);
                            if (response.statusCode === 200) {
                                await fetchWeightHistory();
                                Alert.alert('Success','Weight entry deleted successfully.');
                            }
                        } catch (error) {
                            Alert.alert('Error','Failed to delete weight entry.');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (item) => {
        if (!user || !user.userId) {
            Alert.alert('Error','User information not found.');
            return;
        }
        navigation.navigate('EditWeightScreen',{
            historyId: item.historyId,
            weight: item.weight,
            recordedAt: item.recordedAt,
            userId: user.userId,
        });
    };

    const handleAddWeight = () => {
        navigation.navigate('AddWeightHistory');
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

    const renderItem = ({ item,index }) => {
        const date = new Date(item.recordedAt);
        const formattedDate = date.toLocaleDateString('en-US',{
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Calculate weight change from previous entry
        const prevItem = history[index + 1];
        const weightChange = prevItem ? (item.weight - prevItem.weight).toFixed(1) : null;
        const isWeightUp = weightChange > 0;
        const isWeightDown = weightChange < 0;

        return (
            <View style={styles.listItem}>
                <View style={styles.itemContent}>
                    <View style={styles.dateWeightContainer}>
                        <Text style={styles.dateText}>{formattedDate}</Text>
                        <Text style={styles.weightText}>{item.weight} kg</Text>
                    </View>

                    {weightChange !== null && (
                        <View style={[
                            styles.changeContainer,
                            isWeightUp ? styles.weightUp : isWeightDown ? styles.weightDown : styles.weightSame
                        ]}>
                            <Ionicons
                                name={isWeightUp ? "arrow-up" : isWeightDown ? "arrow-down" : "remove"}
                                size={14}
                                color={isWeightUp ? "#E53E3E" : isWeightDown ? "#38A169" : "#718096"}
                            />
                            <Text style={[
                                styles.changeText,
                                isWeightUp ? styles.changeTextUp : isWeightDown ? styles.changeTextDown : styles.changeTextSame
                            ]}>
                                {Math.abs(weightChange)} kg
                            </Text>
                        </View>
                    )}

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                            <Ionicons name="create-outline" size={22} color="#4F46E5" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.historyId)} style={styles.actionButton}>
                            <Ionicons name="trash-outline" size={22} color="#E53E3E" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const filteredHistory = filterHistoryByTimeFrame(history);

    const chartData = {
        labels: filteredHistory.slice(0,10).reverse().map(item =>
            new Date(item.recordedAt).toLocaleDateString('en-US',{ month: 'short',day: 'numeric' })
        ),
        datasets: [{
            data: filteredHistory.length > 0
                ? filteredHistory.slice(0,10).reverse().map(item => item.weight)
                : [0],
        }]
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading weight history...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <DynamicStatusBar backgroundColor={theme.primaryColor} />
            <LinearGradient colors={["#4F46E5","#6366F1","#818CF8"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Weight History</Text>
                    <TouchableOpacity onPress={handleAddWeight} style={styles.addButton}>
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
            <View style={styles.container}>
                <FlatList
                    data={filteredHistory}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.historyId.toString()}
                    contentContainerStyle={styles.flatListContent}
                    ListHeaderComponent={
                        <>
                            <View style={styles.statsContainer}>
                                <View style={styles.statCard}>
                                    <Text style={styles.statLabel}>Current</Text>
                                    <Text style={styles.statValue}>{stats.current} kg</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statLabel}>Average</Text>
                                    <Text style={styles.statValue}>{stats.average} kg</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statLabel}>Change</Text>
                                    <Text style={[
                                        styles.statValue,
                                        stats.change > 0 ? styles.statValueUp :
                                            stats.change < 0 ? styles.statValueDown : null
                                    ]}>
                                        {stats.change > 0 ? '+' : ''}{stats.change} kg
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.chartContainer}>
                                {filteredHistory.length > 0 ? (
                                    <LineChart
                                        data={chartData}
                                        width={screenWidth - 32}
                                        height={220}
                                        yAxisLabel=""
                                        yAxisSuffix=" kg"
                                        chartConfig={{
                                            backgroundColor: '#FFFFFF',
                                            backgroundGradientFrom: '#FFFFFF',
                                            backgroundGradientTo: '#FFFFFF',
                                            decimalPlaces: 1,
                                            color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                                            labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
                                            style: {
                                                borderRadius: 16,
                                            },
                                            propsForDots: {
                                                r: '5',
                                                strokeWidth: '2',
                                                stroke: '#4F46E5',
                                            },
                                            propsForLabels: {
                                                fontSize: 10,
                                            }
                                        }}
                                        bezier
                                        style={styles.chart}
                                    />
                                ) : (
                                    <View style={styles.noChartDataContainer}>
                                        <Ionicons name="analytics-outline" size={48} color="#CBD5E1" />
                                        <Text style={styles.noChartDataText}>No data available for this period</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.filterContainer}>
                                <TouchableOpacity
                                    style={[styles.filterButton,timeFrame === 'all' && styles.filterButtonActive]}
                                    onPress={() => setTimeFrame('all')}
                                >
                                    <Text style={[styles.filterButtonText,timeFrame === 'all' && styles.filterButtonTextActive]}>
                                        All Time
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterButton,timeFrame === '30days' && styles.filterButtonActive]}
                                    onPress={() => setTimeFrame('30days')}
                                >
                                    <Text style={[styles.filterButtonText,timeFrame === '30days' && styles.filterButtonTextActive]}>
                                        30 Days
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterButton,timeFrame === '7days' && styles.filterButtonActive]}
                                    onPress={() => setTimeFrame('7days')}
                                >
                                    <Text style={[styles.filterButtonText,timeFrame === '7days' && styles.filterButtonTextActive]}>
                                        7 Days
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {filteredHistory.length > 0 ? (
                                <Text style={styles.historyTitle}>Weight Entries</Text>
                            ) : null}
                        </>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="scale-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>No Weight Data</Text>
                            <Text style={styles.emptyText}>
                                Start tracking your weight progress by adding your first weight entry.
                            </Text>
                            <TouchableOpacity onPress={handleAddWeight} style={styles.emptyButton}>
                                <Text style={styles.emptyButtonText}>Add Weight</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4F46E5']}
                            tintColor="#4F46E5"
                        />
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#4F46E5',
        fontWeight: '500',
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
        borderRadius: "50%",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        color: "#fff"
    },
    headerTitle: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 18,
        color: "#FFFFFF",
        textAlign: "center",
    },
    addButton: {
        padding: 8,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: "50%",
        color: "#FFFFFF"
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 4,
        alignItems: 'center',
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
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    statValueUp: {
        color: '#E53E3E',
    },
    statValueDown: {
        color: '#38A169',
    },
    chartContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0,height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    chart: {
        borderRadius: 16,
    },
    noChartDataContainer: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noChartDataText: {
        marginTop: 12,
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 4,
    },
    filterButtonActive: {
        backgroundColor: '#4F46E5',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    filterButtonTextActive: {
        color: '#FFFFFF',
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
    },
    flatListContent: {
        paddingBottom: 24,
    },
    listItem: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
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
    itemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    dateWeightContainer: {
        flex: 1,
    },
    dateText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    weightText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 12,
    },
    weightUp: {
        backgroundColor: '#FEE2E2',
    },
    weightDown: {
        backgroundColor: '#DCFCE7',
    },
    weightSame: {
        backgroundColor: '#F3F4F6',
    },
    changeText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 2,
    },
    changeTextUp: {
        color: '#E53E3E',
    },
    changeTextDown: {
        color: '#38A169',
    },
    changeTextSame: {
        color: '#718096',
    },
    actions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        marginTop: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});