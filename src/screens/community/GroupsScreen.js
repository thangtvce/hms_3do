import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from 'context/AuthContext';
import CommunityService from 'services/apiCommunityService';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const SPACING = 16;
const ITEM_HEIGHT = 110;

const MOCK_GROUPS = [
  { 
    groupId: 1, 
    groupName: 'Fitness Enthusiasts', 
    description: 'A community for fitness lovers to share workouts, progress, and motivation.',
    memberCount: 1243,
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    isJoin: true
  },
  { 
    groupId: 2, 
    groupName: 'Healthy Eating', 
    description: 'Share healthy recipes, meal prep ideas, and nutritional tips for a balanced lifestyle.',
    memberCount: 856,
    thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    isJoin: false
  },
  { 
    groupId: 3, 
    groupName: 'Mindfulness & Meditation', 
    description: 'Learn techniques for stress reduction, better sleep, and improved mental clarity.',
    memberCount: 621,
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1742&q=80',
    isJoin: true
  },
  { 
    groupId: 4, 
    groupName: 'Outdoor Adventures', 
    description: 'Connect with nature lovers for hiking, camping, and outdoor activities.',
    memberCount: 432,
    thumbnail: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1746&q=80',
    isJoin: false
  },
];

function GroupScreen() {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigation.replace('Login');
    } else {
      fetchGroups();
    }
    
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Set status bar style
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, [user, authLoading, navigation]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const groupsData = await CommunityService.fetchGroups();
      setGroups(groupsData.length ? groupsData : MOCK_GROUPS);
    } catch (e) {
      setError('Failed to load groups.');
      setGroups(MOCK_GROUPS);
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      // Show joining animation
      const updatedGroups = groups.map(group => 
        group.groupId === groupId ? { ...group, isJoining: true } : group
      );
      setGroups(updatedGroups);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update state with joined status
      const finalGroups = groups.map(group => 
        group.groupId === groupId ? { ...group, isJoin: true, isJoining: false } : group
      );
      setGroups(finalGroups);
      
      // Show success message
      Alert.alert('Success', 'You have joined the group successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to join the group. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const renderGroup = ({ item, index }) => {
    const scaleAnim = new Animated.Value(1);
    const handlePressIn = () => {
      Animated.spring(scaleAnim, { 
        toValue: 0.97, 
        friction: 8, 
        useNativeDriver: true 
      }).start();
    };
    
    const handlePressOut = () => {
      Animated.spring(scaleAnim, { 
        toValue: 1, 
        friction: 8, 
        useNativeDriver: true 
      }).start();
    };
    
    // Staggered animation for list items
    const itemAnimatedStyle = {
      opacity: fadeAnim,
      transform: [
        { translateY: translateY.interpolate({
            inputRange: [0, 1],
            outputRange: [50 + (index * 10), 0]
          })
        },
        { scale: scaleAnim }
      ]
    };
    
    // Parallax effect for images
    const inputRange = [
      -1,
      0,
      ITEM_HEIGHT * index,
      ITEM_HEIGHT * (index + 2)
    ];
    
    const imageScale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.95],
      extrapolate: 'clamp'
    });
    
    return (
      <Animated.View style={[styles.groupItemContainer, itemAnimatedStyle]}>
        <TouchableOpacity
          style={styles.groupCard}
          onPress={() =>
            navigation.navigate('Main', {
              screen: 'Community',
              params: { groupId: item.groupId },
            })
          }
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.Image
              source={{ uri: item.thumbnail || 'https://placehold.co/80x80' }}
              style={[
                styles.groupThumbnail,
                { transform: [{ scale: imageScale }] }
              ]}
            />
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{item.groupName}</Text>
              {item.description && (
                <Text numberOfLines={2} style={styles.groupDescription}>
                  {item.description}
                </Text>
              )}
              <View style={styles.groupMetaContainer}>
                <View style={styles.groupMemberCountContainer}>
                  <Ionicons name="people" size={14} color="#5E72E4" />
                  <Text style={styles.groupMemberCount}>{item.memberCount || 0} members</Text>
                </View>
                
                {/* Join button with enhanced styling */}
                {item.isJoin ? (
                  <View style={styles.joinedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.joinedText}>Joined</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => handleJoinGroup(item.groupId)}
                  >
                    {item.isJoining ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.joinButtonText}>Join</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Header animation based on scroll
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });
  
  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  if (loading || authLoading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#5E72E4" />
        <Text style={styles.loadingText}>Loading groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.headerContainer,
          { 
            transform: [
              { translateY: headerTranslateY },
              { scale: headerScale }
            ],
            opacity: headerOpacity
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Discover Groups</Text>
          <Text style={styles.headerSubtitle}>Find your community</Text>
        </LinearGradient>
      </Animated.View>
      
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <Animated.FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.groupId.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      
      {/* Floating action button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => Alert.alert('Create Group', 'This feature is coming soon!')}
      >
        <LinearGradient
          colors={['#5E72E4', '#825EE4']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
  },
  headerContainer: {
    paddingHorizontal: SPACING,
    paddingBottom: SPACING,
    zIndex: 10,
  },
  headerGradient: {
    borderRadius: 16,
    padding: SPACING,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  list: { 
    paddingHorizontal: SPACING,
    paddingTop: SPACING / 2,
    paddingBottom: 100,
  },
  groupItemContainer: {
    marginBottom: SPACING,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  groupCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING,
    borderRadius: 20,
  },
  groupThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: SPACING,
    backgroundColor: '#E2E8F0',
  },
  groupInfo: { 
    flex: 1,
    paddingRight: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  groupMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupMemberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMemberCount: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5E72E4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  joinedText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    marginHorizontal: SPACING,
    marginBottom: SPACING,
    padding: SPACING,
    borderRadius: 12,
  },
  errorText: {
    color: '#DC2626',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#5E72E4',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GroupScreen;