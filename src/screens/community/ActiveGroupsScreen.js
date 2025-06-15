import React from "react"

import { useState,useEffect,useRef,useContext } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
  Image,
  RefreshControl,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons,MaterialCommunityIcons,Feather } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { AuthContext } from "context/AuthContext"
import { getAllActiveGroups,joinGroup } from "services/apiCommunityService"
import DynamicStatusBar from "screens/statusBar/DynamicStatusBar"
import { useNavigation,useFocusEffect } from "@react-navigation/native"
import { theme } from "theme/color"

const { width } = Dimensions.get("window")

const ActiveGroupsScreenModern = () => {
  const navigation = useNavigation()
  const { user } = useContext(AuthContext)
  const [groups,setGroups] = useState([])
  const [loading,setLoading] = useState(true)
  const [refreshing,setRefreshing] = useState(false)
  const [showFilterModal,setShowFilterModal] = useState(false)
  const [pageNumber,setPageNumber] = useState(1)
  const [pageSize,setPageSize] = useState(10)
  const [totalPages,setTotalPages] = useState(1)
  const [totalCount,setTotalCount] = useState(0)
  const [hasMore,setHasMore] = useState(true)
  const [searchTerm,setSearchTerm] = useState("")
  const [joiningGroups,setJoiningGroups] = useState(new Set())
  const [filters,setFilters] = useState({
    startDate: null,
    endDate: null,
    status: "active",
    validPageSize: 10,
  })
  const [tempFilters,setTempFilters] = useState(filters)
  const [showStartDatePicker,setShowStartDatePicker] = useState(false)
  const [showEndDatePicker,setShowEndDatePicker] = useState(false)
  const [showCustomStartDatePicker,setShowCustomStartDatePicker] = useState(false)
  const [showCustomEndDatePicker,setShowCustomEndDatePicker] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current

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

  const fetchGroups = async (page = 1,refresh = false) => {
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

      const response = await getAllActiveGroups(queryParams)

      if (response && Array.isArray(response)) {
        const newGroups = page === 1 ? response : [...groups,...response]
        setGroups(newGroups)
        setTotalCount(response.length)
        setHasMore(response.length === pageSize)

        // Calculate total pages based on response
        if (response.length > 0 && response[0].totalPages) {
          setTotalPages(response[0].totalPages)
        } else {
          setTotalPages(Math.ceil(newGroups.length / pageSize))
        }
      } else {
        setGroups([])
        setTotalPages(1)
        setTotalCount(0)
        setHasMore(false)
      }
    } catch (error) {
      console.error("Fetch Groups Error:",error)
      Alert.alert("Error",error.message || "An error occurred while loading groups.")
      setGroups([])
      setTotalPages(1)
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      fetchGroups(pageNumber)
    },[pageNumber,pageSize,searchTerm,filters]),
  )

  const onRefresh = () => {
    setPageNumber(1)
    fetchGroups(1,true)
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
    fetchGroups(1)
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

  const handleJoin = async (groupId,isJoin,isPrivate,isRequested) => {
    if (isJoin) {
      Alert.alert("Already Joined","You are already a member of this group!")
      return
    }
    if (isRequested) {
      Alert.alert("Request Pending","Your join request is pending approval!")
      return
    }

    setJoiningGroups((prev) => new Set([...prev,groupId]))

    try {
      await joinGroup(groupId,isPrivate)
      Alert.alert(
        "Success",
        isPrivate ? "Join request sent! Please wait for approval." : "You have successfully joined the group!",
      )
      fetchGroups(pageNumber)
    } catch (err) {
      Alert.alert("Error",err.message || "Unable to join group")
    } finally {
      setJoiningGroups((prev) => {
        const newSet = new Set(prev)
        newSet.delete(groupId)
        return newSet
      })
    }
  }

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { color: "#10B981",bgColor: "#D1FAE5",icon: "checkmark-circle" }
      case "pending":
        return { color: "#F59E0B",bgColor: "#FEF3C7",icon: "time" }
      case "private":
        return { color: "#8B5CF6",bgColor: "#F3E8FF",icon: "lock-closed" }
      case "public":
        return { color: "#06B6D4",bgColor: "#CFFAFE",icon: "globe" }
      default:
        return { color: "#6B7280",bgColor: "#F1F5F9",icon: "help-circle" }
    }
  }

  const formatMemberCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count?.toString() || "0"
  }

  const getJoinButtonStyle = (item) => {
    if (item.isJoin) return styles.joinedButton
    if (item.isRequested) return styles.pendingButton
    return styles.joinButton
  }

  const getJoinButtonText = (item) => {
    if (item.isJoin) return "✓ Joined"
    if (item.isRequested) return "⏳ Pending"
    return "➕ Join"
  }

  const renderGroup = ({ item,index }) => {
    const statusInfo = getStatusInfo(item.isPrivate ? "private" : "public")

    return (
      <Animated.View
        style={[
          styles.groupCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim },{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => navigation.navigate("GroupDetails",{ groupId: item.groupId })}
        >
          <LinearGradient colors={["#FFFFFF","#FAFBFF"]} style={styles.cardGradient}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: item.thumbnail || "https://via.placeholder.com/64" }}
                    style={styles.groupThumbnail}
                  />
                  {item.isPrivate && (
                    <View style={styles.privateBadge}>
                      <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName} numberOfLines={2}>
                    {item.groupName || "Health Community"}
                  </Text>
                  <View style={styles.groupStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="people" size={14} color="#10B981" />
                      <Text style={styles.statText}>{formatMemberCount(item.memberCount)} members</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={[styles.statusBadge,{ backgroundColor: statusInfo.bgColor }]}>
                <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
                <Text style={[styles.statusText,{ color: statusInfo.color }]}>
                  {item.isPrivate ? "Private" : "Public"}
                </Text>
              </View>
            </View>

            {/* Group Description */}
            <Text style={styles.groupDescription} numberOfLines={3}>
              {item.description ||
                "Join our health and wellness community to share experiences and support each other."}
            </Text>

            {/* Activity Indicator */}
            <View style={styles.activityContainer}>
              <View style={styles.activityIndicator}>
                <View style={styles.activityDot} />
                <Text style={styles.activityText}>Active community</Text>
              </View>
              <View style={styles.healthBadge}>
                <Ionicons name="fitness" size={12} color="#10B981" />
                <Text style={styles.healthBadgeText}>Health & Wellness</Text>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.actionButton,getJoinButtonStyle(item)]}
              onPress={() => handleJoin(item.groupId,item.isJoin,item.isPrivate,item.isRequested)}
              disabled={joiningGroups.has(item.groupId)}
            >
              {joiningGroups.has(item.groupId) ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.actionButtonText}>{getJoinButtonText(item)}</Text>
                  <Feather name="arrow-right" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    )
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
                <Ionicons name="options" size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.filterTitle}>Filter Communities</Text>
                <Text style={styles.filterSubtitle}>Find your perfect health group</Text>
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
                  <Feather name="calendar" size={16} color="#4F46E5" />
                  <Text style={styles.dateInputText}>{formatDisplayDate(tempFilters.startDate)}</Text>
                </TouchableOpacity>
                <View style={styles.rangeSeparator}>
                  <Text style={styles.rangeSeparatorText}>to</Text>
                </View>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowCustomEndDatePicker(true)}>
                  <Feather name="calendar" size={16} color="#4F46E5" />
                  <Text style={styles.dateInputText}>{formatDisplayDate(tempFilters.endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                <Feather name="activity" size={16} color="#4F46E5" /> Group Status
              </Text>
              <View style={styles.statusGrid}>
                {[
                  { key: "active",label: "Active",icon: "checkmark-circle",color: "#10B981" },
                  { key: "pending",label: "Pending",icon: "time",color: "#F59E0B" },
                  { key: "private",label: "Private",icon: "lock-closed",color: "#8B5CF6" },
                  { key: "public",label: "Public",icon: "globe",color: "#06B6D4" },
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
                <Feather name="grid" size={16} color="#4F46E5" /> Items per Page
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
                      groups
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

  const renderEmpty = () => (
    <Animated.View
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons name="account-group" size={80} color="#CBD5E1" />
      </View>
      <Text style={styles.emptyTitle}>No Communities Found</Text>
      <Text style={styles.emptyText}>
        {searchTerm || filters.status !== "active" || filters.startDate || filters.endDate
          ? "No communities match your current filters. Try adjusting your search criteria."
          : "No active health communities available at the moment. Check back later or create your own!"}
      </Text>
      <TouchableOpacity
        style={styles.emptyActionButton}
        onPress={() => {
          if (searchTerm || filters.status !== "active" || filters.startDate || filters.endDate) {
            resetTempFilters()
          } else {
            // Navigate to create group or refresh
            onRefresh()
          }
        }}
      >
        <Feather
          name={
            searchTerm || filters.status !== "active" || filters.startDate || filters.endDate ? "refresh-cw" : "plus"
          }
          size={16}
          color="#FFFFFF"
        />
        <Text style={styles.emptyActionText}>
          {searchTerm || filters.status !== "active" || filters.startDate || filters.endDate
            ? "Clear Filters"
            : "Refresh"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <DynamicStatusBar backgroundColor={theme.primaryColor} />

      {/* Modern Header */}
      <LinearGradient colors={["#4F46E5","#6366F1","#818CF8"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Health Communities</Text>
            <Text style={styles.headerSubtitle}>
              {totalCount > 0 ? `${totalCount} active group${totalCount > 1 ? "s" : ""}` : "Discover wellness groups"}
            </Text>
          </View>

          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <Ionicons name="options" size={24} color="#FFFFFF" />
            {(searchTerm || filters.status !== "active" || filters.startDate || filters.endDate) && (
              <View style={styles.filterIndicator} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Container */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search health communities..."
            value={searchTerm}
            onChangeText={handleSearch}
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => handleSearch("")} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {totalCount > 0 && (
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              Showing {(pageNumber - 1) * pageSize + 1}-{Math.min(pageNumber * pageSize,totalCount)} of {totalCount}{" "}
              communities
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Content */}
      {loading && pageNumber === 1 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loaderText}>Loading health communities...</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.groupId?.toString() || Math.random().toString()}
          renderItem={renderGroup}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#10B981"]}
              tintColor="#10B981"
              progressBackgroundColor="#FFFFFF"
              progressViewOffset={0}
            />
          }
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading && pageNumber > 1 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.footerLoaderText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Modern Pagination */}
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
                <Ionicons name="chevron-back" size={20} color={pageNumber <= 1 ? "#CBD5E1" : "#10B981"} />
              </TouchableOpacity>

              {/* Page Dots */}
              <View style={styles.paginationDots}>{renderPaginationDots()}</View>

              {/* Next Button */}
              <TouchableOpacity
                style={[styles.paginationNavButton,pageNumber >= totalPages && styles.disabledNavButton]}
                onPress={() => goToPage(pageNumber + 1)}
                disabled={pageNumber >= totalPages || loading}
              >
                <Ionicons name="chevron-forward" size={20} color={pageNumber >= totalPages ? "#CBD5E1" : "#10B981"} />
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

      {renderFilterModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.primaryColor,
  },
  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
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
    fontSize: 24,
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  searchContainer: {
    backgroundColor: "#F8FAFC",
    marginTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    paddingVertical: 16,
  },
  clearSearchButton: {
    padding: 4,
  },
  resultsInfo: {
    alignItems: "center",
  },
  resultsText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },
  groupCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  thumbnailContainer: {
    position: "relative",
    marginRight: 12,
  },
  groupThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  privateBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  groupStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  groupDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
    marginBottom: 16,
  },
  activityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activityIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  activityText: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "500",
  },
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  healthBadgeText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  joinButton: {
    backgroundColor: "#10B981",
  },
  joinedButton: {
    backgroundColor: "#059669",
  },
  pendingButton: {
    backgroundColor: "#F59E0B",
  },
  actionButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F8FAFC",
  },
  loaderText: {
    fontSize: 16,
    color: "#4F46E5",
    marginTop: 16,
    fontWeight: "500",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footerLoaderText: {
    fontSize: 14,
    color: "#10B981",
    marginLeft: 8,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F8FAFC",
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyActionText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  paginationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  paginationGradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    backgroundColor: "#D1FAE5",
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
    backgroundColor: "#10B981",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "60%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
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
    backgroundColor: "#4F46E5",
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
    backgroundColor: "#10B981",
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
})

export default ActiveGroupsScreenModern
