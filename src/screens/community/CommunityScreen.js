import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import CommunityService from 'services/apiCommunityService';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from 'context/AuthContext';

const { width } = Dimensions.get('window');

const CommunityScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, authLoading, logout } = useContext(AuthContext);
  const groupIdParam = route.params?.groupId ? Number(route.params.groupId) : null;
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [reactions, setReactions] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [showCommentsMap, setShowCommentsMap] = useState({});
  const [reactionModal, setReactionModal] = useState({ visible: false, postId: null });
  const [reportModal, setReportModal] = useState({ visible: false, postId: null });
  const [quickPostImage, setQuickPostImage] = useState(null);
  const [isQuickPostUploading, setIsQuickPostUploading] = useState(false);
  const [quickPostError, setQuickPostError] = useState(null);
  const [reactionTypes, setReactionTypes] = useState([]);
  const [reportReasons, setReportReasons] = useState([]);
  const [reactionTypesLoading, setReactionTypesLoading] = useState(false);
  const [reportReasonId, setReportReasonId] = useState(null);
  const [reportDetails, setReportDetails] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTagId, setSearchTagId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndFetchData = async () => {
      if (authLoading) return;
      if (!user) {
        if (isMounted) {
          navigation.replace('Login');
        }
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [groupsData, tagsData] = await Promise.all([
          CommunityService.fetchGroups(),
          CommunityService.fetchTags(),
        ]);
        if (isMounted) {
          setGroups(groupsData.length ? groupsData : []);
          setTags(tagsData);
        }
      } catch (error) {
        if (isMounted) {
          if (error.response?.status === 401) {
            Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
              { text: 'OK', onPress: () => logout() },
            ]);
          } else {
            setError('Failed to load data. Please try again.');
            Alert.alert('Error', error.message);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuthAndFetchData();
    return () => {
      isMounted = false;
    };
  }, [user, authLoading, navigation, logout]);

  // Other useEffect hooks (unchanged)
  useEffect(() => {
    if (reactionModal.visible && reactionTypes.length === 0) {
      setReactionTypesLoading(true);
      CommunityService.fetchReactionTypes()
        .then((types) => setReactionTypes(types))
        .catch((err) => Alert.alert('Error', 'Failed to load reactions: ' + err.message))
        .finally(() => setReactionTypesLoading(false));
    }
  }, [reactionModal.visible]);

  useEffect(() => {
    if (reportModal.visible && reportReasons.length === 0) {
      CommunityService.fetchReportReasons()
        .then((reasons) => setReportReasons(reasons))
        .catch((err) => Alert.alert('Error', 'Failed to load report reasons: ' + err.message));
    }
  }, [reportModal.visible]);

  useEffect(() => {
    if (groups.length > 0 && groupIdParam) {
      const found = groups.find((g) => g.groupId === groupIdParam);
      if (found) setSelectedGroup(found);
    }
  }, [groups, groupIdParam]);

  useEffect(() => {
    if (selectedGroup) {
      setPosts([]);
      setPage(1);
      setHasMore(true);
      fetchPosts(1);
    }
  }, [selectedGroup]);

  useEffect(() => {
    posts.forEach((post) => {
      if (!reactions[post.postId]) {
        fetchReactions(post.postId);
      }
    });
  }, [posts]);

  // Fetch functions (unchanged, summarized)
  const fetchGroups = async () => { /* ... */ };
  const fetchTags = async () => { /* ... */ };
  const fetchPosts = async (pageNumber) => { /* ... */ };
  const searchPosts = async () => { /* ... */ };
  const fetchComments = async (postId) => { /* ... */ };
  const fetchReactions = async (postId) => { /* ... */ };
  const handlePickQuickPostImage = async () => { /* ... */ };
  const handlePost = async () => { /* ... */ };
  const handleComment = async (postId) => { /* ... */ };
  const handleReaction = async (postId, reactionTypeId) => { /* ... */ };
  const handleReport = async () => { /* ... */ };
  const toggleComments = (postId) => { /* ... */ };

  // Updated renderGroup with enhanced styling
  const renderGroup = ({ item }) => {
    const scaleAnim = new Animated.Value(1);
    const handlePressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.95, friction: 8, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
    };
    return (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => setSelectedGroup(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.groupCard, { transform: [{ scale: scaleAnim }] }]}>
          <Image
            source={{ uri: item.thumbnail || 'https://placehold.co/100x100' }}
            style={styles.groupImage}
          />
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.groupName}</Text>
            {item.description && (
              <Text style={styles.groupDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.groupMemberCount}>{item.memberCount || 0} members</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Updated renderPost with Facebook-like styling
  const renderPost = ({ item }) => {
    const scaleAnim = new Animated.Value(1);
    const handlePressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.98, friction: 8, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
    };
    const hasReacted = (reactions[item.postId] || []).some((r) => r.userId === user?.userId);
    const userReaction = (reactions[item.postId] || []).find((r) => r.userId === user?.userId);
    const reactionIcon = userReaction
      ? reactionTypes.find((rt) => rt.reactionTypeId === userReaction.reactionTypeId)?.iconUrl
      : null;

    return (
      <TouchableOpacity
        style={styles.postContainer}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.postCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.postHeader}>
            <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
            <View style={styles.postHeaderInfo}>
              <Text style={styles.username}>{item.userFullName}</Text>
              <Text style={styles.postTime}>
                {new Date(item.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setReportModal({ visible: true, postId: item.postId })}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#65676B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.postContent}>{item.content}</Text>
          {item.thumbnail && (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.postThumbnail}
              resizeMode="cover"
            />
          )}
          {item.tags?.length > 0 && (
            <View style={styles.tagContainer}>
              {item.tags.map((tag) => (
                <TouchableOpacity
                  key={tag.tagId}
                  style={styles.tag}
                  onPress={() => setSearchTagId(tag.tagId)}
                >
                  <Text style={styles.tagText}>#{tag.tagName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.postStats}>
            <View style={styles.reactionStats}>
              {reactionIcon && (
                <Image source={{ uri: reactionIcon }} style={styles.reactionStatIcon} />
              )}
              <Text style={styles.reactionCount}>
                {reactions[item.postId]?.length || 0}
              </Text>
            </View>
            <Text style={styles.commentShareStats}>
              {comments[item.postId]?.length || 0} comments
            </Text>
          </View>
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setReactionModal({ visible: true, postId: item.postId })}
            >
              <Ionicons
                name={hasReacted ? 'heart' : 'heart-outline'}
                size={20}
                color={hasReacted ? '#1877F2' : '#65676B'}
              />
              <Text style={styles.actionText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleComments(item.postId)}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#65676B" />
              <Text style={styles.actionText}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-social-outline" size={20} color="#65676B" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
          {showCommentsMap[item.postId] && (
            <View style={styles.commentsContainer}>
              {(comments[item.postId] || []).map((comment) => (
                <View key={comment.commentId} style={styles.commentItem}>
                  <Image
                    source={{ uri: comment.userAvatar }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUsername}>{comment.userFullName}</Text>
                    <Text style={styles.commentText}>{comment.commentText}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.commentInputContainer}>
                <Image
                  source={{ uri: user?.avatar || 'https://placehold.co/32x32' }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentInputWrapper}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write a comment..."
                    value={commentInput[item.postId] || ''}
                    onChangeText={(text) =>
                      setCommentInput((prev) => ({ ...prev, [item.postId]: text }))
                    }
                    multiline
                  />
                  <View style={styles.commentActions}>
                    <TouchableOpacity>
                      <Ionicons name="camera-outline" size={20} color="#65676B" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Ionicons name="happy-outline" size={20} color="#65676B" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={styles.gifText}>GIF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.commentSendButton}
                  onPress={() => handleComment(item.postId)}
                  disabled={!commentInput[item.postId]?.trim()}
                >
                  <Ionicons
                    name="send"
                    size={18}
                    color={commentInput[item.postId]?.trim() ? '#1877F2' : '#B0B3B8'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const userAvatar = user?.avatar || 'https://placehold.co/40x40';

  return (
    <View style={styles.container}>
      {authLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1877F2" />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1877F2" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => checkAuthAndFetchData()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !selectedGroup ? (
        <View style={styles.groupSelectionContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Groups</Text>
            <TouchableOpacity>
              <Ionicons name="search-outline" size={24} color="#65676B" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={groups}
            renderItem={renderGroup}
            keyExtractor={(item) => item.groupId.toString()}
            contentContainerStyle={styles.groupList}
            ListEmptyComponent={<Text style={styles.emptyText}>No groups available.</Text>}
          />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedGroup(null)}>
              <Ionicons name="arrow-back" size={24} color="#65676B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedGroup.groupName}</Text>
            <TouchableOpacity>
              <Ionicons name="search-outline" size={24} color="#65676B" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#65676B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts or tags..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchPosts}
            />
          </View>
          <View style={styles.postInputContainer}>
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
            <View style={styles.postInputWrapper}>
              <TextInput
                style={styles.postInput}
                placeholder="What's on your mind?"
                value={postContent}
                onChangeText={setPostContent}
                multiline
                maxLength={2000}
              />
              <View style={styles.postActionsRow}>
                <TouchableOpacity
                  style={styles.postActionButton}
                  onPress={handlePickQuickPostImage}
                >
                  <Ionicons name="camera-outline" size={20} color="#4CAF50" />
                  <Text style={styles.postActionText}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postActionButton}>
                  <Ionicons name="happy-outline" size= {20} color="#F7B928" />
                  <Text style={styles.postActionText}>Feeling</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postActionButton}>
                  <Text style={styles.gifText}>GIF</Text>
                </TouchableOpacity>
              </View>
              {quickPostImage && (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: quickPostImage.uri }}
                    style={styles.imagePreviewThumbnail}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setQuickPostImage(null)}
                  >
                    <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
              <FlatList
                horizontal
                data={tags}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.tag,
                      selectedTags.some((t) => t.tagId === item.tagId) && styles.selectedTag,
                    ]}
                    onPress={() =>
                      setSelectedTags((prev) =>
                        prev.some((t) => t.tagId === item.tagId)
                          ? prev.filter((t) => t.tagId !== item.tagId)
                          : [...prev, item]
                      )
                    }
                  >
                    <Text style={styles.tagText}>#{item.tagName}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.tagId.toString()}
                style={styles.tagList}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.postButton,
                (!postContent.trim() || loading) && styles.postButtonDisabled,
              ]}
              onPress={handlePost}
              disabled={!postContent.trim() || loading}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
          {quickPostError && (
            <View style={styles.errorMessage}>
              <Text style={styles.errorMessageText}>{quickPostError}</Text>
            </View>
          )}
          {isQuickPostUploading && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color="#1877F2" />
              <Text style={styles.uploadingText}>Uploading image...</Text>
            </View>
          )}
          {posts.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{error || 'No posts available.'}</Text>
            </View>
          ) : (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item.postId.toString()}
              contentContainerStyle={styles.postsList}
              onEndReached={() => fetchPosts(page)}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                hasMore && posts.length > 0 ? (
                  <ActivityIndicator
                    size="small"
                    color="#1877F2"
                    style={styles.listFooter}
                  />
                ) : null
              }
            />
          )}
          <Modal
            visible={reactionModal.visible}
            transparent
            animationType="fade"
            onRequestClose={() => setReactionModal({ visible: false, postId: null })}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.reactionModalContent}>
                {reactionTypesLoading ? (
                  <ActivityIndicator size="small" color="#1877F2" />
                ) : reactionTypes.length === 0 ? (
                  <Text style={styles.modalText}>No reactions available</Text>
                ) : (
                  <View style={styles.reactionPicker}>
                    {reactionTypes.map((r) => {
                      const scaleAnim = new Animated.Value(1);
                      const handlePressIn = () => {
                        Animated.spring(scaleAnim, {
                          toValue: 1.2,
                          friction: 8,
                          useNativeDriver: true,
                        }).start();
                      };
                      const handlePressOut = () => {
                        Animated.spring(scaleAnim, {
                          toValue: 1,
                          friction: 8,
                          useNativeDriver: true,
                        }).start();
                      };
                      return (
                        <TouchableOpacity
                          key={r.reactionTypeId}
                          style={styles.reactionButton}
                          onPress={() =>
                            handleReaction(reactionModal.postId, r.reactionTypeId)
                          }
                          onPressIn={handlePressIn}
                          onPressOut={handlePressOut}
                        >
                          <Animated.Image
                            source={{ uri: r.iconUrl || 'https://placehold.co/40x40' }}
                            style={[styles.reactionIcon, { transform: [{ scale: scaleAnim }] }]}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </Modal>
          <Modal
            visible={reportModal.visible}
            transparent
            animationType="slide"
            onRequestClose={() => setReportModal({ visible: false, postId: null })}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Report Post</Text>
                <FlatList
                  data={reportReasons}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.reasonButton,
                        reportReasonId === item.reasonId && styles.selectedReasonButton,
                      ]}
                      onPress={() => setReportReasonId(item.reasonId)}
                    >
                      <Text style={styles.reasonText}>{item.reasonName}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.reasonId.toString()}
                  style={styles.reasonList}
                />
                <TextInput
                  style={styles.reportInput}
                  placeholder="Provide details..."
                  value={reportDetails}
                  onChangeText={setReportDetails}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.submitReportButton,
                    (!reportReasonId || !reportDetails.trim()) &&
                      styles.submitReportButtonDisabled,
                  ]}
                  onPress={handleReport}
                  disabled={!reportReasonId || !reportDetails.trim()}
                >
                  <Text style={styles.submitReportText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setReportModal({ visible: false, postId: null })}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Facebook's light gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C2526',
    fontFamily: 'Inter_600SemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C2526',
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
  },
  groupSelectionContainer: {
    flex: 1,
  },
  groupList: {
    padding: 16,
  },
  groupItem: {
    marginBottom: 12,
  },
  groupCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C2526',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#65676B',
    fontFamily: 'Inter_400Regular',
  },
  groupMemberCount: {
    fontSize: 12,
    color: '#65676B',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  postInputContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postInputWrapper: {
    flex: 1,
  },
  postInput: {
    fontSize: 16,
    color: '#1C2526',
    padding: 12,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    minHeight: 48,
    fontFamily: 'Inter_400Regular',
  },
  postActionsRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  postActionText: {
    fontSize: 14,
    color: '#65676B',
    marginLeft: 4,
    fontFamily: 'Inter_400Regular',
  },
  imagePreview: {
    position: 'relative',
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreviewThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
  },
  postButton: {
    backgroundColor: '#1877F2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  postButtonDisabled: {
    backgroundColor: '#B0B3B8',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  postsList: {
    padding: 8,
  },
  postContainer: {
    marginBottom: 8,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 8,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C2526',
    fontFamily: 'Inter_600SemiBold',
  },
  postTime: {
    fontSize: 12,
    color: '#65676B',
    fontFamily: 'Inter_400Regular',
  },
  postContent: {
    fontSize: 15,
    color: '#1C2526',
    paddingHorizontal: 12,
    paddingBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  postThumbnail: {
    width: '100%',
    height: 300,
    marginBottom: 8,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
  },
  reactionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionStatIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 13,
    color: '#65676B',
    fontFamily: 'Inter_400Regular',
  },
  commentShareStats: {
    fontSize: 13,
    color: '#65676B',
    fontFamily: 'Inter_400Regular',
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
    paddingVertical: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#65676B',
    marginLeft: 6,
    fontFamily: 'Inter_600SemiBold',
  },
  commentsContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 16,
    padding: 8,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C2526',
    fontFamily: 'Inter_600SemiBold',
  },
  commentText: {
    fontSize: 13,
    color: '#1C2526',
    fontFamily: 'Inter_400Regular',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
  },
  commentInputWrapper: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  commentInput: {
    fontSize: 14,
    color: '#1C2526',
    minHeight: 32,
    fontFamily: 'Inter_400Regular',
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  commentSendButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifText: {
    fontSize: 13,
    color: '#1877F2',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  tagList: {
    marginTop: 8,
    paddingHorizontal: 12,
  },
  tag: {
    backgroundColor: '#E4E6EB',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTag: {
    backgroundColor: '#1877F2',
  },
  tagText: {
    fontSize: 13,
    color: '#1877F2',
    fontFamily: 'Inter_400Regular',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1C2526',
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    backgroundColor: '#FFE5E5',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  errorMessageText: {
    color: '#D32F2F',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  retryButton: {
    backgroundColor: '#1877F2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#65676B',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#1877F2',
    marginLeft: 8,
    fontFamily: 'Inter_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: width * 0.85,
    maxHeight: '80%',
  },
  reactionModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C2526',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  reactionPicker: {
    flexDirection: 'row',
    padding: 4,
  },
  reactionButton: {
    padding: 8,
  },
  reactionIcon: {
    width: 40,
    height: 40,
  },
  modalText: {
    fontSize: 14,
    color: '#65676B',
    fontFamily: 'Inter_400Regular',
  },
  reasonList: {
    width: '100%',
    marginBottom: 8,
  },
  reasonButton: {
    padding: 12,
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedReasonButton: {
    backgroundColor: '#E4E6EB',
    borderWidth: 1,
    borderColor: '#1877F2',
  },
  reasonText: {
    fontSize: 16,
    color: '#1C2526',
    fontFamily: 'Inter_400Regular',
  },
  reportInput: {
    width: '100%',
    height: 80,
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C2526',
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  submitReportButton: {
    backgroundColor: '#1877F2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitReportButtonDisabled: {
    backgroundColor: '#B0B3B8',
  },
  submitReportText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  modalCloseButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#1877F2',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  listFooter: {
    paddingVertical: 16,
  },
});

export default CommunityScreen;