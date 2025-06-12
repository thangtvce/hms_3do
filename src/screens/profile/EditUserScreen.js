import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from 'context/AuthContext';
import { apiUserService } from 'services/apiUserService';
import * as ImagePicker from 'expo-image-picker'; 

export default function EditUserScreen({ navigation, route }) {
  const { user, authToken, setUser } = useAuth();
  const [formData, setFormData] = useState({
    userId: route.params?.user?.userId || 0,
    fullName: route.params?.user?.fullName || '',
    email: route.params?.user?.email || '',
    phone: route.params?.user?.phone || '',
    avatar: route.params?.user?.avatar || '',
    status: route.params?.user?.status || 'active',
    createdAt: route.params?.user?.createdAt || new Date().toISOString(),
    roles: route.params?.user?.roles || [], // Assuming roles are available in user
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

const handlePickImage = async () => {
  // Request permissions first
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Denied',
      'Sorry, we need camera roll permissions to make this work!'
    );
    return;
  }

  setImageUploading(true);
  try {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only allow images
      allowsEditing: true, // Optional: allow user to crop/edit
      aspect: [1, 1], // Optional: force a square aspect ratio
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      // You still need to upload this image to your server
      const imageUrl = await uploadImage(selectedAsset);
      setFormData((prev) => ({ ...prev, avatar: imageUrl }));
    } else if (result.canceled) {
        console.log('Image picker cancelled');
    }
  } catch (error) {
    console.error('Image picker error:', error);
    Alert.alert('Error', 'Failed to pick image.');
  } finally {
    setImageUploading(false);
  }
};
  const uploadImage = async (asset) => {

    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName || 'avatar.jpg',
    });

    const response = await fetch('https://your-image-upload-api.com/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const result = await response.json();
    return result.url; // Assuming the server returns { url: 'https://...' }
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.email) {
      Alert.alert('Error', 'Full Name and Email are required.');
      return;
    }

    setLoading(true);
    try {
      const userDto = {
        UserId: formData.userId,
        FullName: formData.fullName,
        Email: formData.email,
        Phone: formData.phone,
        Avatar: formData.avatar,
        Status: formData.status,
        CreatedAt: formData.createdAt,
        Roles: formData.roles,
      };

      const response = await apiUserService.updateUser(formData.userId, userDto, authToken);
      if (response.statusCode === 200) {
        // Update AuthContext with new user data
        setUser({
          ...user,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          avatar: formData.avatar,
        });
        Alert.alert('Success', 'User updated successfully.');
        navigation.goBack();
      } else {
        throw new Error(response.message || 'Failed to update user');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit User</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: formData.avatar || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.changeAvatarButton}
            onPress={handlePickImage}
            disabled={imageUploading}
          >
            {imageUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.changeAvatarText}>Change Avatar</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={formData.fullName}
          onChangeText={(text) => handleInputChange('fullName', text)}
          placeholder="Enter full name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => handleInputChange('phone', text)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    
  },
  backButton: {
    padding: 8,
        top: 30,

  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 16,
    top: 30,
  },
  formContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  changeAvatarButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  changeAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});