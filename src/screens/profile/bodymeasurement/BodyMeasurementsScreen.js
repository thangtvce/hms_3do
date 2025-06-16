import React,{ useState,useEffect,useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bodyMeasurementService } from 'services/apiBodyMeasurementService';
import { useAuth } from 'context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import DynamicStatusBar from 'screens/statusBar/DynamicStatusBar';
import { theme } from 'theme/color';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingMenuButton from 'components/FloatingMenuButton';

const { width,height } = Dimensions.get("window")

export default function BodyMeasurementsScreen({ navigation }) {
  const { user,authToken } = useAuth();
  const [measurements,setMeasurements] = useState([]);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);

  const fetchMeasurements = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      if (user && authToken) {
        const response = await bodyMeasurementService.getMyMeasurements({ pageNumber: 1,pageSize: 50 });
        if (response.statusCode === 200 && response.data) {
          const sortedMeasurements = (response.data.records || []).sort((a,b) =>
            new Date(b.measurementDate) - new Date(a.measurementDate)
          );
          setMeasurements(sortedMeasurements);
        }
      } else {
        Alert.alert('Error','Please log in.');
        navigation.replace('Login');
      }
    } catch (error) {
      console.log(error.response?.data || error);
      Alert.alert('Error','Failed to load body measurements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeasurements();
  },[user,authToken,navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchMeasurements();
    },[])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeasurements(false);
  };

  const handleAddMeasurement = () => {
    navigation.navigate('AddBodyMeasurement');
  };

  const handleEditMeasurement = (item) => {
    navigation.navigate('EditBodyMeasurement',{ measurement: item });
  };

  const handleDeleteMeasurement = (measurementId) => {
    Alert.alert(
      'Delete Measurement',
      'Are you sure you want to delete this measurement?',
      [
        { text: 'Cancel',style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await bodyMeasurementService.deleteMeasurement(measurementId);
              if (response.statusCode === 200) {
                fetchMeasurements();
                Alert.alert('Success','Measurement deleted successfully.');
              }
            } catch (error) {
              Alert.alert('Error','Failed to delete measurement.');
            }
          },
        },
      ]
    );
  };

  const getMeasurementChange = (current,previous,field) => {
    if (!previous || current[field] === null || previous[field] === null) return null;

    const change = current[field] - previous[field];
    return {
      value: Math.abs(change).toFixed(1),
      isIncrease: change > 0,
      isDecrease: change < 0,
    };
  };

  const renderItem = ({ item,index }) => {
    const previousItem = measurements[index + 1];
    const date = new Date(item.measurementDate);
    const formattedDate = date.toLocaleDateString('en-US',{
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const weightChange = getMeasurementChange(item,previousItem,'weight');

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleEditMeasurement(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={18} color="#64748B" />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditMeasurement(item)}
            >
              <Ionicons name="pencil-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteMeasurement(item.measurementId)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainMeasurement}>
          <View style={styles.weightContainer}>
            <Text style={styles.weightLabel}>Weight</Text>
            <Text style={styles.weightValue}>{item.weight} kg</Text>

            {weightChange && (
              <View
                style={[
                  styles.changeContainer,
                  weightChange.isIncrease ? styles.increaseContainer : weightChange.isDecrease ? styles.decreaseContainer : null,
                ]}
              >
                <Ionicons
                  name={weightChange.isIncrease ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={weightChange.isIncrease ? '#EF4444' : '#10B981'}
                />
                <Text
                  style={[
                    styles.changeText,
                    weightChange.isIncrease ? styles.increaseText : styles.decreaseText,
                  ]}
                >
                  {weightChange.value} kg
                </Text>
              </View>
            )}
          </View>

          {item.bodyFatPercentage !== null && (
            <View style={styles.bodyFatContainer}>
              <Text style={styles.bodyFatLabel}>Body Fat</Text>
              <Text style={styles.bodyFatValue}>{item.bodyFatPercentage}%</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.measurementsGrid}>
          {item.chestCm !== null && (
            <View style={styles.measurementItem}>
              <Ionicons name="body-outline" size={18} color="#64748B" />
              <Text style={styles.measurementLabel}>Chest</Text>
              <Text style={styles.measurementValue}>{item.chestCm} cm</Text>
            </View>
          )}

          {item.waistCm !== null && (
            <View style={styles.measurementItem}>
              <Ionicons name="resize-outline" size={18} color="#64748B" />
              <Text style={styles.measurementLabel}>Waist</Text>
              <Text style={styles.measurementValue}>{item.waistCm} cm</Text>
            </View>
          )}

          {item.hipCm !== null && (
            <View style={styles.measurementItem}>
              <Ionicons name="ellipse-outline" size={18} color="#64748B" />
              <Text style={styles.measurementLabel}>Hip</Text>
              <Text style={styles.measurementValue}>{item.hipCm} cm</Text>
            </View>
          )}

          {item.bicepCm !== null && (
            <View style={styles.measurementItem}>
              <Ionicons name="fitness-outline" size={18} color="#64748B" />
              <Text style={styles.measurementLabel}>Bicep</Text>
              <Text style={styles.measurementValue}>{item.bicepCm} cm</Text>
            </View>
          )}

          {item.thighCm !== null && (
            <View style={styles.measurementItem}>
              <Ionicons name="barbell-outline" size={18} color="#64748B" />
              <Text style={styles.measurementLabel}>Thigh</Text>
              <Text style={styles.measurementValue}>{item.thighCm} cm</Text>
            </View>
          )}

          {item.neckCm !== null && (
            <View style={styles.measurementItem}>
              <Ionicons name="shirt-outline" size={18} color="#64748B" />
              <Text style={styles.measurementLabel}>Neck</Text>
              <Text style={styles.measurementValue}>{item.neckCm} cm</Text>
            </View>
          )}
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Ionicons name="document-text-outline" size={18} color="#64748B" />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <DynamicStatusBar backgroundColor={theme.primaryColor} />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading measurements...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <DynamicStatusBar backgroundColor={theme.primaryColor} />
      <View style={styles.container}>
        <LinearGradient colors={["#4F46E5","#6366F1","#818CF8"]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Body Measurements</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

        {measurements.length > 0 ? (
          <FlatList
            data={measurements}
            renderItem={renderItem}
            keyExtractor={(item) => item.measurementId.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2563EB']}
                tintColor="#2563EB"
              />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="body-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Measurements</Text>
            <Text style={styles.emptyText}>
              Start tracking your body measurements to monitor your fitness progress.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddMeasurement}
            >
              <Text style={styles.emptyButtonText}>Add First Measurement</Text>
            </TouchableOpacity>
          </View>
        )}

        {measurements.length > 0 && (
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddMeasurement}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      <FloatingMenuButton
        initialPosition={{ x: width - 70,y: height - 180 }}
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
    color: '#2563EB',
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0,height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 4,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  mainMeasurement: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  weightContainer: {
    flex: 1,
  },
  weightLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  bodyFatContainer: {
    marginLeft: 24,
  },
  bodyFatLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  bodyFatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  increaseContainer: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  decreaseContainer: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  increaseText: {
    color: '#EF4444',
  },
  decreaseText: {
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  measurementItem: {
    width: '33.33%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  measurementLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0,height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});