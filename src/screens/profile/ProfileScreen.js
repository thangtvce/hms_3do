import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from 'context/AuthContext';
import { profileService } from 'services/apiProfileService';

export default function ProfileScreen({ navigation }) {
  const { user, authToken, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (user && user.userId && authToken) {
          const response = await profileService.getLatestProfile(user.userId);
          if (response.statusCode === 200 && response.data) {
            setProfile(response.data.profile);
          } else {
            Alert.alert('Error', response.message || 'Failed to load profile.');
          }
        } else if (!authLoading) {
          Alert.alert('Error', 'Please log in.');
          navigation.replace('Login');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) {
      fetchData();
    }
  }, [user, authToken, authLoading, navigation]);

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={32} color="#2563EB" style={{ marginBottom: 10 }} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
            source={{ uri: user?.avatar || 'https://via.placeholder.com/80' }}
            style={styles.profileAvatar}
          />
          <View style={styles.profileInfoBox}>
            <Text style={styles.profileName}>{user?.fullName || user?.email || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Profile Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
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
            <Text style={styles.statValue}>{profile?.bodyFatPercentage ? `${profile.bodyFatPercentage}%` : 'N/A'}</Text>
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6FA',
  },
  statLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    marginHorizontal: 32,
    borderRadius: 10,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});