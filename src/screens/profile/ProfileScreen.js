import React,{ useState,useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from 'context/AuthContext';
import { profileService } from 'services/apiProfileService';
import { bodyMeasurementService } from 'services/apiBodyMeasurementService';
import { weightHistoryService } from 'services/apiWeightHistoryService';
import { apiUserService } from 'services/apiUserService';

const { width } = Dimensions.get('window');

const useProfileData = (user,authToken,authLoading,navigation) => {
  const [data,setData] = useState({
    userData: null,
    profile: null,
    bodyMeasurements: [],
    weightHistory: [],
  });
  const [loading,setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const abortController = new AbortController();

      const fetchData = async () => {
        try {
          if (!user?.userId || !authToken) {
            if (!authLoading) {
              Alert.alert('Error','Please log in.');
              navigation.replace('Login');
            }
            return;
          }

          setLoading(true);
          const [userRes,profileRes,measurementsRes,weightRes] = await Promise.all([
            apiUserService.getUserById(user.userId,{ signal: abortController.signal }),
            profileService.getLatestProfile(user.userId,{ signal: abortController.signal }),
            bodyMeasurementService.getMyMeasurements(
              { pageNumber: 1,pageSize: 5 },
              { signal: abortController.signal }
            ),
            weightHistoryService.getMyWeightHistory(
              { pageNumber: 1,pageSize: 5 },
              { signal: abortController.signal }
            ),
          ]);
          if (isMounted) {
            setData({
              userData: userRes.statusCode === 200 ? userRes.data : null,
              profile: profileRes.statusCode === 200 ? profileRes.data.profile : null,
              bodyMeasurements:
                measurementsRes.statusCode === 200
                  ? (measurementsRes.data.records || [])
                  : [],
              weightHistory:
                weightRes.statusCode === 200
                  ? (weightRes.data.records || [])
                  : [],
            });
            console.log("body",data.bodyMeasurements)
            console.log("wight",data.weightHistory)
            console.log("mẻ",measurementsRes)
            setLoading(false);
          }
        } catch (error) {
          if (error.name !== 'AbortError' && isMounted) {
            Alert.alert('Error',error.message || 'Failed to load data.');
          }
          setLoading(false);
        }
      };

      if (!authLoading) {
        fetchData();
      }

      return () => {
        isMounted = false;
        abortController.abort();
      };
    },[user,authToken,authLoading,navigation])
  );

  return { ...data,loading };
};

const ProfileCard = ({ userData,profile,onEdit }) => (
  <LinearGradient
    colors={['#2563EB','#4F46E5']}
    start={{ x: 0,y: 0 }}
    end={{ x: 1,y: 1 }}
    style={styles.profileCard}
  >
    <Image
      source={{ uri: userData?.avatar || 'https://via.placeholder.com/80' }}
      style={styles.profileAvatar}
    />
    <View style={styles.profileInfoBox}>
      <Text style={styles.profileName}>{userData?.fullName || 'User'}</Text>
      <Text style={styles.profileEmail}>{userData?.email || 'N/A'}</Text>
    </View>
    <TouchableOpacity onPress={onEdit} style={styles.editButton}>
      <Ionicons name="pencil" size={20} color="#fff" />
    </TouchableOpacity>
  </LinearGradient>
);

const StatRow = ({ label,value }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value || 'N/A'}</Text>
  </View>
);

const BodyMeasurementItem = ({ item }) => {
  const fields = [
    { key: 'weight',label: 'Weight',unit: 'kg' },
    { key: 'bodyFatPercentage',label: 'Body Fat',unit: '%' },
    { key: 'neckCm',label: 'Neck',unit: 'cm' },
    { key: 'chestCm',label: 'Chest',unit: 'cm' },
    { key: 'bicepCm',label: 'Bicep',unit: 'cm' },
    { key: 'waistCm',label: 'Waist',unit: 'cm' },
    { key: 'hipCm',label: 'Hip',unit: 'cm' },
    { key: 'thighCm',label: 'Thigh',unit: 'cm' },
  ];

  return (
    <View style={styles.measurementItem}>
      <View style={styles.measurementGrid}>
        {fields.map(
          ({ key,label,unit }) =>
            item[key] != null && (
              <View key={key} style={styles.measurementField}>
                <Text style={styles.measurementText}>
                  {label}: {item[key]}
                  {unit}
                </Text>
              </View>
            )
        )}
      </View>
      <Text style={styles.measurementDate}>
        {new Date(item.measurementDate).toLocaleDateString('en-US',{
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </Text>
    </View>
  );
};

const WeightHistoryItem = ({ item }) => (
  <View style={styles.weightHistoryItem}>
    <View style={styles.weightHistoryContent}>
      <Ionicons name="scale" size={24} color="#2563EB" style={styles.weightIcon} />
      <View>
        <Text style={styles.weightHistoryText}>{item.weight} kg</Text>
        <Text style={styles.weightHistoryDate}>
          {new Date(item.recordedAt).toLocaleDateString('en-US',{
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
    </View>
  </View>
);

const SkeletonLoader = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonText} />
    <View style={styles.skeletonTextShort} />
    <View style={styles.skeletonCard} />
    <View style={styles.skeletonCard} />
  </View>
);

export default function ProfileScreen({ navigation }) {
  const { user,authToken,authLoading } = useAuth();
  const { userData,profile,bodyMeasurements,weightHistory,loading } = useProfileData(
    user,
    authToken,
    authLoading,
    navigation
  );

  const handleEditProfile = () => navigation.navigate('EditUserScreen',{ user: userData });
  const handleEditBody = () => navigation.navigate('EditProfile',{ user: userData });
  const handleAddBodyMeasurement = () => navigation.navigate('AddBodyMeasurement');
  const handleAddWeightHistory = () => navigation.navigate('AddWeightHistory');
  const handleChangePassword = () => navigation.navigate('ChangePassword');

  if (loading) {
    return <SkeletonLoader />;
  }

  const latestMeasurement = bodyMeasurements.length > 0
    ? bodyMeasurements.reduce((latest,current) =>
      new Date(current.measurementDate).getTime() > new Date(latest.measurementDate).getTime()
        ? current
        : latest
    )
    : null;

  const latestWeight = weightHistory.length > 0
    ? weightHistory.reduce((latest,current) =>
      new Date(current.recordedAt).getTime() > new Date(latest.recordedAt).getTime()
        ? current
        : latest
    )
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ProfileCard userData={userData} profile={profile} onEdit={handleEditProfile} />

      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Body Metrics</Text>
          <TouchableOpacity onPress={handleEditBody} style={styles.editButton}>
            <Ionicons name="pencil" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsCard}>
          <StatRow label="Height" value={profile?.height ? `${profile.height} cm` : null} />
          <StatRow label="Weight" value={profile?.weight ? `${profile.weight} kg` : null} />
          <StatRow label="BMI" value={profile?.bmi ? profile.bmi.toFixed(1) : null} />
          <StatRow label="Body Fat" value={profile?.bodyFatPercentage ? `${profile.bodyFatPercentage}% ` : null} />
          <StatRow label="Activity Level" value={profile?.activityLevel} />
          <StatRow label="Dietary Preference" value={profile?.dietaryPreference} />
          <StatRow label="Fitness Goal" value={profile?.fitnessGoal} />
        </View>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Body Measurement</Text>
          <TouchableOpacity onPress={handleAddBodyMeasurement} style={styles.editButton}>
            <Ionicons name="add" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsCard}>
          {latestMeasurement ? (
            <BodyMeasurementItem item={latestMeasurement} />
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

      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Weight</Text>
          <TouchableOpacity onPress={handleAddWeightHistory} style={styles.editButton}>
            <Ionicons name="add" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsCard}>
          {latestWeight ? (
            <WeightHistoryItem item={latestWeight} />
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

      <View style={styles.statsSection}>
        <TouchableOpacity onPress={handleChangePassword} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Change Password</Text>
        </TouchableOpacity>
      </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F8FB',
  },
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  skeletonText: {
    width: width * 0.6,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTextShort: {
    width: width * 0.4,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonCard: {
    width: width * 0.9,
    height: 100,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 18,
  },
  profileInfoBox: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  profileEmail: {
    fontSize: 15,
    color: '#E0E7FF',
    marginTop: 4,
  },
  statsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  editButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6FA',
  },
  statLabel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  measurementItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  measurementField: {
    width: '48%',
    marginBottom: 8,
  },
  measurementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  measurementDate: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  weightHistoryItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
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
    marginTop: 12,
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
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});