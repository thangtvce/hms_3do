import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bodyMeasurementService } from 'services/apiBodyMeasurementService';
import { useAuth } from 'context/AuthContext';

export default function BodyMeasurementsScreen({ navigation }) {
  const { user, authToken } = useAuth();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        setLoading(true);
        if (user && authToken) {
          const response = await bodyMeasurementService.getMyMeasurements({ pageNumber: 1, pageSize: 50 });
          console.log('getMyMeasurements response:', JSON.stringify(response.data, null, 2));
          if (response.statusCode === 200 && response.data) {
            setMeasurements(response.data.records || []);
          }
        } else {
          Alert.alert('Error', 'Please log in.');
          navigation.replace('Login');
        }
      } catch (error) {
        console.error(error.response.data);
        Alert.alert('Error', 'Failed to load body measurements.');
      } finally {
        setLoading(false);
      }
    };
    fetchMeasurements();
  }, [user, authToken, navigation]);

  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.listItemText}>
        Date: {new Date(item.measurementDate).toLocaleDateString()}
      </Text>
      <Text style={styles.listItemText}>Weight: {item.weight} kg</Text>
      <Text style={styles.listItemText}>Body Fat: {item.bodyFatPercentage || 0}%</Text>
      <Text style={styles.listItemText}>Chest: {item.chestCm || 0} cm</Text>
      <Text style={styles.listItemText}>Waist: {item.waistCm || 0} cm</Text>
      <Text style={styles.listItemText}>Hip: {item.hipCm || 0} cm</Text>
      <Text style={styles.listItemText}>Bicep: {item.bicepCm || 0} cm</Text>
      <Text style={styles.listItemText}>Thigh: {item.thighCm || 0} cm</Text>
      <Text style={styles.listItemText}>Neck: {item.neckCm || 0} cm</Text>
      <Text style={styles.listItemText}>Notes: {item.notes || 'None'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Body Measurements</Text>
      </View>
      {measurements.length > 0 ? (
        <FlatList
          data={measurements}
          renderItem={renderItem}
          keyExtractor={(item) => item.measurementId.toString()}
        />
      ) : (
        <Text style={styles.noDataText}>No body measurements available.</Text>
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293b',
    marginLeft: 16,
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  listItemText: {
    fontSize: 16,
    color: '#1E293b',
  },
  noDataText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#2563EB',
    textAlign: 'center',
    marginTop: 20,
  },
});