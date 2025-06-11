import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from 'context/AuthContext';
import CommunityService from 'services/apiCommunityService';

const MOCK_GROUPS = [
  { groupId: 1, groupName: 'Fitness Enthusiasts', description: 'A community for fitness lovers' },
  { groupId: 2, groupName: 'Healthy Eating', description: 'Share healthy recipes and tips' },
];

function GroupScreen() {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigation.replace('Login');
    } else {
      fetchGroups();
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
    }
  };

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() =>
        navigation.navigate('Main', {
          screen: 'Community',
          params: { groupId: item.groupId },
        })
      }
    >
      <Image
        source={{ uri: item.thumbnail || 'https://placehold.co/80x80' }}
        style={styles.groupThumbnail}
      />
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.groupName}</Text>
        {item.description && (
          <Text style={styles.groupDescription}>{item.description}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#1877F2" />
    </TouchableOpacity>
  );

  if (loading || authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Group</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.groupId.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    padding: 24,
    paddingBottom: 8,
  },
  list: { paddingHorizontal: 16 },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  groupThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: '#E5E7EB',
  },
  groupInfo: { flex: 1 },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  groupDescription: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GroupScreen;