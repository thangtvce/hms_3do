import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/apiProfileService';

const menuItems = [
  { id: '1', title: 'Profile', icon: 'person-outline' },
  { id: '2', title: 'Recipe', icon: 'book-outline' },
  { id: '3', title: 'Workout', icon: 'barbell-outline' },
  { id: '4', title: 'Nutrition', icon: 'nutrition-outline' },
  { id: '5', title: 'Logout', icon: 'log-out-outline' },
];

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (user && user.userId) {
          const response = await profileService.getLatestProfile(user.userId);
          if (response.statusCode === 200 && response.data) {
            setProfile(response.data.profile);
          } else {
            Alert.alert('Error', response.message || 'Failed to load profile.');
          }
        } else {
          Alert.alert('Error', 'Please log in.');
          navigation.replace('Login');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, navigation]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Logout failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, item.title === 'Logout' && styles.logoutMenuItem]}
      onPress={() => {
        switch (item.title) {
          case 'Profile':
            navigation.navigate('Profile');
            break;
          case 'Recipe':
            navigation.navigate('Recipes');
            break;
          case 'Workout':
            navigation.navigate('WorkoutScreen');
            break;
          case 'Nutrition':
            Alert.alert('Info', 'Nutrition screen not implemented.');
            break;
          case 'Logout':
            handleLogout();
            break;
          default:
            break;
        }
      }}
      disabled={isLoggingOut}
      activeOpacity={0.8}
    >
      <View style={item.title === 'Logout' ? styles.menuIconCircleLogout : styles.menuIconCircle}>
        <Ionicons
          name={item.icon}
          size={20}
          color={item.title === 'Logout' ? '#fff' : '#2563EB'}
        />
      </View>
      <Text style={[styles.menuText, item.title === 'Logout' && { color: '#DC2626' }]}>
        {item.title}
      </Text>
      <Ionicons name="chevron-forward-outline" size={18} color="#B6C2D2" />
    </TouchableOpacity>
  );

  if (loading) {
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

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Height</Text>
          <Text style={styles.statValue}>{profile?.height ? `${profile.height} cm` : 'N/A'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Weight</Text>
          <Text style={styles.statValue}>{profile?.weight ? `${profile.weight} kg` : 'N/A'}</Text>
        </View>
      </View>

      {/* Premium Button */}
      <TouchableOpacity style={styles.premiumButton} activeOpacity={0.85}>
        <View style={styles.premiumIconCircle}>
          <Ionicons name="star-outline" size={22} color="#FFD700" />
        </View>
        <Text style={styles.premiumText}>Subscribe to Premium</Text>
      </TouchableOpacity>

      {/* Menu List */}
      <View style={styles.menuSection}>
        {menuItems.map((item) => renderMenuItem({ item }))}
      </View>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelLogout}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton]}
                onPress={confirmLogout}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbe6',
    paddingVertical: 12,
    marginHorizontal: 32,
    borderRadius: 10,
    marginBottom: 22,
    shadowColor: '#FFD700',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  premiumIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF9C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  premiumText: {
    fontSize: 16,
    color: '#B8860B',
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6FA',
    backgroundColor: 'transparent',
  },
  logoutMenuItem: {
    borderTopWidth: 1,
    borderTopColor: '#F3F6FA',
    marginTop: 8,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuIconCircleLogout: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 14,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1E293B',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#64748B',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 7,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
});