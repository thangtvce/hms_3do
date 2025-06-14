import React, { useState, useEffect, useContext, useRef } from 'react';
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
  Platform,
  StatusBar,
  RefreshControl,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import CommunityService from 'services/apiCommunityService';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from 'context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import RenderHtml from 'react-native-render-html';

const { width, height } = Dimensions.get('window');
const SPACING = 16;
const AVATAR_SIZE = 40;

const CommunityScreen = () => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const headerHeight = useRef(new Animated.Value(Platform.OS === 'ios' ? 90 : 70)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const likeAnimations = useRef({}).current;

  // State variables
  const [image, setImage] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { user, authLoading, logout } = useContext(AuthContext);
  const groupIdParam = route.params?.groupId ? Number(route.params.groupId) : null;
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
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
  const [refreshing, setRefreshing] = useState(false);
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });

  // Animate components on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Header animation based on scroll
  const headerAnimatedStyle = {
    height: headerHeight,
    opacity: scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.98],
      extrapolate: 'clamp',
    }),
    shadowOpacity: scrollY.interpolate({
      inputRange: [0, 50],
      outputRange: [0, 0.25],
      extrapolate: 'clamp',
    }),
  };

  // Function to check authentication and fetch initial data
  const checkAuthAndFetchData = async () => {
    if (authLoading) return;
    if (!user) {
      navigation.replace('Login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [groupsData, tagsData] = await Promise.all([
        CommunityService.fetchGroups(),
        CommunityService.fetchTags(),
      ]);

      setGroups(groupsData.length ? groupsData : []);
      setTags(tagsData);
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
          { text: 'OK', onPress: () => logout() },
        ]);
      } else {
        setError('Failed to load data. Please try again.');
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
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

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [user, authLoading, navigation, logout]);

  // Load reaction types when reaction modal is opened
  useEffect(() => {
    if (reactionModal.visible && reactionTypes.length === 0) {
      setReactionTypesLoading(true);
      CommunityService.fetchReactionTypes()
        .then((types) => setReactionTypes(types))
        .catch((err) => Alert.alert('Error', 'Failed to load reactions: ' + err.message))
        .finally(() => setReactionTypesLoading(false));
    }
  }, [reactionModal.visible]);

  // Load report reasons when report modal is opened
  useEffect(() => {
    if (reportModal.visible && reportReasons.length === 0) {
      CommunityService.fetchReportReasons()
        .then((reasons) => setReportReasons(reasons))
        .catch((err) => Alert.alert('Error', 'Failed to load report reasons: ' + err.message));
    }
  }, [reportModal.visible]);

  // Set selected group from route params if available
  useEffect(() => {
    if (groups.length > 0 && groupIdParam) {
      const found = groups.find((g) => g.groupId === groupIdParam);
      if (found) setSelectedGroup(found);
    }
  }, [groups, groupIdParam]);

  // Fetch posts when a group is selected or search query changes
 useEffect(() => {
  if (selectedGroup) {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1);
  }
}, [selectedGroup, searchQuery, searchTagId]);

  // Fetch reactions for posts
  useEffect(() => {
    posts.forEach((post) => {
      if (!reactions[post.postId]) {
        fetchReactions(post.postId);
      }
    });
  }, [posts]);

  // Fetch posts for the selected group
const fetchPosts = async (pageNum = 1) => {
  if (!selectedGroup) {
    setError('No group selected');
    Alert.alert('Error', 'Please select a group to view posts');
    setLoading(false);
    return;
  }

  setLoading(true);
  setError(null);
  try {
    const result = await CommunityService.fetchPosts({
      groupId: selectedGroup.groupId,
      pageNumber: pageNum,
      pageSize,
      searchTerm: searchQuery || undefined,
    });
    console.log('FetchPosts Input:', { groupId: selectedGroup.groupId, pageNumber: pageNum, pageSize, searchQuery });
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('Posts Length:', result.posts?.length);
    const newPosts = Array.isArray(result.posts)
      ? result.posts
      : Array.isArray(result.data?.Posts)
      ? result.data.Posts
      : [];
      console.log('Các bài đăng mới đã trích xuất (newPosts):', newPosts);
console.log('Số lượng bài đăng mới:', newPosts.length);
    console.log('New Posts:', newPosts);
    setPosts(pageNum === 1 ? newPosts : [...posts, ...newPosts]);
    console.log('Tổng số bài đăng trong state (sau cập nhật):', posts.length + newPosts.length);
    setTotalPages(result.totalPages || result.data?.TotalPages || 0);
    setHasMore((result.totalPages || result.data?.TotalPages || 0) > pageNum);
    setPage(pageNum);
  } catch (err) {
    console.error('FetchPosts Error:', err);
    setError(err.message || 'Failed to load posts');
    Alert.alert('Error', err.message || 'Failed to load posts');
  } finally {
    setLoading(false);
  }
};
  // Refresh posts
  const onRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    setError(null);
    try {
      if (selectedGroup) {
        setPage(1);
        setPosts([]);
        await fetchPosts(1);
      } else {
        const [groupsData, tagsData] = await Promise.all([
          CommunityService.fetchGroups(),
          CommunityService.fetchTags(),
        ]);
        setGroups(groupsData.length ? groupsData : []);
        setTags(tagsData);
      }
    } catch (error) {
      setError('Failed to refresh data.');
      Alert.alert('Error', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Search posts
  const searchPosts = async () => {
    if (!selectedGroup) return;
    setPage(1);
    setPosts([]);
    await fetchPosts(1);
  };

  // Fetch comments for a post
  const fetchComments = async (postId) => {
    try {
      const response = await CommunityService.fetchComments(postId);
      setComments((prev) => ({ ...prev, [postId]: response }));
    } catch (error) {
      Alert.alert('Error', 'Failed to load comments: ' + error.message);
    }
  };

  // Fetch reactions for a post
  const fetchReactions = async (postId) => {
    try {
      const response = await CommunityService.fetchReactions(postId);
      setReactions((prev) => ({ ...prev, [postId]: response }));
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  };

  // Pick an image for a quick post
  const handlePickQuickPostImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setQuickPostImage(result.assets[0]);
    }
  };

  // Pick an image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Create a new post
  const handlePost = async (groupId, content) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }
    if (!content.trim() && !quickPostImage) {
      Alert.alert('Error', 'Post content cannot be empty.');
      return;
    }

    setIsQuickPostUploading(true);
    setQuickPostError(null);

    try {
      let imageUrl = null;

      if (quickPostImage) {
        try {
          const uploadResponse = await CommunityService.uploadImage(quickPostImage);
          if (uploadResponse.statusCode === 200) {
            imageUrl = uploadResponse.data.imageUrl;
          } else {
            throw new Error('Failed to upload image');
          }
        } catch (error) {
          setQuickPostError(error.message || 'Failed to upload image');
          setIsQuickPostUploading(false);
          return;
        }
      }

      const tagIds = selectedTags.map((tag) => tag.tagId);
      const response = await CommunityService.createPost(groupId, content, imageUrl, tagIds);

      if (response.statusCode === 201) {
        setPosts((prev) => [response.data, ...prev]);
        setPostContent('');
        setQuickPostImage(null);
        setSelectedTags([]);
        showSuccessToast('Post created successfully!');
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      setQuickPostError(error.message || 'Failed to create post');
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsQuickPostUploading(false);
    }
  };

  // Show success toast
  const showSuccessToast = (message) => {
    setSuccessToast({ visible: true, message });
    setTimeout(() => {
      setSuccessToast({ visible: false, message: '' });
    }, 3000);
  };

  // Create a new comment
  const handleComment = async (postId) => {
    if (!commentInput[postId]?.trim()) return;

    try {
      const response = await CommunityService.createComment(postId, commentInput[postId]);
      if (response.statusCode === 201) {
        setComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), response.data],
        }));
        setCommentInput((prev) => ({ ...prev, [postId]: '' }));
      } else {
        Alert.alert('Error', 'Failed to post comment.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Create or update a reaction
  const handleReaction = async (postId, reactionTypeId) => {
    try {
      if (!likeAnimations[postId]) {
        likeAnimations[postId] = new Animated.Value(1);
      }

      Animated.sequence([
        Animated.timing(likeAnimations[postId], {
          toValue: 1.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimations[postId], {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      const response = await CommunityService.createReaction(postId, reactionTypeId);
      if (response.statusCode === 201 || response.statusCode === 200) {
        fetchReactions(postId);
        setReactionModal({ visible: false, postId: null });
      } else {
        Alert.alert('Error', 'Failed to react to post.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Submit a report
  const handleReport = async () => {
    if (!reportReasonId || !reportDetails.trim()) return;

    try {
      const response = await CommunityService.reportPost(reportModal.postId, reportReasonId, reportDetails);
      if (response.statusCode === 201) {
        showSuccessToast('Report submitted successfully.');
        setReportModal({ visible: false, postId: null });
        setReportReasonId(null);
        setReportDetails('');
      } else {
        Alert.alert('Error', 'Failed to submit report.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Toggle comments visibility
  const toggleComments = (postId) => {
    setShowCommentsMap((prev) => {
      const newState = { ...prev, [postId]: !prev[postId] };
      if (newState[postId] && (!comments[postId] || comments[postId].length === 0)) {
        fetchComments(postId);
      }
      return newState;
    });
  };

  // Join a group
const handleJoinGroup = async (groupId) => {
  try {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a group.');
      return;
    }

    setLoading(true);
    const response = await CommunityService.joinGroup(groupId);
    if (response.statusCode !== 500) {
      showSuccessToast('You have joined the group.');
      const updatedGroups = await CommunityService.fetchGroups();
      setGroups(updatedGroups);
      // Update selectedGroup if joining the current group
      const joinedGroup = updatedGroups.find((g) => g.groupId === groupId);
      if (joinedGroup?.isJoin) {
        setSelectedGroup(joinedGroup);
      }
    } else {
      Alert.alert('Error', 'Failed to join the group.');
    }
  } catch (error) {
    Alert.alert('Error', error.message || 'Failed to join the group.');
  } finally {
    setLoading(false);
  }
};

  // Render a group item
const renderGroup = ({ item, index }) => {
  const scaleAnim = new Animated.Value(1);
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  };

  const itemAnimatedStyle = {
    opacity: fadeAnim,
    transform: [
      {
        translateY: translateY.interpolate({
          inputRange: [0, 1],
          outputRange: [20 + index * 10, 0],
        }),
      },
      { scale: scaleAnim },
    ],
  };

  console.log('Rendering Group:', { groupId: item.groupId, groupName: item.groupName, isJoin: item.isJoin });

  return (
    <Animated.View style={[styles.groupItemContainer, itemAnimatedStyle]}>
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => {
          if (!item.isJoin) {
            Alert.alert('Join Required', 'You need to join this group to view its content.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Join', onPress: () => handleJoinGroup(item.groupId) },
            ]);
            return;
          }
          setSelectedGroup(item);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.05)']}
          style={styles.groupCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image source={{ uri: item.thumbnail || 'https://placehold.co/100x100' }} style={styles.groupImage} />
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.groupName}</Text>
            {item.description && (
              <View style={styles.groupDescriptionContainer}>
                <RenderHtml
                  contentWidth={width - 150}
                  source={{ html: item.description }}
                  tagsStyles={{
                    p: { margin: 0, padding: 0, color: '#64748B', fontSize: 14, lineHeight: 20 },
                    strong: { fontWeight: 'bold', color: '#334155' },
                    em: { fontStyle: 'italic' },
                    a: { color: '#5E72E4', textDecorationLine: 'underline' },
                  }}
                />
              </View>
            )}
            <View style={styles.groupMetaContainer}>
              <View style={styles.groupMemberCountContainer}>
                <Ionicons name="people" size={14} color="#5E72E4" />
                <Text style={styles.groupMemberCount}>{item.memberCount || 0} members</Text>
              </View>
              {item.isJoin ? (
                <View style={styles.joinedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.joinedText}>Joined</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinGroup(item.groupId)}>
                  <Ionicons name="add-circle-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

  // Render a post item
  const renderPost = ({ item, index }) => {
      console.log('Đang cố gắng hiển thị bài đăng:', item.postId, item.content);

    const scaleAnim = new Animated.Value(1);
    const handlePressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.98, friction: 8, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
    };

    if (!likeAnimations[item.postId]) {
      likeAnimations[item.postId] = new Animated.Value(1);
    }

    const itemAnimatedStyle = {
      opacity: fadeAnim,
      transform: [
        {
          translateY: translateY.interpolate({
            inputRange: [0, 1],
            outputRange: [20 + index * 10, 0],
          }),
        },
        { scale: scaleAnim },
      ],
    };

    const hasReacted = (reactions[item.postId] || []).some((r) => r.userId === user?.userId);
    const userReaction = (reactions[item.postId] || []).find((r) => r.userId === user?.userId);
    const reactionIcon = userReaction
      ? reactionTypes.find((rt) => rt.reactionTypeId === userReaction.reactionTypeId)?.iconUrl
      : null;

    return (
      <Animated.View style={[styles.postContainer, itemAnimatedStyle]}>
        <TouchableOpacity activeOpacity={0.95} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image source={{ uri: item.userAvatar || 'https://placehold.co/40x40' }} style={styles.avatar} />
              <View style={styles.postHeaderInfo}>
                <Text style={styles.username}>{item.userFullName || 'Unknown User'}</Text>
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
                style={styles.postOptionsButton}
                onPress={() => setReportModal({ visible: true, postId: item.postId })}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#65676B" />
              </TouchableOpacity>
            </View>

            {item.content && <Text style={styles.postContent}>{item.content}</Text>}

            {item.thumbnail && (
              <View style={styles.postImageContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.postThumbnail} resizeMode="cover" />
              </View>
            )}

            {item.tags?.length > 0 && (
              <View style={styles.tagContainer}>
                {item.tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.tagId}
                    style={styles.tag}
                    onPress={() => {
                      setSearchTagId(tag.tagId);
                      setSearchQuery(`#${tag.tagName}`);
                      searchPosts();
                    }}
                  >
                    <Text style={styles.tagText}>#{tag.tagName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.postStats}>
              <View style={styles.reactionStats}>
                {reactionIcon && <Image source={{ uri: reactionIcon }} style={styles.reactionStatIcon} />}
                <Text style={styles.reactionCount}>
                  {reactions[item.postId]?.length || 0}{' '}
                  {reactions[item.postId]?.length === 1 ? 'reaction' : 'reactions'}
                </Text>
              </View>
              <Text style={styles.commentShareStats}>
                {comments[item.postId]?.length || 0}{' '}
                {comments[item.postId]?.length === 1 ? 'comment' : 'comments'}
              </Text>
            </View>

            <View style={styles.postActions}>
              <TouchableOpacity
                style={[styles.actionButton, hasReacted && styles.activeActionButton]}
                onPress={() => {
                  if (hasReacted) {
                    handleReaction(item.postId, userReaction.reactionTypeId);
                  } else {
                    setReactionModal({ visible: true, postId: item.postId });
                  }
                }}
              >
                <Animated.View style={{ transform: [{ scale: likeAnimations[item.postId] }] }}>
                  <Ionicons
                    name={hasReacted ? 'heart' : 'heart-outline'}
                    size={20}
                    color={hasReacted ? '#5E72E4' : '#65676B'}
                  />
                </Animated.View>
                <Text style={[styles.actionText, hasReacted && styles.activeActionText]}>
                  {hasReacted ? 'Liked' : 'Like'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={() => toggleComments(item.postId)}>
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
                      source={{ uri: comment.userAvatar || 'https://placehold.co/32x32' }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUsername}>{comment.userFullName || 'Unknown User'}</Text>
                      <Text style={styles.commentText}>{comment.commentText}</Text>
                      <View style={styles.commentActions}>
                        <Text style={styles.commentTime}>
                          {new Date(comment.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </Text>
                        <TouchableOpacity>
                          <Text style={styles.commentActionText}>Like</Text>
                        </TouchableOpacity>
                        <TouchableOpacity>
                          <Text style={styles.commentActionText}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}

                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  keyboardVerticalOffset={100}
                >
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
                      <View style={styles.commentInputActions}>
                        <TouchableOpacity style={styles.commentInputAction}>
                          <Ionicons name="camera-outline" size={20} color="#65676B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.commentInputAction}>
                          <Ionicons name="happy-outline" size={20} color="#65676B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.commentInputAction}>
                          <Text style={styles.gifText}>GIF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.commentSendButton,
                        !commentInput[item.postId]?.trim() && styles.commentSendButtonDisabled,
                      ]}
                      onPress={() => handleComment(item.postId)}
                      disabled={!commentInput[item.postId]?.trim()}
                    >
                      <Ionicons
                        name="send"
                        size={18}
                        color={commentInput[item.postId]?.trim() ? '#5E72E4' : '#B0B3B8'}
                      />
                    </TouchableOpacity>
                  </View>
                </KeyboardAvoidingView>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const userAvatar = user?.avatar || 'https://placehold.co/40x40';

  // Render header
  const renderHeader = () => (
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.headerContent}>
        {selectedGroup ? (
          <>
            <TouchableOpacity style={styles.headerBackButton} onPress={() => setSelectedGroup(null)}>
              <Ionicons name="arrow-back" size={24} color="#5E72E4" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {selectedGroup.groupName}
            </Text>
            <TouchableOpacity style={styles.headerActionButton} onPress={() => setIsSearchFocused(true)}>
              <Ionicons name="search" size={24} color="#5E72E4" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>Communities</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionButton} onPress={() => setIsSearchFocused(true)}>
                <Ionicons name="search" size={24} color="#5E72E4" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionButton}>
                <Ionicons name="notifications-outline" size={24} color="#5E72E4" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>3</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );

  // Render search bar
  const renderSearchBar = () => {
    if (!selectedGroup) return null;

    return (
      <Animated.View style={[styles.searchContainer, { opacity: fadeAnim, transform: [{ translateY }] }]}>
        <Ionicons
          name="search"
          size={20}
          color={isSearchFocused ? '#5E72E4' : '#65676B'}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts or tags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchPosts}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholderTextColor="#A0A0A0"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.searchClearButton}
            onPress={() => {
              setSearchQuery('');
              setSearchTagId(null);
              onRefresh();
            }}
          >
            <Ionicons name="close-circle" size={18} color="#65676B" />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  // Render post input
  const renderPostInput = () => {
    if (!selectedGroup) return null;

    return (
      <Animated.View style={[styles.postInputContainer, { opacity: fadeAnim, transform: [{ translateY }] }]}>
        <View style={styles.postInputHeader}>
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
          <TouchableOpacity style={styles.postInputField} activeOpacity={0.8}>
            <TextInput
              style={styles.postInput}
              placeholder="What's on your mind?"
              value={postContent}
              onChangeText={setPostContent}
              multiline
              maxLength={2000}
            />
          </TouchableOpacity>
        </View>

        {quickPostImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: quickPostImage.uri }} style={styles.imagePreviewThumbnail} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setQuickPostImage(null)}>
              <Ionicons name="close-circle" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.postActionsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagScrollContainer}
          >
            {tags.map((item) => {
              const isSelected = selectedTags.some((t) => t.tagId === item.tagId);
              return (
                <TouchableOpacity
                  key={item.tagId}
                  style={[styles.tag, isSelected && styles.selectedTag]}
                  onPress={() =>
                    setSelectedTags((prev) =>
                      prev.some((t) => t.tagId === item.tagId)
                        ? prev.filter((t) => t.tagId !== item.tagId)
                        : [...prev, item]
                    )
                  }
                >
                  <Text style={[styles.tagText, isSelected && styles.selectedTagText]}>#{item.tagName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.postActionButtons}>
          <View style={styles.postActionButtonsLeft}>
            <TouchableOpacity style={styles.postActionButton} onPress={handlePickQuickPostImage}>
              <Ionicons name="image" size={20} color="#5E72E4" />
              <Text style={styles.postActionText}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.postActionButton}>
              <Ionicons name="videocam" size={20} color="#F59E0B" />
              <Text style={styles.postActionText}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.postActionButton}>
              <Ionicons name="happy" size={20} color="#10B981" />
              <Text style={styles.postActionText}>Feeling</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.postButton,
              (!postContent.trim() && !quickPostImage) && styles.postButtonDisabled,
            ]}
            onPress={() => handlePost(selectedGroup.groupId, postContent)}
            disabled={(!postContent.trim() && !quickPostImage) || loading}
          >
            {isQuickPostUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#FFFFFF" style={styles.postButtonIcon} />
                <Text style={styles.postButtonText}>Post</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {quickPostError && (
          <View style={styles.errorMessage}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorMessageText}>{quickPostError}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // Render success toast
  const renderSuccessToast = () => {
    if (!successToast.visible) return null;

    return (
      <Animated.View style={[styles.successToast, { opacity: fadeAnim, transform: [{ translateY }] }]}>
        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        <Text style={styles.successToastText}>{successToast.message}</Text>
      </Animated.View>
    );
  };

  // Main render
  return (
    <View style={styles.container}>
      {renderHeader()}

      {authLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5E72E4" />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      ) : loading && groups.length === 0 ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5E72E4" />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      ) : error && groups.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={checkAuthAndFetchData} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !selectedGroup ? (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.groupId.toString()}
          contentContainerStyle={styles.groupList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#5E72E4']}
              tintColor="#5E72E4"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={60} color="#A0A0A0" />
              <Text style={styles.emptyText}>No communities available.</Text>
              <Text style={styles.emptySubtext}>Join or create a community to get started.</Text>
            </View>
          }
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}
        />
      ) : (
        <>
          {renderSearchBar()}
          {renderPostInput()}
{selectedGroup && loading && !posts.length ? (
  <View style={styles.emptyContainer}>
    <ActivityIndicator size="large" color="#5E72E4" />
    <Text style={styles.emptyText}>Loading posts...</Text>
  </View>
) : posts.length === 0 && selectedGroup ? (
  <View style={styles.emptyContainer}>
    <Ionicons name="chatbubbles-outline" size={60} color="#A0A0A0" />
    <Text style={styles.emptyText}>{error || 'No posts available.'}</Text>
    <Text style={styles.emptySubtext}>Be the first to share something!</Text>
  </View>
) : selectedGroup ? (
  <FlatList
    data={posts}
    renderItem={({ item, index }) => {
      console.log('Rendering Post:', item);
      return renderPost({ item, index });
    }}
    keyExtractor={(item) => item.postId.toString()}
    contentContainerStyle={styles.postsList}
    onEndReached={() => {
      if (hasMore && !loading) {
        const nextPage = page + 1;
        fetchPosts(nextPage);
      }
    }}
    onEndReachedThreshold={0.5}
    showsVerticalScrollIndicator={false}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={['#5E72E4']}
        tintColor="#5E72E4"
      />
    }
    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: false,
    })}
    scrollEventThrottle={16}
    ListFooterComponent={
      hasMore && posts.length > 0 ? (
        <View style={styles.listFooter}>
          <ActivityIndicator size="small" color="#5E72E4" />
          <Text style={styles.loadingMoreText}>Loading more posts...</Text>
        </View>
      ) : null
    }
  />
) : null}

          <Modal
            visible={reactionModal.visible}
            transparent
            animationType="fade"
            onRequestClose={() => setReactionModal({ visible: false, postId: null })}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setReactionModal({ visible: false, postId: null })}
            >
              <BlurView intensity={30} style={StyleSheet.absoluteFill} />
              <Animated.View style={[styles.reactionModalContent, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                {reactionTypesLoading ? (
                  <ActivityIndicator size="small" color="#5E72E4" />
                ) : reactionTypes.length === 0 ? (
                  <Text style={styles.modalText}>No reactions available</Text>
                ) : (
                  <View style={styles.reactionPicker}>
                    {reactionTypes.map((r) => {
                      const scaleAnim = new Animated.Value(1);
                      const handlePressIn = () => {
                        Animated.spring(scaleAnim, { toValue: 1.3, friction: 5, useNativeDriver: true }).start();
                      };
                      const handlePressOut = () => {
                        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
                      };
                      return (
                        <TouchableOpacity
                          key={r.reactionTypeId}
                          style={styles.reactionButton}
                          onPress={() => handleReaction(reactionModal.postId, r.reactionTypeId)}
                          onPressIn={handlePressIn}
                          onPressOut={handlePressOut}
                        >
                          <Animated.Image
                            source={{ uri: r.iconUrl || 'https://placehold.co/40x40' }}
                            style={[styles.reactionIcon, { transform: [{ scale: scaleAnim }] }]}
                          />
                          <Text style={styles.reactionName}>{r.reactionName}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          </Modal>

          <Modal
            visible={reportModal.visible}
            transparent
            animationType="slide"
            onRequestClose={() => setReportModal({ visible: false, postId: null })}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setReportModal({ visible: false, postId: null })}
            >
              <BlurView intensity={30} style={StyleSheet.absoluteFill} />
              <TouchableOpacity
                activeOpacity={1}
                style={styles.modalContentWrapper}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Report Post</Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setReportModal({ visible: false, postId: null })}
                    >
                      <Ionicons name="close" size={24} color="#65676B" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalSubtitle}>Please select a reason for reporting this post:</Text>

                  <FlatList
                    data={reportReasons}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.reasonButton, reportReasonId === item.reasonId && styles.selectedReasonButton]}
                        onPress={() => setReportReasonId(item.reasonId)}
                      >
                        <Text
                          style={[styles.reasonText, reportReasonId === item.reasonId && styles.selectedReasonText]}
                        >
                          {item.reasonName}
                        </Text>
                        {reportReasonId === item.reasonId && (
                          <Ionicons name="checkmark-circle" size={20} color="#5E72E4" />
                        )}
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.reasonId.toString()}
                    style={styles.reasonList}
                  />

                  <TextInput
                    style={styles.reportInput}
                    placeholder="Provide additional details..."
                    value={reportDetails}
                    onChangeText={setReportDetails}
                    multiline
                    placeholderTextColor="#A0A0A0"
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitReportButton,
                      (!reportReasonId || !reportDetails.trim()) && styles.submitReportButtonDisabled,
                    ]}
                    onPress={handleReport}
                    disabled={!reportReasonId || !reportDetails.trim()}
                  >
                    <Text style={styles.submitReportText}>Submit Report</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </>
      )}

      {renderSuccessToast()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING,
    paddingBottom: 12,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1F36',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    marginLeft: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING,
    marginVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1F36',
    paddingVertical: 10,
  },
  searchClearButton: {
    padding: 4,
  },
  groupList: {
    padding: SPACING,
    paddingTop: 8,
  },
  groupItemContainer: {
    marginBottom: 16,
  },
  groupItem: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  groupCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
  },
  groupImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 20,
  },
  groupMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
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
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  joinedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5E72E4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  postInputContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  postInputField: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  postInput: {
    fontSize: 16,
    color: '#1A1F36',
    minHeight: 40,
    paddingVertical: 8,
  },
  imagePreview: {
    position: 'relative',
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  imagePreviewThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  tagScrollContainer: {
    paddingVertical: 8,
  },
  postActionsRow: {
    marginTop: 12,
  },
  postActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  postActionButtonsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  postActionText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5E72E4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  postButtonIcon: {
    marginRight: 6,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  errorMessageText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
  },
  postsList: {
    padding: SPACING,
    paddingTop: 8,
  },
  postContainer: {
    marginBottom: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F36',
  },
  postTime: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  postOptionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContent: {
    fontSize: 16,
    color: '#1A1F36',
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 22,
  },
  postImageContainer: {
    width: '100%',
    height: 300,
    marginBottom: 12,
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTag: {
    backgroundColor: '#5E72E4',
  },
  tagText: {
    fontSize: 13,
    color: '#5E72E4',
    fontWeight: '500',
  },
  selectedTagText: {
    color: '#FFFFFF',
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reactionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionStatIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  reactionCount: {
    fontSize: 13,
    color: '#64748B',
  },
  commentShareStats: {
    fontSize: 13,
    color: '#64748B',
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeActionButton: {
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
  },
  actionText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '600',
  },
  activeActionText: {
    color: '#5E72E4',
  },
  commentsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 12,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
  },
  commentTime: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 12,
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5E72E4',
    marginRight: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  commentInputWrapper: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
  },
  commentInput: {
    fontSize: 14,
    color: '#1A1F36',
    minHeight: 36,
    maxHeight: 100,
  },
  commentInputActions: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 4,
  },
  commentInputAction: {
    marginRight: 12,
    padding: 2,
  },
  commentSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  commentSendButtonDisabled: {
    backgroundColor: 'rgba(203, 213, 225, 0.4)',
  },
  gifText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5E72E4',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5E72E4',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#5E72E4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
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
    color: '#5E72E4',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentWrapper: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1F36',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  reactionModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionPicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionButton: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  reactionIcon: {
    width: 40,
    height: 40,
    marginBottom: 4,
  },
  reactionName: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#64748B',
    padding: 16,
  },
  reasonList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  reasonButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  selectedReasonButton: {
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    borderWidth: 1,
    borderColor: '#5E72E4',
  },
  reasonText: {
    fontSize: 14,
    color: '#1A1F36',
    flex: 1,
  },
  selectedReasonText: {
    color: '#5E72E4',
    fontWeight: '600',
  },
  reportInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#1A1F36',
    marginBottom: 16,
  },
  submitReportButton: {
    backgroundColor: '#5E72E4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitReportButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitReportText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#5E72E4',
    marginLeft: 8,
  },
  successToast: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  successToastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  groupDescriptionContainer: {
    marginBottom: 8,
    maxHeight: 60,
    overflow: 'hidden',
  },
});

export default CommunityScreen;