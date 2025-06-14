import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "context/AuthContext";
import CommunityService from "services/apiCommunityService";

const { width } = Dimensions.get('window');

const EditPostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useContext(AuthContext);

  // Extracted state variables for editing post
  const [editPostContent, setEditPostContent] = useState(route.params?.post?.content || "");
  const [editPostImage, setEditPostImage] = useState(null);
  const [editSelectedTags, setEditSelectedTags] = useState(route.params?.post?.tags || []);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [tags, setTags] = useState([]);

  // Post data from route params
  const post = route.params?.post;
  const groupId = post?.groupId;
  const postId = post?.postId;

  // Fetch tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsData = await CommunityService.fetchTags();
        setTags(tagsData);
      } catch (error) {
        Alert.alert("Error", "Failed to load tags: " + error.message);
      }
    };
    fetchTags();
  }, []);

  // Pick an image for editing post
  const handlePickEditPostImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setEditPostImage({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
        name: result.assets[0].fileName || "image.jpg",
        type: result.assets[0].type || "image/jpeg",
      });
    }
  };

  // Edit post function
  const handleEditPost = async () => {
    if (!editPostContent.trim() && !editPostImage && !post?.thumbnail) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }
    setIsEditingPost(true);
    try {
      const content = editPostContent.trim() || post?.content || "";
      const imageBase64 = editPostImage?.base64 || post?.thumbnail || null;
      const tagIds = (editSelectedTags.length > 0 ? editSelectedTags : post?.tags || [])
        .filter((tag) => tags.some((t) => t.tagId === tag.tagId))
        .map((tag) => tag.tagId);

      const response = await CommunityService.updatePost(postId, groupId, content, imageBase64, tagIds);
      if (response.statusCode === 200) {
        navigation.navigate("Community", {
          groupId: groupId,
          updatedPost: {
            postId,
            content,
            thumbnail: imageBase64,
            tags: editSelectedTags.length > 0 ? editSelectedTags : post.tags,
          },
        });
        Alert.alert("Success", "Post updated successfully!");
      } else {
        throw new Error("Failed to update post");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update post");
    } finally {
      setIsEditingPost(false);
    }
  };

  const isContentValid = editPostContent.trim() || editPostImage || post?.thumbnail;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Post</Text>
        <TouchableOpacity
          style={[
            styles.headerSaveButton,
            !isContentValid && styles.headerSaveButtonDisabled,
          ]}
          onPress={handleEditPost}
          disabled={!isContentValid || isEditingPost}
          activeOpacity={0.8}
        >
          {isEditingPost ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.headerSaveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Text Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.editPostInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#8E8E93"
            value={editPostContent}
            onChangeText={setEditPostContent}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <View style={styles.characterCount}>
            <Text style={styles.characterCountText}>
              {editPostContent.length}/2000
            </Text>
          </View>
        </View>

        {/* Enhanced Image Preview */}
        {(editPostImage || post?.thumbnail) && (
          <View style={styles.imageContainer}>
            <View style={styles.imagePreview}>
              <Image
                source={{
                  uri: editPostImage
                    ? editPostImage.uri
                    : post?.thumbnail?.startsWith("data:image") || post?.thumbnail?.startsWith("http")
                    ? post.thumbnail
                    : `data:image/jpeg;base64,${post?.thumbnail}`,
                }}
                style={styles.editImagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setEditPostImage(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Enhanced Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handlePickEditPostImage}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonIcon}>
              <Ionicons name="camera" size={20} color="#007AFF" />
            </View>
            <Text style={styles.actionButtonText}>
              {editPostImage || post?.thumbnail ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Tags Section */}
        <View style={styles.tagsSection}>
          <View style={styles.tagsSectionHeader}>
            <Ionicons name="pricetag" size={18} color="#007AFF" />
            <Text style={styles.tagsSectionTitle}>Tags</Text>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsScrollContainer}
          >
            {tags.map((item) => {
              const isSelected = editSelectedTags.some((t) => t.tagId === item.tagId);
              return (
                <TouchableOpacity
                  key={item.tagId}
                  style={[styles.tagChip, isSelected && styles.selectedTagChip]}
                  onPress={() =>
                    setEditSelectedTags((prev) =>
                      prev.some((t) => t.tagId === item.tagId)
                        ? prev.filter((t) => t.tagId !== item.tagId)
                        : [...prev, item]
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagChipText, isSelected && styles.selectedTagChipText]}>
                    #{item.tagName}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.tagCheckIcon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#F2F2F7",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
    textAlign: "center",
  },
  headerSaveButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSaveButtonDisabled: {
    backgroundColor: "#C7C7CC",
    shadowOpacity: 0,
    elevation: 0,
  },
  headerSaveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  editPostInput: {
    fontSize: 16,
    color: "#1a1a1a",
    padding: 20,
    minHeight: 140,
    lineHeight: 22,
  },
  characterCount: {
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  characterCountText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  imageContainer: {
    marginBottom: 20,
  },
  imagePreview: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  editImagePreview: {
    width: "100%",
    height: 220,
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  tagsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tagsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tagsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginLeft: 8,
  },
  tagsScrollContainer: {
    paddingVertical: 4,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  selectedTagChip: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  tagChipText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  selectedTagChipText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  tagCheckIcon: {
    marginLeft: 6,
  },
});

export default EditPostScreen;