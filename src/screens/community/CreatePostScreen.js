import { useState,useEffect,useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons,Feather,MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { createPost,getAllTags } from "../../services/apiCommunityService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DynamicStatusBar from "screens/statusBar/DynamicStatusBar"

const { width,height } = Dimensions.get("window")

const CreatePostScreen = ({ route,navigation }) => {
  const { groupId } = route.params

  const [content,setContent] = useState("")
  const [thumbnail,setThumbnail] = useState("")
  const [tags,setTags] = useState([])
  const [selectedTags,setSelectedTags] = useState([])
  const [contentLength,setContentLength] = useState(0)

  const [loading,setLoading] = useState(false)
  const [tagLoading,setTagLoading] = useState(true)
  const [error,setError] = useState("")
  const [showImageOptions,setShowImageOptions] = useState(false)
  const [showTagModal,setShowTagModal] = useState(false)
  const [keyboardHeight,setKeyboardHeight] = useState(0)

  const [currentUser,setCurrentUser] = useState(null)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,{
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim,{
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim,{
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    return () => {
      fadeAnim.setValue(0)
      slideAnim.setValue(30)
      scaleAnim.setValue(0.95)
    }
  },[])

  useEffect(() => {
    const progress = Math.min(contentLength / 2000,1)
    Animated.timing(progressAnim,{
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start()
  },[contentLength])


  useEffect(() => {
    loadInitialData()
  },[])

  const loadInitialData = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user")
      if (userStr) {
        setCurrentUser(JSON.parse(userStr))
      }
      const tagsData = await getAllTags()
      setTags(tagsData || [])
    } catch (error) {
      console.error("Error loading initial data:",error)
    } finally {
      setTagLoading(false)
    }
  }

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required","Please grant permission to access your photo library.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16,9],
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setThumbnail(`data:image/jpeg;base64,${result.assets[0].base64}`)
        setShowImageOptions(false)
      }
    } catch (error) {
      Alert.alert("Error","Failed to pick image. Please try again.")
    }
  }

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required","Please grant permission to access your camera.")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16,9],
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setThumbnail(`data:image/jpeg;base64,${result.assets[0].base64}`)
        setShowImageOptions(false)
      }
    } catch (error) {
      Alert.alert("Error","Failed to take photo. Please try again.")
    }
  }

  const handleRemoveImage = () => {
    Alert.alert("Remove Image","Are you sure you want to remove this image?",[
      { text: "Cancel",style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setThumbnail("")
          Animated.sequence([
            Animated.timing(scaleAnim,{ toValue: 0.95,duration: 150,useNativeDriver: true }),
            Animated.timing(scaleAnim,{ toValue: 1,duration: 150,useNativeDriver: true }),
          ]).start()
        },
      },
    ])
  }

  const handleContentChange = (text) => {
    setContent(text)
    setContentLength(text.length)
    if (error) setError("")
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Please write something to share with the community")
      return
    }

    if (contentLength > 2000) {
      setError("Content is too long. Please keep it under 2000 characters.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const postDto = {
        postId: 0,
        userId: currentUser?.userId,
        groupId,
        thumbnail,
        content: content.trim(),
        status: "active",
        tagIds: selectedTags,
      }

      await createPost(postDto)

      // Success animation
      Animated.sequence([
        Animated.timing(scaleAnim,{ toValue: 1.05,duration: 200,useNativeDriver: true }),
        Animated.timing(scaleAnim,{ toValue: 1,duration: 200,useNativeDriver: true }),
      ]).start()

      Alert.alert("Success! 🎉","Your post has been shared with the community!",[
        {
          text: "Great!",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      setError(error.message || "Failed to create post. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev,tagId]))
  }

  const getProgressColor = () => {
    if (contentLength < 1000) return "#10B981"
    if (contentLength < 1500) return "#F59E0B"
    if (contentLength < 1800) return "#EF4444"
    return "#DC2626"
  }

  const canPublish = content.trim().length > 0 && contentLength <= 2000 && !loading

  return (
    <SafeAreaView style={styles.safeArea}>
      <DynamicStatusBar backgroundColor="#4F46E5" />

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Modern Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient colors={["#4F46E5","#7C3AED"]} style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Share Your Story</Text>
                <Text style={styles.headerSubtitle}>Connect with your health community</Text>
              </View>

              <TouchableOpacity
                style={[styles.publishButton,!canPublish && styles.publishButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canPublish}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.publishButtonText}>Share</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* User Info Section */}
          <Animated.View
            style={[
              styles.userSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim },{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <LinearGradient colors={["#4F46E5","#7C3AED"]} style={styles.avatarGradient}>
                  {currentUser?.avatar ? (
                    <Image source={{ uri: currentUser.avatar }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{currentUser?.fullName?.charAt(0)?.toUpperCase() || "U"}</Text>
                  )}
                </LinearGradient>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{currentUser?.fullName || "Health Community Member"}</Text>
                <View style={styles.privacyContainer}>
                  <Ionicons name="globe-outline" size={14} color="#10B981" />
                  <Text style={styles.privacyText}>Sharing publicly</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Content Input Section */}
          <Animated.View
            style={[
              styles.inputSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim },{ scale: scaleAnim }],
              },
            ]}
          >
            <TextInput
              style={styles.contentInput}
              placeholder="Share your health journey, tips, or ask questions..."
              placeholderTextColor="#94A3B8"
              value={content}
              onChangeText={handleContentChange}
              multiline
              maxLength={2000}
              textAlignVertical="top"
              autoFocus={false}
            />

            {/* Character Counter with Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0,1],
                        outputRange: ["0%","100%"],
                      }),
                      backgroundColor: getProgressColor(),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.characterCount,{ color: getProgressColor() }]}>
                {contentLength}/2000
                {contentLength > 1800 && <Text style={styles.warningText}> • Almost at limit!</Text>}
              </Text>
            </View>
          </Animated.View>

          {/* Image Preview Section */}
          {thumbnail && (
            <Animated.View
              style={[
                styles.imageSection,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.imageContainer}>
                <Image source={{ uri: thumbnail }} style={styles.imagePreview} />
                <LinearGradient colors={["transparent","rgba(0,0,0,0.3)"]} style={styles.imageOverlay} />
                <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
                  <View style={styles.removeImageButtonInner}>
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <View style={styles.imageLabel}>
                  <Ionicons name="image" size={16} color="#FFFFFF" />
                  <Text style={styles.imageLabelText}>Tap to edit</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Action Cards Section */}
          <Animated.View
            style={[
              styles.actionsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="add-circle-outline" size={20} color="#4F46E5" /> Enhance Your Post
            </Text>

            <View style={styles.actionCards}>
              {/* Media Card */}
              <TouchableOpacity
                style={[styles.actionCard,thumbnail && styles.actionCardActive]}
                onPress={() => setShowImageOptions(true)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={thumbnail ? ["#10B981","#059669"] : ["#F8FAFC","#F1F5F9"]}
                  style={styles.actionCardGradient}
                >
                  <View style={styles.actionCardIcon}>
                    <Ionicons
                      name={thumbnail ? "checkmark-circle" : "camera"}
                      size={24}
                      color={thumbnail ? "#FFFFFF" : "#4F46E5"}
                    />
                  </View>
                  <View style={styles.actionCardContent}>
                    <Text style={[styles.actionCardTitle,thumbnail && styles.actionCardTitleActive]}>
                      {thumbnail ? "Image Added" : "Add Photo"}
                    </Text>
                    <Text style={[styles.actionCardSubtitle,thumbnail && styles.actionCardSubtitleActive]}>
                      {thumbnail ? "Tap to change" : "Share a moment"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={thumbnail ? "#FFFFFF" : "#64748B"} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Tags Card */}
              <TouchableOpacity
                style={[styles.actionCard,selectedTags.length > 0 && styles.actionCardActive]}
                onPress={() => setShowTagModal(true)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={selectedTags.length > 0 ? ["#8B5CF6","#7C3AED"] : ["#F8FAFC","#F1F5F9"]}
                  style={styles.actionCardGradient}
                >
                  <View style={styles.actionCardIcon}>
                    <Ionicons
                      name={selectedTags.length > 0 ? "pricetag" : "pricetags-outline"}
                      size={24}
                      color={selectedTags.length > 0 ? "#FFFFFF" : "#4F46E5"}
                    />
                  </View>
                  <View style={styles.actionCardContent}>
                    <Text style={[styles.actionCardTitle,selectedTags.length > 0 && styles.actionCardTitleActive]}>
                      {selectedTags.length > 0 ? `${selectedTags.length} Tags Selected` : "Add Tags"}
                    </Text>
                    <Text
                      style={[styles.actionCardSubtitle,selectedTags.length > 0 && styles.actionCardSubtitleActive]}
                    >
                      {selectedTags.length > 0 ? "Help others find your post" : "Categorize your post"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={selectedTags.length > 0 ? "#FFFFFF" : "#64748B"} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Selected Tags Preview */}
          {selectedTags.length > 0 && (
            <Animated.View
              style={[
                styles.selectedTagsSection,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.selectedTagsHeader}>
                <Text style={styles.selectedTagsTitle}>
                  <Ionicons name="pricetag" size={16} color="#8B5CF6" /> Selected Tags
                </Text>
                <TouchableOpacity onPress={() => setShowTagModal(true)}>
                  <Text style={styles.editTagsText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.selectedTagsContainer}>
                {selectedTags.slice(0,6).map((tagId) => {
                  const tag = tags.find((t) => t.tagId === tagId)
                  return (
                    <View key={tagId} style={styles.selectedTag}>
                      <Text style={styles.selectedTagText}>#{tag?.tagName}</Text>
                    </View>
                  )
                })}
                {selectedTags.length > 6 && (
                  <View style={styles.moreTagsIndicator}>
                    <Text style={styles.moreTagsText}>+{selectedTags.length - 6}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Error Message */}
          {error && (
            <Animated.View
              style={[
                styles.errorSection,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </Animated.View>
          )}

          {/* Health Tips Section */}
          <Animated.View
            style={[
              styles.tipsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.tipsContainer}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
                <Text style={styles.tipsTitle}>Sharing Tips</Text>
              </View>
              <Text style={styles.tipsText}>
                • Share your personal health experiences{"\n"}• Ask questions to get community support{"\n"}• Use
                relevant tags to reach the right audience{"\n"}• Be respectful and supportive of others
              </Text>
            </View>
          </Animated.View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Image Options Modal */}
        <Modal
          visible={showImageOptions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImageOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.imageOptionsModal,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Photo</Text>
                <TouchableOpacity onPress={() => setShowImageOptions(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.imageOptionsContainer}>
                <TouchableOpacity style={styles.imageOption} onPress={handleTakePhoto}>
                  <LinearGradient colors={["#4F46E5","#7C3AED"]} style={styles.imageOptionGradient}>
                    <Ionicons name="camera" size={32} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.imageOptionTitle}>Take Photo</Text>
                  <Text style={styles.imageOptionSubtitle}>Use your camera</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.imageOption} onPress={handlePickImage}>
                  <LinearGradient colors={["#10B981","#059669"]} style={styles.imageOptionGradient}>
                    <Ionicons name="images" size={32} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.imageOptionTitle}>Choose from Gallery</Text>
                  <Text style={styles.imageOptionSubtitle}>Select existing photo</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* Tags Modal */}
        <Modal
          visible={showTagModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTagModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.tagsModal,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Tags</Text>
                <TouchableOpacity onPress={() => setShowTagModal(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.tagsDescription}>Choose relevant tags to help others discover your post</Text>

              {tagLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingText}>Loading tags...</Text>
                </View>
              ) : (
                <ScrollView style={styles.tagsScrollView} showsVerticalScrollIndicator={false}>
                  <View style={styles.tagsGrid}>
                    {tags.map((tag) => (
                      <TouchableOpacity
                        key={tag.tagId}
                        style={[styles.tagItem,selectedTags.includes(tag.tagId) && styles.tagItemSelected]}
                        onPress={() => toggleTag(tag.tagId)}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={selectedTags.includes(tag.tagId) ? ["#8B5CF6","#7C3AED"] : ["#F8FAFC","#F1F5F9"]}
                          style={styles.tagItemGradient}
                        >
                          <Text style={[styles.tagText,selectedTags.includes(tag.tagId) && styles.tagTextSelected]}>
                            #{tag.tagName}
                          </Text>
                          {selectedTags.includes(tag.tagId) && (
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}

              <View style={styles.tagsModalFooter}>
                <Text style={styles.selectedCount}>
                  {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} selected
                </Text>
                <TouchableOpacity style={styles.doneButton} onPress={() => setShowTagModal(false)}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#4F46E5",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Header Styles
  header: {
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerGradient: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: 2,
  },
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
  },
  publishButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    opacity: 0.6,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Content Styles
  content: {
    flex: 1,
  },
  userSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    marginRight: 16,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  privacyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  privacyText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },

  // Input Section
  inputSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  contentInput: {
    fontSize: 18,
    lineHeight: 26,
    color: "#1E293B",
    minHeight: 120,
    textAlignVertical: "top",
    paddingVertical: 0,
    marginBottom: 16,
  },
  progressSection: {
    gap: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  characterCount: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  warningText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Image Section
  imageSection: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  imagePreview: {
    width: "100%",
    height: 240,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  removeImageButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageLabel: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  imageLabelText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },

  // Actions Section
  actionsSection: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionCards: {
    gap: 12,
  },
  actionCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCardActive: {
    shadowColor: "#10B981",
    shadowOpacity: 0.2,
  },
  actionCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  actionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  actionCardTitleActive: {
    color: "#FFFFFF",
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  actionCardSubtitleActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Selected Tags Section
  selectedTagsSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedTagsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedTagsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  editTagsText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  selectedTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedTag: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  selectedTagText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  moreTagsIndicator: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moreTagsText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },

  // Error Section
  errorSection: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "500",
    flex: 1,
  },

  // Tips Section
  tipsSection: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  tipsContainer: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
  },
  tipsText: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageOptionsModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  tagsModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  imageOptionsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  imageOption: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
  },
  imageOptionGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  imageOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 4,
  },
  imageOptionSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  tagsDescription: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 20,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "500",
  },
  tagsScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tagItem: {
    borderRadius: 16,
    overflow: "hidden",
    minWidth: "45%",
    maxWidth: "48%",
  },
  tagItemSelected: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tagItemGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tagText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  tagTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  tagsModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  selectedCount: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  doneButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 40,
  },
})

export default CreatePostScreen
