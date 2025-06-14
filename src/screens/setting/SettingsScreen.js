"use client"

import { useState,useEffect,useCallback,useContext } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Linking,
  TextInput,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext,useAuth } from "context/AuthContext"
import { profileService } from "services/apiProfileService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import apiUserService from "services/apiUserService";

const { width: screenWidth,height: screenHeight } = Dimensions.get("window")

const menuItems = [
  { id: "1",title: "Profile",icon: "person-outline",description: "View and edit your profile" },
  { id: "2",title: "Weight History",icon: "trending-up-outline",description: "Track your weight progress" },
  { id: "3",title: "Body Measurements",icon: "body-outline",description: "View your body measurements" },
  { id: "4",title: "Recipe",icon: "book-outline",description: "Discover healthy recipes" },
  { id: "5",title: "Workout",icon: "barbell-outline",description: "View workout plans" },
  { id: "6",title: "Nutrition",icon: "nutrition-outline",description: "Track your nutrition" },
  { id: "7",title: "Health Goals",icon: "flag-outline",description: "Set and track your health goals" },
  { id: "8",title: "Logout",icon: "log-out-outline",description: "Sign out of your account" },
]

export default function SettingsScreen({ navigation }) {
  const { user,logout,loading: authLoading } = useContext(AuthContext);
  const [profile,setProfile] = useState(null)
  const [loading,setLoading] = useState(true)
  const [isLoggingOut,setIsLoggingOut] = useState(false)
  const [showLogoutModal,setShowLogoutModal] = useState(false)
  const [avatar,setAvatar] = useState(null)
  const [dataResponse,setDataResponse] = useState(null)
  const [healthStats,setHealthStats] = useState({
    bmi: null,
    bodyFat: null,
    lastWorkout: null,
    streakDays: 0,
  })
  const [refreshing,setRefreshing] = useState(false)
  const [error,setError] = useState(null)
  const [showImageOptions,setShowImageOptions] = useState(false)
  const [showUrlInput,setShowUrlInput] = useState(false)
  const [imageUrl,setImageUrl] = useState("")
  const [imageUploading,setImageUploading] = useState(false)
  const [errors,setErrors] = useState({
    imageUrl: "",
  })

  const updateAvatar = async (userId,avatarUrl) => {
    try {
      const response = await apiUserService.updateAvatar(userId,avatarUrl)
      return response;
    } catch (error) {
      throw error
    }
  }

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "To select images, please grant access to your photo library in your device settings.",
          [
            { text: "Cancel",style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                Linking.openSettings()
              },
            },
          ],
        )
        return
      }

      setImageUploading(true)

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.image,
        allowsEditing: true,
        aspect: [4,3],
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0]

        if (selectedAsset.base64) {
          const base64Image = `data:image/jpeg;base64,${selectedAsset.base64}`
          setAvatar(base64Image)
          await AsyncStorage.setItem("userAvatar",base64Image)

          if (user && user.userId) {
            await updateAvatar(user.userId,base64Image)
            Alert.alert("Success","Profile picture updated successfully")
          }
        } else {
          setAvatar(selectedAsset.uri)
          await AsyncStorage.setItem("userAvatar",selectedAsset.uri)

          if (user && user.userId) {
            await updateAvatar(user.userId,selectedAsset.uri)
            Alert.alert("Success","Profile picture updated successfully")
          }
        }
      }
    } catch (error) {
      console.log("Image picker error:",error)
      Alert.alert("Error","Failed to pick image.")
    } finally {
      setImageUploading(false)
      setShowImageOptions(false)
    }
  }

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "To take photos, please grant access to your camera in your device settings.",
          [
            { text: "Cancel",style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                Linking.openSettings()
              },
            },
          ],
        )
        return
      }

      setImageUploading(true)

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1,1],
        quality: 0.7,
        base64: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0]

        if (selectedAsset.base64) {
          const base64Image = `data:image/jpeg;base64,${selectedAsset.base64}`
          setAvatar(base64Image)

          if (user && user.userId) {
            const dataResponse = await updateAvatar(user.userId,base64Image)
            if (dataResponse.statusCode !== 200) {
              throw new Error(dataResponse.message || "Failed to update profile picture.")
            }
            await AsyncStorage.setItem("userAvatar",base64Image)
            Alert.alert("Success","Profile picture updated successfully")
          }
        } else {
          setAvatar(selectedAsset.uri)

          if (user && user.userId) {
            const dataResponse = await updateAvatar(user.userId,selectedAsset.uri)
            if (dataResponse.statusCode !== 200) {
              throw new Error(dataResponse.message || "Failed to update profile picture.")
            }
            await AsyncStorage.setItem("userAvatar",selectedAsset.uri)
            Alert.alert("Success","Profile picture updated successfully")
          }
        }
      }
    } catch (error) {
      console.log("Camera error:",error)
      Alert.alert("Error","Failed to take photo.")
    } finally {
      setImageUploading(false)
      setShowImageOptions(false)
    }
  }

  const handleUrlImage = () => {
    setShowImageOptions(false)
    setShowUrlInput(true)
    setImageUrl("")
    setErrors((prev) => ({ ...prev,imageUrl: "" }))
  }

  const confirmUrlImage = async () => {
    if (!imageUrl.trim()) {
      setErrors((prev) => ({ ...prev,imageUrl: "Please enter an image URL" }))
      return
    }

    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    if (!urlPattern.test(imageUrl.trim())) {
      setErrors((prev) => ({ ...prev,imageUrl: "Please enter a valid URL" }))
      return
    }

    try {
      setImageUploading(true)
      setAvatar(imageUrl.trim())

      if (user && user.userId) {
        const dataResponse = await updateAvatar(user.userId,imageUrl.trim())
        if (dataResponse.statusCode !== 200) {
          throw new Error(dataResponse.message || "Failed to update profile picture.")
        }
        await AsyncStorage.setItem("userAvatar",imageUrl.trim())
        Alert.alert("Success","Profile picture updated successfully")
      }

      setImageUrl("")
      setShowUrlInput(false)
    } catch (error) {
      console.log("URL image error:",error)
      Alert.alert("Error","Failed to update profile picture.")
    } finally {
      setImageUploading(false)
    }
  }

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true)
    }
    setError(null)

    try {
      if (!user || !user.userId) {
        if (!authLoading) {
          Alert.alert("Error","Please log in.")
          navigation.replace("Login")
        }
        return
      }

      const response = await profileService.getLatestProfile(user.userId)
      if (response.statusCode === 200 && response.data) {
        setProfile(response.data.profile)
        setDataResponse(response.data)

        if (response.data.profile.height && response.data.profile.weight) {
          const heightInMeters = response.data.profile.height / 100
          const bmi = (response.data.profile.weight / (heightInMeters * heightInMeters)).toFixed(1)
          setHealthStats((prev) => ({ ...prev,bmi }))
        }

        setHealthStats((prev) => ({
          ...prev,
          bodyFat: response.data.profile.bodyFatPercentage || "20.5",
          lastWorkout: "2 days ago",
          streakDays: 5,
        }))

        const storedAvatar = await AsyncStorage.getItem("userAvatar")
        if (storedAvatar) setAvatar(storedAvatar)
      } else {
        setError(response.message || "Failed to load profile.")
      }
    } catch (error) {
      setError("Failed to load data.")
      console.log("Fetch data error:",error)
    } finally {
      if (!isRefresh) {
        setLoading(false)
      }
      if (isRefresh) {
        setRefreshing(false)
      }
    }
  }

  useEffect(() => {
    if (!authLoading) {
      fetchData()
    }
  },[user,authLoading,navigation])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchData(true)
  },[user])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setShowLogoutModal(true)
  }

  const confirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout();
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error","Logout failed. Please try again.")
    } finally {
      setIsLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  const handleMenuItemPress = (item) => {
    switch (item.title) {
      case "Profile":
        navigation.navigate("Profile")
        break
      case "Weight History":
        navigation.navigate("WeightHistory")
        break
      case "Body Measurements":
        navigation.navigate("BodyMeasurements")
        break
      case "Recipe":
        navigation.navigate("Recipes")
        break
      case "Workout":
        navigation.navigate("WorkoutScreen")
        break
      case "Nutrition":
        Alert.alert("Coming Soon","Nutrition tracking will be available in the next update.")
        break
      case "Health Goals":
        navigation.navigate("HealthGoals")
        break
      case "Logout":
        handleLogout()
        break
      default:
        break
    }
  }

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem,item.title === "Logout" && styles.logoutMenuItem]}
      onPress={() => handleMenuItemPress(item)}
      disabled={isLoggingOut}
      activeOpacity={0.8}
    >
      <View style={item.title === "Logout" ? styles.menuIconCircleLogout : styles.menuIconCircle}>
        <Ionicons name={item.icon} size={20} color={item.title === "Logout" ? "#fff" : "#2563EB"} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuText,item.title === "Logout" && { color: "#DC2626" }]}>{item.title}</Text>
        <Text style={styles.menuDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color="#B6C2D2" />
    </TouchableOpacity>
  )

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" style={{ marginBottom: 16 }} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
            progressBackgroundColor="#FFFFFF"
            progressViewOffset={0}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="create-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCardWrapper}>
          <View style={styles.profileCardAccent} />
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {imageUploading ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator size="large" color="#2563EB" />
                </View>
              ) : avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.profileAvatar}
                  onError={() => console.log("Error loading avatar")}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {dataResponse?.fullName ? dataResponse.fullName.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.changeAvatarButton}
                onPress={() => setShowImageOptions(true)}
                disabled={imageUploading}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfoBox}>
              <Text style={styles.profileName}>{dataResponse?.fullName || "User"}</Text>
              <Text style={styles.profileEmail}>{dataResponse?.email || "N/A"}</Text>
              <View style={styles.profileBadge}>
                <Ionicons name="fitness" size={12} color="#2563EB" />
                <Text style={styles.profileBadgeText}>Health Enthusiast</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Stats Row */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Health Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="resize-outline" size={20} color="#2563EB" style={styles.statIcon} />
              <Text style={styles.statLabel}>Height</Text>
              <Text style={styles.statValue}>{profile?.height ? `${profile.height} cm` : "N/A"}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="scale-outline" size={20} color="#2563EB" style={styles.statIcon} />
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statValue}>{profile?.weight ? `${profile.weight} kg` : "N/A"}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="analytics-outline" size={20} color="#2563EB" style={styles.statIcon} />
              <Text style={styles.statLabel}>BMI</Text>
              <Text style={styles.statValue}>{healthStats.bmi || "N/A"}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="water-outline" size={20} color="#2563EB" style={styles.statIcon} />
              <Text style={styles.statLabel}>Body Fat</Text>
              <Text style={styles.statValue}>{healthStats.bodyFat ? `${healthStats.bodyFat}%` : "N/A"}</Text>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Ionicons name="flame-outline" size={22} color="#FF6B35" />
              <Text style={styles.activityTitle}>Activity Status</Text>
            </View>
            <View style={styles.activityStats}>
              <View style={styles.activityStat}>
                <Text style={styles.activityStatValue}>{healthStats.lastWorkout || "N/A"}</Text>
                <Text style={styles.activityStatLabel}>Last Workout</Text>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityStat}>
                <Text style={styles.activityStatLabel}>Day Streak</Text>
                <Text style={styles.activityStatValue}>{healthStats.streakDays}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Premium Button */}
        <TouchableOpacity style={styles.premiumButton} activeOpacity={0.85}>
          <View style={styles.premiumIconCircle}>
            <Ionicons name="star-outline" size={22} color="#FFD700" />
          </View>
          <View style={styles.premiumTextContainer}>
            <Text style={styles.premiumText}>Upgrade to Premium</Text>
            <Text style={styles.premiumDescription}>Get personalized health plans and more</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B8860B" />
        </TouchableOpacity>

        {/* Menu List */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Settings</Text>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>HMS App v1.0.0</Text>
        </View>

        {/* Logout Modal */}
        <Modal visible={showLogoutModal} transparent={true} animationType="fade" onRequestClose={cancelLogout}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="log-out-outline" size={40} color="#DC2626" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Confirm Logout</Text>
              <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton,styles.cancelButton]} onPress={cancelLogout}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton,styles.logoutButton]} onPress={confirmLogout}>
                  {isLoggingOut ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Image Options Modal */}
        <Modal
          visible={showImageOptions}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.imageModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Profile Picture</Text>
                <TouchableOpacity onPress={() => setShowImageOptions(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.modalOption} onPress={handleTakePhoto}>
                <Ionicons name="camera-outline" size={24} color="#2563EB" style={styles.modalOptionIcon} />
                <Text style={styles.modalOptionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={24} color="#2563EB" style={styles.modalOptionIcon} />
                <Text style={styles.modalOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption} onPress={handleUrlImage}>
                <Ionicons name="link-outline" size={24} color="#2563EB" style={styles.modalOptionIcon} />
                <Text style={styles.modalOptionText}>Enter Image URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* URL Input Modal - Made Larger */}
        <Modal
          visible={showUrlInput}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowUrlInput(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.urlModalContent}>
              <View style={styles.urlModalHeader}>
                <Text style={styles.urlModalTitle}>Enter Image URL</Text>
                <TouchableOpacity onPress={() => setShowUrlInput(false)}>
                  <Ionicons name="close" size={28} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.urlInputContainer}>
                <TextInput
                  style={styles.urlInput}
                  value={imageUrl}
                  onChangeText={(text) => {
                    setImageUrl(text)
                    if (errors.imageUrl) {
                      setErrors((prev) => ({ ...prev,imageUrl: "" }))
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoFocus={true}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                {errors.imageUrl ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                    <Text style={styles.errorMessage}>{errors.imageUrl}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.urlModalButtons}>
                <TouchableOpacity
                  style={styles.urlCancelButton}
                  onPress={() => setShowUrlInput(false)}
                >
                  <Text style={styles.urlCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.urlConfirmButton}
                  onPress={confirmUrlImage}
                  disabled={imageUploading}
                >
                  {imageUploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.urlConfirmButtonText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F8FB",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  profileCardWrapper: {
    marginHorizontal: 16,
    marginBottom: 20,
    position: "relative",
    alignItems: "center",
  },
  profileCardAccent: {
    position: "absolute",
    top: 18,
    left: 0,
    right: 0,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#E0E7FF",
    opacity: 0.5,
    zIndex: 0,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0,height: 4 },
    elevation: 4,
    zIndex: 1,
    width: "100%",
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
    marginRight: 18,
    borderWidth: 2,
    borderColor: "#2563EB",
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2563EB",
    marginRight: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileInfoBox: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  profileEmail: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 2,
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  profileBadgeText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
    marginLeft: 4,
  },
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0,height: 2 },
    elevation: 1,
  },
  statIcon: {
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
  },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0,height: 2 },
    elevation: 1,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 8,
  },
  activityStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  activityStat: {
    alignItems: "center",
    flex: 1,
  },
  activityStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B35",
    marginBottom: 4,
  },
  activityStatLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  activityDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  premiumButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbe6",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: "#FFD700",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0,height: 2 },
    elevation: 2,
  },
  premiumIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF9C4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumText: {
    fontSize: 16,
    color: "#B8860B",
    fontWeight: "600",
  },
  premiumDescription: {
    fontSize: 12,
    color: "#D4A72C",
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0,height: 2 },
    elevation: 1,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F6FA",
    backgroundColor: "transparent",
  },
  menuTextContainer: {
    flex: 1,
  },
  logoutMenuItem: {
    borderTopWidth: 1,
    borderTopColor: "#F3F6FA",
    marginTop: 8,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuIconCircleLogout: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  menuDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  versionContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 14,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0,height: 4 },
    elevation: 3,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1E293B",
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#64748B",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#DC2626",
  },
  logoutButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  bottomPadding: {
    height: 80,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 18,
  },
  avatarLoading: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  changeAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563EB",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  imageModalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    width: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0,height: 4 },
    elevation: 3,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F6FA",
  },
  modalOptionIcon: {
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  // Enhanced URL Modal Styles
  urlModalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    width: screenWidth * 0.9,
    maxWidth: 400,
    maxHeight: screenHeight * 0.6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0,height: 6 },
    elevation: 5,
  },
  urlModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  urlModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  urlInputContainer: {
    marginBottom: 24,
  },
  urlInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#FAFBFC",
    minHeight: 50,
    textAlignVertical: "top",
  },
  urlModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  urlCancelButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  urlCancelButtonText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
  },
  urlConfirmButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  urlConfirmButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  errorMessage: {
    fontSize: 14,
    color: "#EF4444",
    marginLeft: 4,
  },
})