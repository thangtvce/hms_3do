import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,  
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from 'context/AuthContext';
import { profileService } from 'services/apiProfileService';
import { bodyMeasurementService } from 'services/apiBodyMeasurementService';
import { weightHistoryService } from 'services/apiWeightHistoryService';
import { apiUserService } from 'services/apiUserService';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { user, authToken, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    user: true,
    profile: true,
    measurements: true,
    weightHistory: true,
  });

  useEffect(() => {
  
      let isMounted = true;
      const abortController = new AbortController();

      const fetchData = async () => {
        try {
          if (!user || !user.userId || !authToken) {
            if (!authLoading) {
              Alert.alert('Error', 'Please log in.');
              navigation.replace('Login');
            }
            return;
          }
          const fetchTasks = [];

          if (!userData) {
            fetchTasks.push(
              apiUserService
                .getUserById(user.userId, { signal: abortController.signal })
                .then((response) => {
                  if (response.statusCode === 200 && response.data && isMounted) {
                    setUserData(response.data);
                    setLoadingStates((prev) => ({ ...prev, user: false }));
                  } else {
                    throw new Error('Invalid user response');
                  }
                }),
            );
          } else {
            setLoadingStates((prev) => ({ ...prev, user: false }));
          }

          if (!profile) {
            fetchTasks.push(
              profileService
                .getLatestProfile(user.userId, { signal: abortController.signal })
                .then((response) => {
                  if (response.statusCode === 200 && response.data && isMounted) {
                    setProfile(response.data.profile);
                    setLoadingStates((prev) => ({ ...prev, profile: false }));
                  } else {
                    throw new Error('Invalid profile response');
                  }
                }),
            );
          } else {
            setLoadingStates((prev) => ({ ...prev, profile: false }));
          }

          if (bodyMeasurements.length === 0) {
            fetchTasks.push(
              bodyMeasurementService
                .getMyMeasurements({ pageNumber: 1, pageSize: 5 }, { signal: abortController.signal })
                .then((response) => {
                  if (response.statusCode === 200 && response.data && isMounted) {
                    console.log('Body Measurements Response:', response.data.records);
                    const validMeasurements = (response.data.records || []).filter(
                      (item) => item && item.measurementId,
                    );
                    setBodyMeasurements(validMeasurements);
                    setLoadingStates((prev) => ({ ...prev, measurements: false }));
                  }
                }),
            );
          } else {
            setLoadingStates((prev) => ({ ...prev, measurements: false }));
          }

          if (weightHistory.length === 0) {
            fetchTasks.push(
              weightHistoryService
                .getMyWeightHistory({ pageNumber: 1, pageSize: 5 }, { signal: abortController.signal })
                .then((response) => {
                  if (response.statusCode === 200 && response.data && isMounted) {
                    const validHistory = (response.data.records || []).filter(
                      (item) => item && item.historyId,
                    );
                    setWeightHistory(validHistory);
                    setLoadingStates((prev) => ({ ...prev, weightHistory: false }));
                  }
                }),
            );
          } else {
            setLoadingStates((prev) => ({ ...prev, weightHistory: false }));
          }

          await Promise.all(fetchTasks);
        } catch (error) {
          if (error.name !== 'AbortError' && isMounted) {
            const message = error.response?.data?.message || error.message || 'Failed to load data.';
            Alert.alert('Error', message);
          }
        }
      };

      if (!authLoading) {
        fetchData();
      }

      return () => {
        isMounted = false;
        abortController.abort();
      };
    // }, [user, authToken, authLoading, userData, profile, bodyMeasurements, weightHistory]),
    // }, []),
  }, [authToken, authLoading]);

  const handleEditProfile = () => {
    navigation.navigate('EditUserScreen', { user: userData });
  };

  const handleEditBody = () => {
    navigation.navigate('EditProfile', { user: userData });
  };

  const handleAddBodyMeasurement = () => {
    navigation.navigate('AddBodyMeasurement');
  };

  const handleAddWeightHistory = () => {
    navigation.navigate('AddWeightHistory');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const renderMeasurementItem = (item) => {
    console.log('Rendering measurement item:', item);
    const fields = [
      { key: 'weight', label: 'Weight', unit: 'kg', position: 'topLeft', arrowRotation: 150 },
      { key: 'bodyFatPercentage', label: 'Body Fat', unit: '%', position: 'topRight', arrowRotation: 210 },
      { key: 'neckCm', label: 'Neck', unit: 'cm', position: 'neck', arrowRotation: 45 },
      { key: 'chestCm', label: 'Chest', unit: 'cm', position: 'chest', arrowRotation: -15 },
      { key: 'bicepCm', label: 'Bicep', unit: 'cm', position: 'bicep', arrowRotation: 30 },
      { key:  'waistCm', label: 'Waist', unit: 'cm', position: 'waist' },
      { key: 'hipCm', label: 'Hip', unit: 'cm', position: 'hip', arrowRotation: -20 },
      { key: 'thighCm', label: 'Thigh', unit: 'cm', position: 'thigh', arrowRotation: -30 },
    ];

    return (
      <View style={styles.measurementItem}>
        <View style={styles.bodyIconContainer}>
          <Ionicons name="body" size={100} color="#2563EB" style={styles.bodyIcon} />
          {fields.map(({ key, label, unit, position, arrowRotation }) => (
            item[key] != null && (
              <View key={key} style={[styles.measurementLabel, styles[position]]}>
                <Text style={styles.measurementText}>
                  {label}: {item[key]}{unit}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#2563EB"
                  style={[styles.arrow, { transform: [{ rotate: `${arrowRotation}deg` }] }]}
                />
              </View>
            )
          ))}
        </View>
        <Text style={styles.measurementDate}>
          {new Date(item.measurementDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
    );
  };

  const renderWeightHistoryItem = (item) => (
    <View style={styles.weightHistoryItem}>
      <View style={styles.weightHistoryContent}>
        <Ionicons name="scale" size={24} color="#2563EB" style={styles.weightIcon} />
        <View>
          <Text style={styles.weightHistoryText}>
            {item.weight} kg
          </Text>
          <Text style={styles.weightHistoryDate}>
            {new Date(item.recordedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>
    </View>
  );

  const isLoading = Object.values(loadingStates).some((state) => state) || authLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={32} color="#2563EB" style={{ marginBottom: 10 }} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Get the most recent body measurement
  const latestMeasurement = bodyMeasurements.length > 0
    ? bodyMeasurements.reduce((latest, current) =>
        new Date(current.measurementDate).getTime() > new Date(latest.measurementDate).getTime()
          ? current
          : latest
      )
    : null;

  // Get the most recent weight history entry
  const latestWeight = weightHistory.length > 0
    ? weightHistory.reduce((latest, current) =>
        new Date(current.recordedAt).getTime() > new Date(latest.recordedAt).getTime() ? current : latest
      )
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <View style={styles.profileCardWrapper}>
        <View style={styles.profileCardAccent} />
        <View style={styles.profileCard}>
          <Image
            source={{ uri: userData?.Avatar || user?.avatar || 'https://via.placeholder.com/80' }}
            style={styles.profileAvatar}
          />
          <View style={styles.profileInfoBox}>
            <Text style={styles.profileName}>
              {userData?.FullName || user?.fullName || user?.email || 'User'}
            </Text>
            <Text style={styles.profileEmail}>{userData?.Email || user?.email || 'N/A'}</Text>
          </View>
          <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
            <Ionicons name="pencil" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Stats */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Body Metrics</Text>
          <TouchableOpacity onPress={handleEditBody} style={styles.editButton}>
            <Ionicons name="pencil" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Height</Text>
            <Text style={styles.statValue}>{profile?.height ? `${profile.height} cm` : 'N/A'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>{profile?.weight ? `${profile.weight} kg` : 'N/A'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>BMI</Text>
            <Text style={styles.statValue}>{profile?.bmi ? profile.bmi.toFixed(1) : 'N/A'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Body Fat Percentage</Text>
            <Text style={styles.statValue}>
              {profile?.bodyFatPercentage ? `${profile.bodyFatPercentage}%` : 'N/A'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Activity Level</Text>
            <Text style={styles.statValue}>{profile?.activityLevel || 'N/A'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Dietary Preference</Text>
            <Text style={styles.statValue}>{profile?.dietaryPreference || 'N/A'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Fitness Goal</Text>
            <Text style={styles.statValue}>{profile?.fitnessGoal || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Body Measurements */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Body Measurement</Text>
          <TouchableOpacity onPress={handleAddBodyMeasurement} style={styles.editButton}>
            <Ionicons name="add" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsCard}>
          {loadingStates.measurements ? (
            <Text style={styles.noDataText}>Loading measurements...</Text>
          ) : latestMeasurement ? (
            renderMeasurementItem(latestMeasurement)
          ) : (
            <Text style={styles.noDataText}>No body measurements available.</Text>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('BodyMeasurements')}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>View All Measurements</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weight History */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Weight</Text>
          <TouchableOpacity onPress={handleAddWeightHistory} style={styles.editButton}>
            <Ionicons name="add" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsCard}>
          {loadingStates.weightHistory ? (
            <Text style={styles.noDataText}>Loading weight history...</Text>
          ) : latestWeight ? (
            renderWeightHistoryItem(latestWeight)
          ) : (
            <Text style={styles.noDataText}>No weight history available.</Text>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('WeightHistory')}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>View All Weight History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Change Password */}
      <View style={styles.statsSection}>
        <TouchableOpacity onPress={handleChangePassword} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back-outline" size={20} color="#fff" />
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  scrollContent: {
    paddingBottom: 32,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  profileCardWrapper: {
    marginTop: 32,
    marginBottom: 8,
    marginHorizontal: 16,
    position: 'relative',
    alignItems: 'center',
  },
  profileCardAccent: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    opacity: 0.5,
    zIndex: 0,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 1,
    width: '100%',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    marginRight: 18,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  profileInfoBox: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  profileEmail: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 2,
  },
  statsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
     paddingBottom: 5,
  },
  editButton: {
    padding: 8,
    borderRadius: 15, // Make the touchable area slightly rounded
    backgroundColor: '#E0E7FF',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 20, 
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2,
    borderColor: '#E5E7EB', 
    borderWidth: 1,
  },
  statRow: {
   flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6FA',
  },
  statLabel: {
      fontSize: 15, 
    color: '#64748B',
    fontWeight: '500',
    flex: 1, 
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 10,
  },
  measurementItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  bodyIconContainer: {
    position: 'relative',
    width: width * 0.6,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyIcon: {
    position: 'absolute',
  },
  measurementLabel: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  topLeft: {
    top: 10,
    right:50,
  },
  topRight: {
    bottom: 0,
    right:40,
  },
  neck: {
    top: 45,
    left: 0,
  },
  chest: {
    top: 89,
    left: -10,
  },
  bicep: {
    top: 45,
    left:150,
  },
  waist: {
    top: 90,
    right: -20,
  },
  hip: {
    top: 115,
    left: 0,
  },
  thigh: {
    top: 125,
    right: -20,
  },
  measurementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
    flexShrink: 1,
  },
  measurementDate: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  arrow: {
    marginLeft: 4,
  },
  weightHistoryItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  weightHistoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightIcon: {
    marginRight: 12,
  },
  weightHistoryText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  weightHistoryDate: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  noDataText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 16,
  },
  viewAllButton: {
    marginTop: 7,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    marginHorizontal: 32,
    marginBottom: 20,
    width: '92%',
    alignSelf: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});