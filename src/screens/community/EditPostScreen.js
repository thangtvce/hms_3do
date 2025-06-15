"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { updatePost, getAllTags } from "../../services/apiCommunityService"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width } = Dimensions.get("window")

const EditPostScreen = ({ route, navigation }) => {
  const { post } = route.params
  const [content, setContent] = useState(post.content || "")
  const [thumbnail, setThumbnail] = useState(post.thumbnail || "")
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState(post.tagIds || [])
  const [loading, setLoading] = useState(false)
  const [tagLoading, setTagLoading] = useState(true)
  const [error, setError] = useState("")
  const [contentLength, setContentLength] = useState(post.content?.length || 0)

  useEffect(() => {
    getAllTags()
      .then(setTags)
      .catch(() => {})
      .finally(() => setTagLoading(false))
  }, [])

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    })
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setThumbnail(`data:image/jpeg;base64,${result.assets[0].base64}`)
    }
  }

  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    })
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setThumbnail(`data:image/jpeg;base64,${result.assets[0].base64}`)
    }
  }

  const handleRemoveImage = () => {
    Alert.alert("Xóa ảnh", "Bạn có chắc chắn muốn xóa ảnh này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: () => setThumbnail("") },
    ])
  }

  const handleContentChange = (text) => {
    setContent(text)
    setContentLength(text.length)
    if (error) setError("")
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Nội dung không được để trống")
      return
    }
    setLoading(true)
    setError("")
    try {
      const userStr = await AsyncStorage.getItem("user")
      const user = userStr ? JSON.parse(userStr) : {}
      const postDto = {
        ...post,
        userId: user.userId,
        thumbnail,
        content,
        status: "active",
        tagIds: selectedTags,
      }
      await updatePost(post.postId, postDto)
      Alert.alert("Thành công", "Cập nhật bài viết thành công!", [{ text: "OK", onPress: () => navigation.goBack() }])
    } catch (e) {
      setError(e.message || "Cập nhật bài viết thất bại")
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags(selectedTags.includes(tagId) ? selectedTags.filter((id) => id !== tagId) : [...selectedTags, tagId])
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.headerButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa bài viết</Text>
        <TouchableOpacity
          style={[styles.headerButton, styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !content.trim()}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Lưu</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content Input */}
        <View style={styles.inputSection}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>Bạn</Text>
              <Text style={styles.privacy}>🌍 Công khai</Text>
            </View>
          </View>

          <TextInput
            style={styles.contentInput}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor="#9CA3AF"
            value={content}
            onChangeText={handleContentChange}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />

          <View style={styles.characterCount}>
            <Text style={[styles.characterCountText, contentLength > 1800 && styles.characterCountWarning]}>
              {contentLength}/2000
            </Text>
          </View>
        </View>

        {/* Image Section */}
        {thumbnail ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: thumbnail }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Media Options */}
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>📷 Thêm vào bài viết</Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity style={styles.mediaButton} onPress={handlePickImage}>
              <Text style={styles.mediaButtonIcon}>🖼️</Text>
              <Text style={styles.mediaButtonText}>Ảnh/Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={handleTakePhoto}>
              <Text style={styles.mediaButtonIcon}>📸</Text>
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tags Section */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>🏷️ Thẻ tag</Text>
          {tagLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.loadingText}>Đang tải thẻ tag...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.tagDescription}>Chọn thẻ tag phù hợp để tăng khả năng tiếp cận bài viết</Text>
              <View style={styles.tagGrid}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.tagId}
                    style={[styles.tagItem, selectedTags.includes(tag.tagId) && styles.tagItemSelected]}
                    onPress={() => toggleTag(tag.tagId)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.tagText, selectedTags.includes(tag.tagId) && styles.tagTextSelected]}
                      numberOfLines={1}
                    >
                      #{tag.tagName}
                    </Text>
                    {selectedTags.includes(tag.tagId) && <Text style={styles.tagCheckmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
              {selectedTags.length > 0 && (
                <View style={styles.selectedTagsInfo}>
                  <Text style={styles.selectedTagsText}>✨ Đã chọn {selectedTags.length} thẻ tag</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  headerButtonText: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  saveButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    width: "auto",
    minWidth: 60,
  },
  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  inputSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  privacy: {
    fontSize: 14,
    color: "#6B7280",
  },
  contentInput: {
    fontSize: 18,
    lineHeight: 26,
    color: "#1F2937",
    minHeight: 120,
    textAlignVertical: "top",
    paddingVertical: 0,
  },
  characterCount: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  characterCountWarning: {
    color: "#EF4444",
    fontWeight: "600",
  },
  imageContainer: {
    position: "relative",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  imagePreview: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  mediaSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  mediaButtons: {
    flexDirection: "row",
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mediaButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  mediaButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  tagsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  tagDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
    maxWidth: (width - 56) / 2,
  },
  tagItemSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  tagText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  tagTextSelected: {
    color: "#6366F1",
    fontWeight: "600",
  },
  tagCheckmark: {
    fontSize: 12,
    color: "#6366F1",
    fontWeight: "bold",
    marginLeft: 6,
  },
  selectedTagsInfo: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  selectedTagsText: {
    fontSize: 14,
    color: "#15803D",
    fontWeight: "500",
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "500",
    flex: 1,
  },
  bottomSpacing: {
    height: 40,
  },
})

export default EditPostScreen;
