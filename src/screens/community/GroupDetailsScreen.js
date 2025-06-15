import React,{ useEffect,useState,useRef } from "react"
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  Modal,
  Pressable,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
  ScrollView,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons,Feather } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import {
  getGroupActiveById,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  getAllReactionTypes,
  getCommentsByPostId,
  addCommentByUser,
  editCommentByUser,
  deleteUserComment,
  deletePost,
  reactToPost,
  unreactToPost,
  getAllActiveReportReasons,
  createReportByUser,
} from "../../services/apiCommunityService"
import { useNavigation,useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import RenderHtml from "react-native-render-html"
import DynamicStatusBar from "screens/statusBar/DynamicStatusBar"
import { theme } from "theme/color"

const { width,height } = Dimensions.get("window")

const GroupDetailsScreen = ({ route }) => {
  const navigation = useNavigation()
  const { groupId } = route.params

  // State variables
  const [group,setGroup] = useState(null)
  const [loading,setLoading] = useState(true)
  const [joining,setJoining] = useState(false)
  const [error,setError] = useState(null)
  const [posts,setPosts] = useState([])
  const [postLoading,setPostLoading] = useState(false)
  const [postError,setPostError] = useState(null)
  const [pageNumber,setPageNumber] = useState(1)
  const [pageSize,setPageSize] = useState(10)
  const [totalPages,setTotalPages] = useState(1)
  const [totalCount,setTotalCount] = useState(0)
  const [hasMore,setHasMore] = useState(true)
  const [searchTerm,setSearchTerm] = useState("")
  const [refreshing,setRefreshing] = useState(false)

  // Filter states
  const [showFilterModal,setShowFilterModal] = useState(false)
  const [filters,setFilters] = useState({
    startDate: null,
    endDate: null,
    status: "active",
    validPageSize: 10,
  })
  const [tempFilters,setTempFilters] = useState(filters)
  const [showCustomStartDatePicker,setShowCustomStartDatePicker] = useState(false)
  const [showCustomEndDatePicker,setShowCustomEndDatePicker] = useState(false)

  // Reaction and comment states
  const [reactionTypes,setReactionTypes] = useState([])
  const [showReactionPicker,setShowReactionPicker] = useState(false)
  const [selectedPostId,setSelectedPostId] = useState(null)
  const [showCommentsForPost,setShowCommentsForPost] = useState(null)
  const [commentsByPost,setCommentsByPost] = useState({})
  const [loadingComments,setLoadingComments] = useState({})
  const [commentInputs,setCommentInputs] = useState({})
  const [commentSending,setCommentSending] = useState({})
  const [commentError,setCommentError] = useState({})
  const [commentLoading,setCommentLoading] = useState({})
  const [reactionLoading,setReactionLoading] = useState({})

  // Edit and action states
  const [editModal,setEditModal] = useState({ visible: false,comment: null,postId: null })
  const [editInput,setEditInput] = useState("")
  const [editLoading,setEditLoading] = useState(false)
  const [editError,setEditError] = useState("")
  const [actionMenu,setActionMenu] = useState({ visible: false,comment: null,postId: null })
  const [currentUserId,setCurrentUserId] = useState(null)
  const [deleteLoading,setDeleteLoading] = useState(false)
  const [postActionMenu,setPostActionMenu] = useState({ visible: false,post: null })
  const [deletePostLoading,setDeletePostLoading] = useState(false)

  // Report states
  const [reportModal,setReportModal] = useState({ visible: false,post: null })
  const [reportReasons,setReportReasons] = useState([])
  const [selectedReason,setSelectedReason] = useState(null)
  const [reportDetails,setReportDetails] = useState("")
  const [reportLoading,setReportLoading] = useState(false)
  const [reportStatus,setReportStatus] = useState("")

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current

  // Animation setup
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,{
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim,{
        toValue: 0,
        duration: 800,
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

  // Fetch functions
  const fetchGroupAndPosts = async (page = 1,refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else if (page === 1) {
        setLoading(true)
      }

      const formatDate = (date) => {
        if (!date) return undefined
        return `${(date.getMonth() + 1).toString().padStart(2,"0")}-${date
          .getDate()
          .toString()
          .padStart(2,"0")}-${date.getFullYear()}`
      }

      const queryParams = {
        PageNumber: page,
        PageSize: pageSize,
        SearchTerm: searchTerm || undefined,
        StartDate: formatDate(filters.startDate),
        EndDate: formatDate(filters.endDate),
        Status: filters.status || undefined,
        ValidPageSize: filters.validPageSize,
      }

      const [groupData,postsResponse,reactionTypesData] = await Promise.all([
        getGroupActiveById(groupId),
        getGroupPosts(groupId,queryParams),
        getAllReactionTypes(),
      ])

      setGroup(groupData)

      if (postsResponse && Array.isArray(postsResponse)) {
        const newPosts = page === 1 ? postsResponse : [...posts,...postsResponse]
        setPosts(newPosts)
        setTotalCount(postsResponse.length)
        setHasMore(postsResponse.length === pageSize)
      } else if (postsResponse && postsResponse.posts) {
        const newPosts = page === 1 ? postsResponse.posts : [...posts,...postsResponse.posts]
        setPosts(newPosts)
        setTotalCount(postsResponse.totalCount || postsResponse.posts.length)
        setTotalPages(postsResponse.totalPages || 1)
        setHasMore(page < postsResponse.totalPages)
      } else {
        setPosts([])
        setTotalCount(0)
        setTotalPages(1)
        setHasMore(false)
      }

      setReactionTypes(reactionTypesData || [])
    } catch (err) {
      setError(err.message || "Error loading group details")
      console.error("Fetch error:",err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load initial data
  useFocusEffect(
    React.useCallback(() => {
      fetchGroupAndPosts(pageNumber)
    },[groupId,pageNumber,searchTerm,filters]),
  )

  // Get current user
  useEffect(() => {
    ; (async () => {
      try {
        const userStr = await AsyncStorage.getItem("user")
        if (userStr) {
          const user = JSON.parse(userStr)
          setCurrentUserId(user.userId)
        }
      } catch { }
    })()
  },[])

  // Handler functions
  const handleJoin = async () => {
    if (!group) return
    setJoining(true)
    try {
      if (group.isJoin) {
        await leaveGroup(group.groupId)
        Alert.alert("Success","You have left the group successfully!")
      } else {
        await joinGroup(group.groupId,group.isPrivate)
        Alert.alert(
          "Success",
          group.isPrivate ? "Join request sent! Please wait for approval." : "You have joined the group successfully!",
        )
      }
      await fetchGroupAndPosts(pageNumber)
    } catch (err) {
      Alert.alert("Error",err.message || "Unable to perform this action")
    } finally {
      setJoining(false)
    }
  }

  const handleSearch = (text) => {
    setSearchTerm(text)
    setPageNumber(1)
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages && !loading) {
      setPageNumber(page)
    }
  }

  const applyTempFilters = () => {
    setFilters(tempFilters)
    setPageNumber(1)
    setShowFilterModal(false)
    fetchGroupAndPosts(1)
  }

  const resetTempFilters = () => {
    const resetFilters = {
      startDate: null,
      endDate: null,
      status: "active",
      validPageSize: 10,
    }
    setTempFilters(resetFilters)
    setFilters(resetFilters)
    setPageNumber(1)
  }

  const formatDisplayDate = (date) => {
    if (!date) return "Select Date"
    return date.toLocaleDateString("en-US",{
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleShowComments = async (postId) => {
    if (showCommentsForPost === postId) {
      setShowCommentsForPost(null)
      return
    }
    setShowCommentsForPost(postId)
    if (!commentsByPost[postId]) {
      setLoadingComments((prev) => ({ ...prev,[postId]: true }))
      try {
        const comments = await getCommentsByPostId(postId)
        setCommentsByPost((prev) => ({ ...prev,[postId]: comments }))
      } catch (e) {
        setCommentsByPost((prev) => ({ ...prev,[postId]: [] }))
      } finally {
        setLoadingComments((prev) => ({ ...prev,[postId]: false }))
      }
    }
  }

  const handleSendComment = async (postId) => {
    const text = commentInputs[postId]?.trim()
    if (!text) return
    setCommentLoading((prev) => ({ ...prev,[postId]: true }))
    setCommentError((prev) => ({ ...prev,[postId]: "" }))
    const fakeComment = {
      commentId: `temp-${Date.now()}`,
      userId: currentUserId,
      userFullName: "You",
      commentText: text,
      createdAt: new Date().toISOString(),
      userAvatar: null,
    }
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [fakeComment,...(prev[postId] || [])],
    }))
    setCommentInputs((prev) => ({ ...prev,[postId]: "" }))
    try {
      await addCommentByUser(postId,text)
      const comments = await getCommentsByPostId(postId)
      setCommentsByPost((prev) => ({ ...prev,[postId]: comments }))
    } catch (e) {
      setCommentError((prev) => ({ ...prev,[postId]: e.message || "Failed to send comment" }))
    } finally {
      setCommentLoading((prev) => ({ ...prev,[postId]: false }))
    }
  }

  const handleEditComment = async () => {
    if (!editModal.comment || !editModal.postId) return
    if (!editInput.trim()) {
      setEditError("Content cannot be empty")
      return
    }
    setEditLoading(true)
    setEditError("")
    try {
      await editCommentByUser(editModal.comment.commentId,editModal.postId,editInput.trim())
      const comments = await getCommentsByPostId(editModal.postId)
      setCommentsByPost((prev) => ({ ...prev,[editModal.postId]: comments }))
      setEditModal({ visible: false,comment: null,postId: null })
      setEditInput("")
    } catch (e) {
      setEditError(e.message || "Failed to edit comment")
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!actionMenu.comment || !actionMenu.postId) return
    setDeleteLoading(true)
    try {
      await deleteUserComment(actionMenu.comment.commentId)
      const comments = await getCommentsByPostId(actionMenu.postId)
      setCommentsByPost((prev) => ({ ...prev,[actionMenu.postId]: comments }))
      setActionMenu({ visible: false,comment: null,postId: null })
    } catch (e) {
      Alert.alert("Error",e.message || "Failed to delete comment")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeletePost = async () => {
    if (!postActionMenu.post) return
    setDeletePostLoading(true)
    try {
      await deletePost(postActionMenu.post.postId)
      await fetchGroupAndPosts(pageNumber)
      setPostActionMenu({ visible: false,post: null })
    } catch (e) {
      Alert.alert("Error",e.message || "Failed to delete post")
    } finally {
      setDeletePostLoading(false)
    }
  }

  const handleToggleReaction = async (post) => {
    setReactionLoading((prev) => ({ ...prev,[post.postId]: true }))
    try {
      const userReaction = post.reactions?.find((r) => r.userId === currentUserId)
      const updatedPosts = [...posts]
      const postIdx = updatedPosts.findIndex((p) => p.postId === post.postId)
      if (userReaction) {
        updatedPosts[postIdx] = {
          ...post,
          reactions: post.reactions.filter((r) => r.userId !== currentUserId),
        }
        setPosts(updatedPosts)
        await unreactToPost(post.postId)
      } else {
        const defaultReactionType = reactionTypes[0]
        if (defaultReactionType) {
          updatedPosts[postIdx] = {
            ...post,
            reactions: [
              ...(post.reactions || []),
              {
                userId: currentUserId,
                reactionTypeId: defaultReactionType.reactionTypeId,
                reactionTypeName: defaultReactionType.reactionName,
                reactionTypeIconUrl: defaultReactionType.iconUrl,
                reactionTypeEmojiUnicode: defaultReactionType.emojiUnicode,
              },
            ],
          }
          setPosts(updatedPosts)
          await reactToPost(post.postId,defaultReactionType.reactionTypeId)
        }
      }
    } catch (e) {
      Alert.alert("Error",e.message || "Unable to react to post")
      fetchGroupAndPosts(pageNumber)
    } finally {
      setReactionLoading((prev) => ({ ...prev,[post.postId]: false }))
    }
  }

  const openReportModal = async (post) => {
    setReportModal({ visible: true,post })
    setSelectedReason(null)
    setReportDetails("")
    setReportStatus("")
    setReportLoading(true)
    try {
      const res = await getAllActiveReportReasons()
      setReportReasons(res.reportReasons || res || [])
      if (post.reportStatus === "resolved") setReportStatus("resolved")
      else if (post.reportStatus === "sent") setReportStatus("sent")
      else if (post.reportStatus === "processing") setReportStatus("processing")
      else setReportStatus("")
    } catch (e) {
      setReportReasons([])
    }
    setReportLoading(false)
  }

  const handleSendReport = async () => {
    if (!selectedReason) return
    setReportLoading(true)
    try {
      const report = await createReportByUser({
        postId: reportModal.post.postId,
        userId: currentUserId,
        reasonId: selectedReason.reasonId,
        reasonText: selectedReason.reasonName,
        details: reportDetails,
        note: reportDetails || "",
        status: "pending",
      })
      setReportStatus(report.status === "resolved" ? "resolved" : "sent")
      Alert.alert("Success","Your report has been submitted.")
    } catch (e) {
      Alert.alert("Error","Failed to submit report.")
    }
    setReportLoading(false)
  }

  const onRefresh = () => {
    setPageNumber(1)
    fetchGroupAndPosts(1,true)
  }

  const renderPaginationDots = () => {
    const dots = []
    const maxDots = 5
    let startPage = Math.max(1,pageNumber - Math.floor(maxDots / 2))
    const endPage = Math.min(totalPages,startPage + maxDots - 1)

    if (endPage - startPage + 1 < maxDots) {
      startPage = Math.max(1,endPage - maxDots + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      dots.push(
        <TouchableOpacity
          key={i}
          style={[styles.paginationDot,i === pageNumber && styles.activePaginationDot]}
          onPress={() => goToPage(i)}
          disabled={loading}
        >
          <Text style={[styles.paginationDotText,i === pageNumber && styles.activePaginationDotText]}>{i}</Text>
        </TouchableOpacity>,
      )
    }
    return dots
  }

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setShowFilterModal(false)
        setTempFilters(filters)
      }}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.filterModalContent,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.dragHandle} />

          {/* Modal Header */}
          <View style={styles.filterHeader}>
            <View style={styles.filterHeaderLeft}>
              <View style={styles.filterIconContainer}>
                <Ionicons name="options" size={24} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.filterTitle}>Filter Posts</Text>
                <Text style={styles.filterSubtitle}>Customize your feed</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowFilterModal(false)
                setTempFilters(filters)
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterScrollView} showsVerticalScrollIndicator={false}>
            {/* Date Range Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                <Feather name="calendar" size={16} color="#4F46E5" /> Date Range
              </Text>
              <View style={styles.rangeInputContainer}>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowCustomStartDatePicker(true)}>
                  <Feather name="calendar" size={16} color="#64748B" />
                  <Text style={styles.dateInputText}>{formatDisplayDate(tempFilters.startDate)}</Text>
                </TouchableOpacity>
                <View style={styles.rangeSeparator}>
                  <Text style={styles.rangeSeparatorText}>to</Text>
                </View>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowCustomEndDatePicker(true)}>
                  <Feather name="calendar" size={16} color="#64748B" />
                  <Text style={styles.dateInputText}>{formatDisplayDate(tempFilters.endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                <Feather name="activity" size={16} color="#4F46E5" /> Post Status
              </Text>
              <View style={styles.statusGrid}>
                {[
                  { key: "active",label: "Active",icon: "checkmark-circle",color: "#10B981" },
                  { key: "pending",label: "Pending",icon: "time",color: "#F59E0B" },
                  { key: "archived",label: "Archived",icon: "archive",color: "#6B7280" },
                  { key: "all",label: "All Posts",icon: "globe",color: "#4F46E5" },
                ].map((status) => (
                  <TouchableOpacity
                    key={status.key}
                    style={[styles.statusCard,tempFilters.status === status.key && styles.selectedStatusCard]}
                    onPress={() => setTempFilters({ ...tempFilters,status: status.key })}
                  >
                    <Ionicons
                      name={status.icon}
                      size={20}
                      color={tempFilters.status === status.key ? "#FFFFFF" : status.color}
                    />
                    <Text
                      style={[
                        styles.statusCardText,
                        tempFilters.status === status.key && styles.selectedStatusCardText,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Items per Page Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                <Feather name="grid" size={16} color="#4F46E5" /> Posts per Page
              </Text>
              <View style={styles.pageSizeGrid}>
                {[5,10,20,50].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.pageSizeCard,tempFilters.validPageSize === size && styles.selectedPageSizeCard]}
                    onPress={() => setTempFilters({ ...tempFilters,validPageSize: size })}
                  >
                    <Text
                      style={[
                        styles.pageSizeCardNumber,
                        tempFilters.validPageSize === size && styles.selectedPageSizeCardNumber,
                      ]}
                    >
                      {size}
                    </Text>
                    <Text
                      style={[
                        styles.pageSizeCardLabel,
                        tempFilters.validPageSize === size && styles.selectedPageSizeCardLabel,
                      ]}
                    >
                      posts
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Filter Actions */}
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearFiltersButton} onPress={resetTempFilters}>
              <Feather name="refresh-cw" size={16} color="#4F46E5" />
              <Text style={styles.clearFiltersText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyFiltersButton} onPress={applyTempFilters}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Date Pickers */}
      {showCustomStartDatePicker && (
        <Modal
          visible={showCustomStartDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCustomStartDatePicker(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Start Date</Text>
                <TouchableOpacity onPress={() => setShowCustomStartDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempFilters.startDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event,selectedDate) => {
                  if (selectedDate) {
                    setTempFilters({ ...tempFilters,startDate: selectedDate })
                  }
                }}
                style={styles.datePickerSpinner}
              />
              <TouchableOpacity style={styles.datePickerConfirm} onPress={() => setShowCustomStartDatePicker(false)}>
                <Text style={styles.datePickerConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showCustomEndDatePicker && (
        <Modal
          visible={showCustomEndDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCustomEndDatePicker(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select End Date</Text>
                <TouchableOpacity onPress={() => setShowCustomEndDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempFilters.endDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event,selectedDate) => {
                  if (selectedDate) {
                    setTempFilters({ ...tempFilters,endDate: selectedDate })
                  }
                }}
                style={styles.datePickerSpinner}
              />
              <TouchableOpacity style={styles.datePickerConfirm} onPress={() => setShowCustomEndDatePicker(false)}>
                <Text style={styles.datePickerConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  )

  if (loading && pageNumber === 1) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DynamicStatusBar backgroundColor="#4F46E5" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading community...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DynamicStatusBar backgroundColor="#4F46E5" />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={64} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchGroupAndPosts(pageNumber)}>
            <Feather name="refresh-cw" size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (!group) return null

  return (
    <SafeAreaView style={styles.safeArea}>
      <DynamicStatusBar backgroundColor={theme.primaryColor} />

      <FlatList
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View
            style={[
              styles.headerContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim },{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.coverSection}>
              <Image
                source={{ uri: group.thumbnail || "https://via.placeholder.com/400x200" }}
                style={styles.coverImage}
                blurRadius={2}
              />
              <LinearGradient
                colors={["rgba(79, 70, 229, 0.3)","rgba(79, 70, 229, 0.7)"]}
                style={styles.coverOverlay}
              />
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.headerRightActions}>
                  <TouchableOpacity style={styles.headerActionButton}>
                    <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerActionButton}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Group Avatar */}
              <View style={styles.groupAvatarContainer}>
                <View style={styles.groupAvatarWrapper}>
                  <Image
                    source={{ uri: group.thumbnail || "https://via.placeholder.com/120" }}
                    style={styles.groupAvatar}
                  />
                  {group.isPrivate && (
                    <View style={styles.privateBadge}>
                      <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.groupInfoSection}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{group.groupName}</Text>
                {group.isPrivate && (
                  <View style={styles.privateTag}>
                    <Ionicons name="lock-closed" size={12} color="#8B5CF6" />
                    <Text style={styles.privateTagText}>Private Group</Text>
                  </View>
                )}
              </View>

              <Text style={styles.groupDescription} numberOfLines={3}>
                {group.description ||
                  "Welcome to our amazing community! Join us to share experiences and connect with like-minded people."}
              </Text>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color="#4F46E5" />
                  <Text style={styles.statText}>{group.memberCount?.toLocaleString() || "0"} members</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.activityDot} />
                  <Text style={styles.statText}>Active community</Text>
                </View>
              </View>

              {/* Admin Info */}
              <View style={styles.adminSection}>
                <Text style={styles.adminLabel}>
                  <Ionicons name="shield-checkmark" size={14} color="#4F46E5" /> Admin
                </Text>
                <View style={styles.adminInfo}>
                  <View style={styles.adminAvatar}>
                    <Text style={styles.adminAvatarText}>
                      {group.creator?.fullName?.charAt(0)?.toUpperCase() || "A"}
                    </Text>
                  </View>
                  <View style={styles.adminDetails}>
                    <Text style={styles.adminName}>{group.creator?.fullName || "Administrator"}</Text>
                    <Text style={styles.adminEmail}>{group.creator?.email || "admin@community.com"}</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryActionButton,
                    group.isJoin ? styles.leaveButton : group.isRequested ? styles.pendingButton : styles.joinButton,
                  ]}
                  onPress={handleJoin}
                  disabled={group.isRequested || joining}
                  activeOpacity={0.8}
                >
                  {joining ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name={group.isJoin ? "exit-outline" : group.isRequested ? "time-outline" : "add-outline"}
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.primaryActionText}>
                        {group.isJoin ? "Leave Group" : group.isRequested ? "Request Pending" : "Join Group"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {!group.isJoin && !group.isRequested && (
                  <View style={styles.secondaryActionsRow}>
                    <TouchableOpacity style={styles.secondaryActionButton}>
                      <Ionicons name="notifications-outline" size={16} color="#4F46E5" />
                      <Text style={styles.secondaryActionText}>Follow</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryActionButton}>
                      <Ionicons name="bookmark-outline" size={16} color="#4F46E5" />
                      <Text style={styles.secondaryActionText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Posts Section Header */}
            {group.isJoin && (
              <View style={styles.postsHeaderSection}>
                <View style={styles.postsHeader}>
                  <Text style={styles.postsTitle}>
                    <Ionicons name="newspaper-outline" size={20} color="#4F46E5" /> Community Posts
                  </Text>
                  <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
                    <Ionicons name="options-outline" size={18} color="#4F46E5" />
                    {(searchTerm || filters.status !== "active" || filters.startDate || filters.endDate) && (
                      <View style={styles.filterIndicator} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={18} color="#64748B" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search posts..."
                      value={searchTerm}
                      onChangeText={handleSearch}
                      placeholderTextColor="#94A3B8"
                    />
                    {searchTerm ? (
                      <TouchableOpacity onPress={() => handleSearch("")}>
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* Create Post Button */}
                <TouchableOpacity
                  style={styles.createPostContainer}
                  onPress={() => navigation.navigate("CreatePostScreen",{ groupId: group.groupId })}
                >
                  <View style={styles.createPostAvatar}>
                    <Ionicons name="person" size={20} color="#4F46E5" />
                  </View>
                  <Text style={styles.createPostPlaceholder}>What's on your mind?</Text>
                  <View style={styles.createPostActions}>
                    <Ionicons name="image-outline" size={20} color="#64748B" />
                    <Ionicons name="videocam-outline" size={20} color="#64748B" />
                  </View>
                </TouchableOpacity>

                {/* Results Info */}
                {totalCount > 0 && (
                  <View style={styles.resultsInfo}>
                    <Text style={styles.resultsText}>
                      Showing {(pageNumber - 1) * pageSize + 1}-{Math.min(pageNumber * pageSize,totalCount)} of{" "}
                      {totalCount} posts
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        }
        data={group.isJoin ? posts.filter((post) => post.status !== "deleted") : []}
        keyExtractor={(post) => post.postId?.toString() || Math.random().toString()}
        renderItem={({ item: post,index }) => (
          <Animated.View
            style={[
              styles.postCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim },{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Modern Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.postAuthorSection}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorAvatarText}>{(post.user?.fullName || "U").charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{post.user?.fullName || "Anonymous User"}</Text>
                  <View style={styles.postMetaInfo}>
                    <Text style={styles.postTime}>
                      {new Date(post.createdAt).toLocaleDateString("en-US",{
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <View style={styles.metaDivider} />
                    <Ionicons name="globe-outline" size={12} color="#64748B" />
                    <Text style={styles.postVisibility}>Public</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.postMenuButton}
                onPress={() =>
                  post.userId === currentUserId ? setPostActionMenu({ visible: true,post }) : openReportModal(post)
                }
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Post Content */}
            <View style={styles.postContent}>
              <RenderHtml
                contentWidth={width - 32}
                source={{ html: post.content || "<p>No content available</p>" }}
                tagsStyles={{
                  p: { fontSize: 16,lineHeight: 24,color: "#374151",margin: 0 },
                  strong: { fontWeight: "600" },
                  em: { fontStyle: "italic" },
                }}
              />
            </View>

            {/* Post Image */}
            {post.thumbnail && (
              <TouchableOpacity style={styles.postImageContainer}>
                <Image source={{ uri: post.thumbnail }} style={styles.postImage} />
              </TouchableOpacity>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {post.tags.slice(0,3).map((tag) => (
                  <TouchableOpacity key={tag.tagId} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{tag.tagName}</Text>
                  </TouchableOpacity>
                ))}
                {post.tags.length > 3 && <Text style={styles.moreTagsText}>+{post.tags.length - 3} more</Text>}
              </View>
            )}

            {/* Engagement Stats */}
            {(post.reactions?.length > 0 || post.totalComment > 0) && (
              <View style={styles.engagementStats}>
                {post.reactions?.length > 0 && (
                  <TouchableOpacity style={styles.reactionsSummary}>
                    <View style={styles.reactionsIcons}>
                      <Text style={styles.reactionEmoji}>❤️</Text>
                      <Text style={styles.reactionEmoji}>👍</Text>
                      <Text style={styles.reactionEmoji}>😊</Text>
                    </View>
                    <Text style={styles.reactionsCount}>{post.reactions.length}</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.engagementRight}>
                  {post.totalComment > 0 && (
                    <TouchableOpacity onPress={() => handleShowComments(post.postId)}>
                      <Text style={styles.commentsCount}>{post.totalComment} comments</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.postActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  post.reactions?.some((r) => r.userId === currentUserId) && styles.actionButtonActive,
                ]}
                onPress={() => handleToggleReaction(post)}
                onLongPress={() => {
                  setSelectedPostId(post.postId)
                  setShowReactionPicker(true)
                }}
                delayLongPress={300}
              >
                {reactionLoading[post.postId] ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <>
                    <Ionicons
                      name={post.reactions?.some((r) => r.userId === currentUserId) ? "heart" : "heart-outline"}
                      size={18}
                      color={post.reactions?.some((r) => r.userId === currentUserId) ? "#EF4444" : "#64748B"}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        post.reactions?.some((r) => r.userId === currentUserId) && styles.actionButtonTextActive,
                      ]}
                    >
                      Like
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton,showCommentsForPost === post.postId && styles.actionButtonActive]}
                onPress={() => handleShowComments(post.postId)}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color={showCommentsForPost === post.postId ? "#4F46E5" : "#64748B"}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    showCommentsForPost === post.postId && styles.actionButtonTextActive,
                  ]}
                >
                  Comment
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="arrow-redo-outline" size={18} color="#64748B" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Comments Section */}
            {showCommentsForPost === post.postId && (
              <View style={styles.commentsSection}>
                {loadingComments[post.postId] ? (
                  <View style={styles.commentsLoading}>
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text style={styles.commentsLoadingText}>Loading comments...</Text>
                  </View>
                ) : commentsByPost[post.postId] && commentsByPost[post.postId].length > 0 ? (
                  <View style={styles.commentsList}>
                    {commentsByPost[post.postId].slice(0,3).map((comment) => (
                      <View key={comment.commentId} style={styles.commentItem}>
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarText}>
                            {(comment.userFullName || "U").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.commentContent}>
                          <View style={styles.commentBubble}>
                            <Text style={styles.commentAuthor}>{comment.userFullName || "Anonymous"}</Text>
                            <Text style={styles.commentText}>{comment.commentText}</Text>
                          </View>
                          <View style={styles.commentActions}>
                            <Text style={styles.commentTime}>
                              {new Date(comment.createdAt).toLocaleDateString("en-US",{
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                            <TouchableOpacity>
                              <Text style={styles.commentActionText}>Like</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                              <Text style={styles.commentActionText}>Reply</Text>
                            </TouchableOpacity>
                            {currentUserId && comment.userId === currentUserId && (
                              <TouchableOpacity
                                onPress={() => setActionMenu({ visible: true,comment,postId: post.postId })}
                              >
                                <Ionicons name="ellipsis-horizontal" size={14} color="#64748B" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}

                    {commentsByPost[post.postId].length > 3 && (
                      <TouchableOpacity style={styles.viewMoreComments}>
                        <Text style={styles.viewMoreCommentsText}>
                          View {commentsByPost[post.postId].length - 3} more comments
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.noComments}>
                    <Ionicons name="chatbubble-outline" size={24} color="#CBD5E1" />
                    <Text style={styles.noCommentsText}>No comments yet</Text>
                    <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
                  </View>
                )}

                {/* Comment Input */}
                <View style={styles.commentInputSection}>
                  <View style={styles.commentInputAvatar}>
                    <Ionicons name="person" size={16} color="#4F46E5" />
                  </View>
                  <View style={styles.commentInputContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Write a comment..."
                      value={commentInputs[post.postId] || ""}
                      onChangeText={(text) => setCommentInputs((prev) => ({ ...prev,[post.postId]: text }))}
                      multiline
                      maxLength={500}
                      placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity
                      style={[
                        styles.commentSendButton,
                        (!commentInputs[post.postId]?.trim() || commentLoading[post.postId]) &&
                        styles.commentSendButtonDisabled,
                      ]}
                      onPress={() => handleSendComment(post.postId)}
                      disabled={!commentInputs[post.postId]?.trim() || commentLoading[post.postId]}
                    >
                      {commentLoading[post.postId] ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="send" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {commentError[post.postId] && <Text style={styles.commentErrorText}>{commentError[post.postId]}</Text>}
              </View>
            )}
          </Animated.View>
        )}
        ListEmptyComponent={
          <Animated.View
            style={[
              styles.emptyStateContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {group.isJoin ? (
              postLoading ? (
                <View style={styles.postsLoading}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.postsLoadingText}>Loading posts...</Text>
                </View>
              ) : (
                <View style={styles.emptyPosts}>
                  <View style={styles.emptyPostsIcon}>
                    <Ionicons name="newspaper-outline" size={48} color="#CBD5E1" />
                  </View>
                  <Text style={styles.emptyPostsTitle}>No posts yet</Text>
                  <Text style={styles.emptyPostsSubtitle}>
                    {searchTerm || filters.status !== "active" || filters.startDate || filters.endDate
                      ? "No posts match your current filters. Try adjusting your search criteria."
                      : "Be the first to share something with the community!"}
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyPostsAction}
                    onPress={() => {
                      if (searchTerm || filters.status !== "active" || filters.startDate || filters.endDate) {
                        resetTempFilters()
                      } else {
                        navigation.navigate("CreatePostScreen",{ groupId: group.groupId })
                      }
                    }}
                  >
                    <Ionicons
                      name={
                        searchTerm || filters.status !== "active" || filters.startDate || filters.endDate
                          ? "refresh"
                          : "add"
                      }
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.emptyPostsActionText}>
                      {searchTerm || filters.status !== "active" || filters.startDate || filters.endDate
                        ? "Clear Filters"
                        : "Create Post"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View style={styles.joinRequired}>
                <View style={styles.joinRequiredIcon}>
                  <Ionicons name="lock-closed" size={48} color="#CBD5E1" />
                </View>
                <Text style={styles.joinRequiredTitle}>Join to see posts</Text>
                <Text style={styles.joinRequiredSubtitle}>
                  You need to join this group to view and interact with posts
                </Text>
                <TouchableOpacity style={styles.joinRequiredAction} onPress={handleJoin}>
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.joinRequiredActionText}>Join Group</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        }
        ListFooterComponent={
          <>
            {/* Pagination */}
            {totalCount > 0 && totalPages > 1 && (
              <Animated.View
                style={[
                  styles.paginationContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <LinearGradient colors={["#FFFFFF","#F8FAFC"]} style={styles.paginationGradient}>
                  <View style={styles.paginationContent}>
                    {/* Previous Button */}
                    <TouchableOpacity
                      style={[styles.paginationNavButton,pageNumber <= 1 && styles.disabledNavButton]}
                      onPress={() => goToPage(pageNumber - 1)}
                      disabled={pageNumber <= 1 || loading}
                    >
                      <Ionicons name="chevron-back" size={20} color={pageNumber <= 1 ? "#CBD5E1" : "#4F46E5"} />
                    </TouchableOpacity>

                    {/* Page Dots */}
                    <View style={styles.paginationDots}>{renderPaginationDots()}</View>

                    {/* Next Button */}
                    <TouchableOpacity
                      style={[styles.paginationNavButton,pageNumber >= totalPages && styles.disabledNavButton]}
                      onPress={() => goToPage(pageNumber + 1)}
                      disabled={pageNumber >= totalPages || loading}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={pageNumber >= totalPages ? "#CBD5E1" : "#4F46E5"}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Page Info */}
                  <View style={styles.pageInfoContainer}>
                    <Text style={styles.pageInfo}>
                      Page {pageNumber} of {totalPages}
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Loading more indicator */}
            {loading && pageNumber > 1 && (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.footerLoaderText}>Loading more posts...</Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* Filter Modal */}
      {renderFilterModal()}

      {/* Reaction Picker Modal */}
      {showReactionPicker && (
        <Modal transparent animationType="fade" visible={showReactionPicker}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowReactionPicker(false)}>
            <View style={styles.reactionPickerModal}>
              <Text style={styles.reactionPickerTitle}>Choose Reaction</Text>
              <View style={styles.reactionTypesContainer}>
                {reactionTypes.map((rt) => (
                  <TouchableOpacity
                    key={rt.reactionTypeId}
                    style={styles.reactionTypeButton}
                    onPress={async () => {
                      setShowReactionPicker(false)
                      try {
                        const updatedPosts = [...posts]
                        const idx = updatedPosts.findIndex((p) => p.postId === selectedPostId)
                        if (idx !== -1) {
                          updatedPosts[idx] = {
                            ...updatedPosts[idx],
                            reactions: [
                              ...(updatedPosts[idx].reactions?.filter((r) => r.userId !== currentUserId) || []),
                              {
                                userId: currentUserId,
                                reactionTypeId: rt.reactionTypeId,
                                reactionTypeName: rt.reactionName,
                                reactionTypeIconUrl: rt.iconUrl,
                                reactionTypeEmojiUnicode: rt.emojiUnicode,
                              },
                            ],
                          }
                          setPosts(updatedPosts)
                        }
                        await reactToPost(selectedPostId,rt.reactionTypeId)
                      } catch (e) {
                        Alert.alert("Error",e.message || "Unable to react to post")
                        fetchGroupAndPosts(pageNumber)
                      }
                    }}
                  >
                    {rt.iconUrl ? (
                      <Image source={{ uri: rt.iconUrl }} style={styles.reactionTypeIcon} />
                    ) : (
                      <Text style={styles.reactionTypeEmoji}>{rt.emojiUnicode || "🙂"}</Text>
                    )}
                    <Text style={styles.reactionTypeName}>{rt.reactionName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Edit Comment Modal */}
      <Modal visible={editModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.modalTitle}>✏️ Edit Comment</Text>
            <TextInput
              value={editInput}
              onChangeText={setEditInput}
              style={styles.editInput}
              multiline
              placeholder="Enter comment content..."
              maxLength={500}
            />
            {editError && <Text style={styles.errorText}>{editError}</Text>}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModal({ visible: false,comment: null,postId: null })}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton,editLoading && styles.saveButtonDisabled]}
                onPress={handleEditComment}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comment Action Menu */}
      <Modal visible={actionMenu.visible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActionMenu({ visible: false,comment: null,postId: null })}
        >
          <View style={styles.actionMenu}>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setActionMenu({ visible: false,comment: null,postId: null })
                setEditModal({ visible: true,comment: actionMenu.comment,postId: actionMenu.postId })
                setEditInput(actionMenu.comment.commentText)
              }}
            >
              <Text style={styles.actionMenuIcon}>✏️</Text>
              <Text style={styles.actionMenuText}>Edit Comment</Text>
            </TouchableOpacity>
            <View style={styles.actionMenuDivider} />
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                Alert.alert("Confirm Delete","Are you sure you want to delete this comment?",[
                  { text: "Cancel",style: "cancel" },
                  { text: "Delete",style: "destructive",onPress: handleDeleteComment },
                ])
              }}
            >
              <Text style={styles.actionMenuIcon}>🗑️</Text>
              <Text style={[styles.actionMenuText,styles.deleteText]}>Delete Comment</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Post Action Menu */}
      <Modal visible={postActionMenu.visible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPostActionMenu({ visible: false,post: null })}>
          <View style={styles.actionMenu}>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setPostActionMenu({ visible: false,post: null })
                navigation.navigate("EditPostScreen",{ post: postActionMenu.post })
              }}
            >
              <Text style={styles.actionMenuIcon}>✏️</Text>
              <Text style={styles.actionMenuText}>Edit Post</Text>
            </TouchableOpacity>
            <View style={styles.actionMenuDivider} />
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                Alert.alert("Confirm Delete","Are you sure you want to delete this post?",[
                  { text: "Cancel",style: "cancel" },
                  { text: "Delete",style: "destructive",onPress: handleDeletePost },
                ])
              }}
            >
              <Text style={styles.actionMenuIcon}>🗑️</Text>
              <Text style={[styles.actionMenuText,styles.deleteText]}>Delete Post</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.reportModal}>
            <Text style={styles.modalTitle}>🚨 Report Post</Text>
            {reportLoading ? (
              <ActivityIndicator size="large" color="#4F46E5" />
            ) : reportStatus === "resolved" ? (
              <View style={styles.reportStatusContainer}>
                <Text style={styles.reportStatusIcon}>✅</Text>
                <Text style={styles.reportStatusText}>Report has been resolved</Text>
              </View>
            ) : reportStatus === "sent" ? (
              <View style={styles.reportStatusContainer}>
                <Text style={styles.reportStatusIcon}>📤</Text>
                <Text style={styles.reportStatusText}>You have already reported this post</Text>
              </View>
            ) : (
              <>
                <Text style={styles.reportLabel}>Select reason for report:</Text>
                <FlatList
                  data={reportReasons}
                  keyExtractor={(item) => item.reasonId.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.reportReasonItem,
                        selectedReason?.reasonId === item.reasonId && styles.reportReasonSelected,
                      ]}
                      onPress={() => setSelectedReason(item)}
                    >
                      <Text style={styles.reportReasonTitle}>{item.reasonName}</Text>
                      {item.description ? (
                        <RenderHtml
                          contentWidth={width - 64}
                          source={{ html: item.description }}
                          tagsStyles={{ p: { margin: 0 },strong: { fontWeight: "bold" } }}
                          defaultTextProps={{ selectable: true }}
                        />
                      ) : null}
                    </TouchableOpacity>
                  )}
                  style={styles.reportReasonsList}
                />
                <TextInput
                  placeholder="Additional details (optional)"
                  value={reportDetails}
                  onChangeText={setReportDetails}
                  style={styles.reportDetailsInput}
                  multiline
                  maxLength={500}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setReportModal({ visible: false,post: null })}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reportButton,(!selectedReason || reportLoading) && styles.reportButtonDisabled]}
                    onPress={handleSendReport}
                    disabled={!selectedReason || reportLoading}
                  >
                    {reportLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.reportButtonText}>Send Report</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.primaryColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    color: "#4F46E5",
    marginTop: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 32,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 24,
  },
  headerContainer: {
    backgroundColor: "#FFFFFF",
  },

  // Cover Section
  coverSection: {
    position: "relative",
    height: 240,
    width: "100%",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerActions: {
    position: "absolute",
    top: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  groupAvatarContainer: {
    position: "absolute",
    bottom: -60,
    left: 20,
    zIndex: 10,
  },
  groupAvatarWrapper: {
    position: "relative",
  },
  groupAvatar: {
    width: 120,
    height: 120,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  privateBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  // Group Info Section
  groupInfoSection: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  groupHeader: {
    marginBottom: 16,
  },
  groupName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
    lineHeight: 34,
    marginBottom: 8,
  },
  privateTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  privateTagText: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  groupDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#64748B",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  adminSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  adminLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
    marginBottom: 12,
  },
  adminInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  adminAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 14,
    color: "#4F46E5",
  },
  actionButtonsContainer: {
    gap: 12,
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButton: {
    backgroundColor: "#4F46E5",
  },
  leaveButton: {
    backgroundColor: "#6B7280",
  },
  pendingButton: {
    backgroundColor: "#F59E0B",
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4F46E5",
  },

  // Posts Header Section
  postsHeaderSection: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  postsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  postsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  filterButton: {
    position: "relative",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
  },
  createPostContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  createPostPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#94A3B8",
  },
  createPostActions: {
    flexDirection: "row",
    gap: 12,
  },
  resultsInfo: {
    alignItems: "center",
  },
  resultsText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },

  // Post Card
  postCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  postAuthorSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  authorAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  postMetaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postTime: {
    fontSize: 12,
    color: "#64748B",
  },
  metaDivider: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#CBD5E1",
  },
  postVisibility: {
    fontSize: 12,
    color: "#64748B",
  },
  postMenuButton: {
    padding: 8,
    borderRadius: 8,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postImageContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "500",
  },
  moreTagsText: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic",
    alignSelf: "center",
  },
  engagementStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  reactionsSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reactionsIcons: {
    flexDirection: "row",
    marginLeft: -4,
  },
  reactionEmoji: {
    fontSize: 16,
    marginLeft: -4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: "center",
    lineHeight: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  reactionsCount: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  engagementRight: {
    flexDirection: "row",
    gap: 16,
  },
  commentsCount: {
    fontSize: 14,
    color: "#64748B",
  },
  postActions: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonActive: {
    backgroundColor: "#F0F9FF",
  },
  actionButtonText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  actionButtonTextActive: {
    color: "#4F46E5",
    fontWeight: "600",
  },

  // Comments Section
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  commentsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  commentsLoadingText: {
    fontSize: 14,
    color: "#4F46E5",
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 4,
  },
  commentTime: {
    fontSize: 12,
    color: "#64748B",
  },
  commentActionText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "500",
  },
  viewMoreComments: {
    paddingVertical: 8,
    alignItems: "center",
  },
  viewMoreCommentsText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
  },
  noComments: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  noCommentsText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
  commentInputSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    maxHeight: 80,
    paddingVertical: 4,
  },
  commentSendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  commentSendButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  commentErrorText: {
    fontSize: 12,
    color: "#EF4444",
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Empty States
  emptyStateContainer: {
    flex: 1,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  postsLoading: {
    alignItems: "center",
    paddingVertical: 32,
  },
  postsLoadingText: {
    fontSize: 16,
    color: "#4F46E5",
    marginTop: 12,
    fontWeight: "500",
  },
  emptyPosts: {
    alignItems: "center",
  },
  emptyPostsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyPostsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyPostsSubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyPostsAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyPostsActionText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  joinRequired: {
    alignItems: "center",
  },
  joinRequiredIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  joinRequiredTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  joinRequiredSubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  joinRequiredAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  joinRequiredActionText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Pagination
  paginationContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  paginationGradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
  },
  paginationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paginationNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledNavButton: {
    backgroundColor: "#F1F5F9",
  },
  paginationDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paginationDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  activePaginationDot: {
    backgroundColor: "#4F46E5",
  },
  paginationDotText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  activePaginationDotText: {
    color: "#FFFFFF",
  },
  pageInfoContainer: {
    alignItems: "center",
  },
  pageInfo: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "60%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  filterHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  filterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  filterSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  filterScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  dateInputText: {
    fontSize: 16,
    color: "#1E293B",
    flex: 1,
  },
  rangeSeparator: {
    alignItems: "center",
    justifyContent: "center",
  },
  rangeSeparatorText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  selectedStatusCard: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  statusCardText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  selectedStatusCardText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pageSizeGrid: {
    flexDirection: "row",
    gap: 12,
  },
  pageSizeCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedPageSizeCard: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  pageSizeCardNumber: {
    fontSize: 20,
    color: "#1E293B",
    fontWeight: "700",
  },
  selectedPageSizeCardNumber: {
    color: "#FFFFFF",
  },
  pageSizeCardLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  selectedPageSizeCardLabel: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  filterActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  clearFiltersText: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "600",
  },
  applyFiltersButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  applyFiltersText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  datePickerModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  datePickerSpinner: {
    height: 200,
  },
  datePickerConfirm: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  datePickerConfirmText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  reactionPickerModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 300,
  },
  reactionPickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  reactionTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  reactionTypeButton: {
    alignItems: "center",
    padding: 12,
    margin: 4,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  reactionTypeIcon: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  reactionTypeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  reactionTypeName: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  editModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 350,
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  actionMenu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    minWidth: 180,
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionMenuIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  actionMenuText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  deleteText: {
    color: "#EF4444",
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 4,
  },
  reportModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: "90%",
    maxHeight: "80%",
  },
  reportStatusContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  reportStatusIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  reportStatusText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
  },
  reportLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  reportReasonsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  reportReasonItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reportReasonSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  reportReasonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  reportDetailsInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  reportButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reportButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  reportButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
})

export default GroupDetailsScreen
