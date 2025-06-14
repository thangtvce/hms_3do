import React,{ useState,useEffect,useRef } from "react"
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { workoutService } from "services/apiWorkoutService"
import { LinearGradient } from "expo-linear-gradient"

const { width,height } = Dimensions.get("window")

const STATUS_OPTIONS = [
  { label: "All Status",value: "" },
  { label: "Active",value: "active" },
  { label: "Inactive",value: "inactive" },
  { label: "Draft",value: "draft" },
]

const PAGE_SIZE_OPTIONS = [5,10,15,20,25,50]

const WorkoutScreen = () => {
  const navigation = useNavigation()
  const [items,setItems] = useState([])
  const [categories,setCategories] = useState([])
  const [categoryMap,setCategoryMap] = useState({})
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState(null)
  const [refreshing,setRefreshing] = useState(false)
  const [showFilters,setShowFilters] = useState(false)

  // Pagination states
  const [currentPage,setCurrentPage] = useState(1)
  const [totalPages,setTotalPages] = useState(1)
  const [totalItems,setTotalItems] = useState(0)
  const [hasNextPage,setHasNextPage] = useState(false)
  const [hasPrevPage,setHasPrevPage] = useState(false)

  // Search states
  const [searchQuery,setSearchQuery] = useState("")

  // Filter states - separate from applied filters
  const [filters,setFilters] = useState({
    pageNumber: 1,
    pageSize: 10,
    startDate: "",
    endDate: "",
    validPageSize: 10,
    searchTerm: "",
    status: "",
    categoryId: "",
  })

  // Applied filters - only these are used for API calls
  const [appliedFilters,setAppliedFilters] = useState({
    pageNumber: 1,
    pageSize: 10,
    startDate: "",
    endDate: "",
    validPageSize: 10,
    searchTerm: "",
    status: "",
    categoryId: "",
  })

  // Applied search query - only this is used for API calls
  const [appliedSearchQuery,setAppliedSearchQuery] = useState("")

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    // Entrance animation
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
    ]).start()
  },[])

  const fetchCategories = async () => {
    try {
      const response = await workoutService.getAllCategories()
      const categoriesData = response || []
      setCategories(categoriesData)

      const map = categoriesData.reduce((acc,category) => {
        acc[category.categoryId] = category.categoryName
        return acc
      },{})
      setCategoryMap(map)

      return categoriesData
    } catch (err) {
      console.log("Failed to load categories:",err)
      return []
    }
  }

  const fetchExercises = async (isRefresh = false,customParams = null,pageNumber = null) => {
    if (!isRefresh) setLoading(true)
    setError(null)

    try {
      // Use custom params if provided, otherwise use applied filters and search
      const params = customParams || {}

      if (!customParams) {
        // Set pagination
        params.PageNumber = pageNumber || appliedFilters.pageNumber || currentPage
        params.PageSize = appliedFilters.pageSize || 10

        // Only add parameters if they have meaningful values from applied states
        if (appliedSearchQuery.trim()) {
          params.SearchTerm = appliedSearchQuery.trim()
        }
        if (appliedFilters.searchTerm.trim()) {
          params.SearchTerm = appliedFilters.searchTerm.trim()
        }
        if (appliedFilters.status) {
          params.Status = appliedFilters.status
        }
        if (appliedFilters.categoryId) {
          params.CategoryId = appliedFilters.categoryId
        }
        if (appliedFilters.startDate) {
          params.StartDate = appliedFilters.startDate
        }
        if (appliedFilters.endDate) {
          params.EndDate = appliedFilters.endDate
        }
      }

      console.log("API Parameters:",params)

      // Fetch data
      const response = await workoutService.getAllExercises(params)

      // Also fetch categories if needed
      if (categories.length === 0) {
        await fetchCategories()
      }

      // Handle pagination response
      if (response && typeof response === 'object') {
        const exercises = Array.isArray(response.exercises) ? response.exercises :
          Array.isArray(response.data) ? response.data :
            Array.isArray(response) ? response : []

        // Update pagination info if available
        if (response.pagination) {
          setCurrentPage(response.pagination.currentPage || params.PageNumber || 1)
          setTotalPages(response.pagination.totalPages || 1)
          setTotalItems(response.pagination.totalItems || exercises.length)
          setHasNextPage(response.pagination.hasNextPage || false)
          setHasPrevPage(response.pagination.hasPreviousPage || false)
        } else {
          // Fallback pagination calculation
          const totalCount = response.totalCount || exercises.length
          const pageSize = params.PageSize || 10
          const currentPageNum = params.PageNumber || 1

          setCurrentPage(currentPageNum)
          setTotalPages(Math.ceil(totalCount / pageSize))
          setTotalItems(totalCount)
          setHasNextPage(currentPageNum < Math.ceil(totalCount / pageSize))
          setHasPrevPage(currentPageNum > 1)
        }

        console.log("Fetched exercises:",exercises.length,exercises)
        setItems([...exercises])
      } else {
        setItems([])
        setCurrentPage(1)
        setTotalPages(1)
        setTotalItems(0)
        setHasNextPage(false)
        setHasPrevPage(false)
      }

    } catch (err) {
      console.log("Fetch error:",err)
      setError(err.message || "Failed to load exercises")
      setItems([])
    } finally {
      setLoading(false)
      if (isRefresh) setRefreshing(false)
    }
  }

  // Initial load - fetch all exercises without filters
  useEffect(() => {
    fetchExercises()
  },[])

  const onRefresh = () => {
    setRefreshing(true)
    setCurrentPage(1)
    fetchExercises(true,null,1)
  }

  const handleSearch = () => {
    // Apply the current search query and fetch from page 1
    setAppliedSearchQuery(searchQuery)
    setCurrentPage(1)

    // Create params with current search
    const searchParams = {
      PageNumber: 1,
      PageSize: appliedFilters.pageSize || 10
    }

    if (searchQuery.trim()) {
      searchParams.SearchTerm = searchQuery.trim()
    }

    // Also include current applied filters
    if (appliedFilters.status) {
      searchParams.Status = appliedFilters.status
    }
    if (appliedFilters.categoryId) {
      searchParams.CategoryId = appliedFilters.categoryId
    }
    if (appliedFilters.startDate) {
      searchParams.StartDate = appliedFilters.startDate
    }
    if (appliedFilters.endDate) {
      searchParams.EndDate = appliedFilters.endDate
    }

    fetchExercises(false,searchParams,1)
  }

  const applyFilters = () => {
    // Apply current filters and close modal
    setAppliedFilters({ ...filters })
    setShowFilters(false)
    setCurrentPage(1)

    // Create params with current filters
    const filterParams = {
      PageNumber: 1,
      PageSize: filters.pageSize || 10
    }

    if (filters.searchTerm.trim()) {
      filterParams.SearchTerm = filters.searchTerm.trim()
    }
    if (filters.status) {
      filterParams.Status = filters.status
    }
    if (filters.categoryId) {
      filterParams.CategoryId = filters.categoryId
    }
    if (filters.startDate) {
      filterParams.StartDate = filters.startDate
    }
    if (filters.endDate) {
      filterParams.EndDate = filters.endDate
    }

    // Also include current applied search if exists
    if (appliedSearchQuery.trim()) {
      filterParams.SearchTerm = appliedSearchQuery.trim()
    }

    fetchExercises(false,filterParams,1)
  }

  const resetFilters = () => {
    // Reset both current and applied filters
    const resetState = {
      pageNumber: 1,
      pageSize: 10,
      startDate: "",
      endDate: "",
      validPageSize: 10,
      searchTerm: "",
      status: "",
      categoryId: "",
    }

    setFilters(resetState)
    setAppliedFilters(resetState)
    setSearchQuery("")
    setAppliedSearchQuery("")
    setCurrentPage(1)

    // Fetch all data without any filters
    setTimeout(() => fetchExercises(false,{ PageNumber: 1,PageSize: 10 },1),100)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setAppliedSearchQuery("")
    setCurrentPage(1)

    // Fetch with current applied filters only
    const filterParams = {
      PageNumber: 1,
      PageSize: appliedFilters.pageSize || 10
    }

    if (appliedFilters.status) {
      filterParams.Status = appliedFilters.status
    }
    if (appliedFilters.categoryId) {
      filterParams.CategoryId = appliedFilters.categoryId
    }
    if (appliedFilters.startDate) {
      filterParams.StartDate = appliedFilters.startDate
    }
    if (appliedFilters.endDate) {
      filterParams.EndDate = appliedFilters.endDate
    }

    fetchExercises(false,filterParams,1)
  }

  // Pagination functions
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      setCurrentPage(pageNumber)
      fetchExercises(false,null,pageNumber)
    }
  }

  const goToNextPage = () => {
    if (hasNextPage) {
      goToPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (hasPrevPage) {
      goToPage(currentPage - 1)
    }
  }

  const getExerciseImage = (exerciseName) => {
    return `https://source.unsplash.com/400x250/?fitness,${exerciseName.replace(/\s/g,"")}`
  }

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null

    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1,currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages,startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1,endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Showing {((currentPage - 1) * appliedFilters.pageSize) + 1}-{Math.min(currentPage * appliedFilters.pageSize,totalItems)} of {totalItems}
          </Text>
        </View>

        <View style={styles.paginationControls}>
          <TouchableOpacity
            style={[styles.paginationButton,!hasPrevPage && styles.paginationButtonDisabled]}
            onPress={goToPrevPage}
            disabled={!hasPrevPage}
          >
            <Ionicons name="chevron-back" size={16} color={hasPrevPage ? "#4F46E5" : "#9CA3AF"} />
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pageNumbersContainer}>
            {startPage > 1 && (
              <>
                <TouchableOpacity style={styles.pageNumberButton} onPress={() => goToPage(1)}>
                  <Text style={styles.pageNumberText}>1</Text>
                </TouchableOpacity>
                {startPage > 2 && <Text style={styles.paginationEllipsis}>...</Text>}
              </>
            )}

            {pageNumbers.map((pageNum) => (
              <TouchableOpacity
                key={pageNum}
                style={[
                  styles.pageNumberButton,
                  currentPage === pageNum && styles.pageNumberButtonActive
                ]}
                onPress={() => goToPage(pageNum)}
              >
                <Text style={[
                  styles.pageNumberText,
                  currentPage === pageNum && styles.pageNumberTextActive
                ]}>
                  {pageNum}
                </Text>
              </TouchableOpacity>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <Text style={styles.paginationEllipsis}>...</Text>}
                <TouchableOpacity style={styles.pageNumberButton} onPress={() => goToPage(totalPages)}>
                  <Text style={styles.pageNumberText}>{totalPages}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.paginationButton,!hasNextPage && styles.paginationButtonDisabled]}
            onPress={goToNextPage}
            disabled={!hasNextPage}
          >
            <Ionicons name="chevron-forward" size={16} color={hasNextPage ? "#4F46E5" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Search</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Search Term */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Search Term</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Enter search term..."
                value={filters.searchTerm}
                onChangeText={(value) => setFilters(prev => ({ ...prev,searchTerm: value }))}
              />
            </View>

            {/* Page Size */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Items per page</Text>
              <View style={styles.pageSizeContainer}>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.pageSizeButton,
                      filters.pageSize === size && styles.selectedPageSize
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev,pageSize: size,validPageSize: size }))}
                  >
                    <Text style={[
                      styles.pageSizeText,
                      filters.pageSize === size && styles.selectedPageSizeText
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD-MM-YYYY"
                    value={filters.startDate}
                    onChangeText={(value) => setFilters(prev => ({ ...prev,startDate: value }))}
                  />
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD-MM-YYYY"
                    value={filters.endDate}
                    onChangeText={(value) => setFilters(prev => ({ ...prev,endDate: value }))}
                  />
                </View>
              </View>
            </View>

            {/* Status */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.filterOption,
                    filters.status === status.value && styles.selectedOption
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev,status: status.value }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.status === status.value && styles.selectedOptionText
                  ]}>
                    {status.label}
                  </Text>
                  {filters.status === status.value && (
                    <Ionicons name="checkmark" size={20} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Categories */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.categoryId === "" && styles.selectedOption
                ]}
                onPress={() => setFilters(prev => ({ ...prev,categoryId: "" }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.categoryId === "" && styles.selectedOptionText
                ]}>
                  All Categories
                </Text>
                {filters.categoryId === "" && (
                  <Ionicons name="checkmark" size={20} color="#4F46E5" />
                )}
              </TouchableOpacity>

              {categories.map((category) => (
                <TouchableOpacity
                  key={category.categoryId}
                  style={[
                    styles.filterOption,
                    filters.categoryId === category.categoryId && styles.selectedOption
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev,categoryId: category.categoryId }))}
                >
                  <View style={styles.categoryOptionContent}>
                    <View style={styles.categoryIcon}>
                      <Ionicons name="fitness-outline" size={16} color="#4F46E5" />
                    </View>
                    <Text style={[
                      styles.filterOptionText,
                      filters.categoryId === category.categoryId && styles.selectedOptionText
                    ]}>
                      {category.categoryName}
                    </Text>
                  </View>
                  {filters.categoryId === category.categoryId && (
                    <Ionicons name="checkmark" size={20} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  const renderExerciseItem = ({ item,index }) => {
    return (
      <Animated.View
        style={[
          styles.exerciseItem,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("ExerciseDetails",{ exercise: item })}
          activeOpacity={0.8}
          style={styles.exerciseCard}
        >
          <View style={styles.exerciseImageContainer}>
            <Image
              source={{ uri: item.mediaUrl || getExerciseImage(item.exerciseName || "fitness") }}
              style={styles.exerciseImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0)","rgba(0,0,0,0.7)"]}
              style={styles.exerciseGradient}
            >
              <Text style={styles.exerciseName}>
                {item.exerciseName || "Unknown Exercise"}
              </Text>
            </LinearGradient>

            {/* Status Badge */}
            {item.status && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.status === 'active' ? '#10B981' : '#EF4444' }
              ]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.exerciseContent}>
            <Text style={styles.exerciseDescription} numberOfLines={2}>
              {item.description || "No description available"}
            </Text>

            <View style={styles.exerciseDetailsContainer}>
              <View style={styles.exerciseDetailItem}>
                <View style={[styles.detailIconContainer,{ backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="grid-outline" size={14} color="#4F46E5" />
                </View>
                <Text style={styles.exerciseDetailText}>
                  {categoryMap[item.categoryId] || `Category ${item.categoryId || 'Unknown'}`}
                </Text>
              </View>

              {item.caloriesBurnedPerMin && (
                <View style={styles.exerciseDetailItem}>
                  <View style={[styles.detailIconContainer,{ backgroundColor: "#FEF2F2" }]}>
                    <Ionicons name="flame-outline" size={14} color="#EF4444" />
                  </View>
                  <Text style={styles.exerciseDetailText}>
                    {item.caloriesBurnedPerMin} kcal/min
                  </Text>
                </View>
              )}

              {item.genderSpecific && (
                <View style={styles.exerciseDetailItem}>
                  <View style={[styles.detailIconContainer,{ backgroundColor: "#F0FDF4" }]}>
                    <Ionicons name="person-outline" size={14} color="#10B981" />
                  </View>
                  <Text style={styles.exerciseDetailText}>{item.genderSpecific}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading fitness content...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <LinearGradient colors={["#4F46E5","#6366F1","#818CF8"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Fitness Hub</Text>
            <Text style={styles.headerSubtitle}>Discover exercises & workouts</Text>
          </View>
          <TouchableOpacity style={styles.headerActionButton} onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Section */}
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
          <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Active Filters Indicator */}
      {(appliedSearchQuery || appliedFilters.status || appliedFilters.categoryId || appliedFilters.startDate || appliedFilters.endDate) && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
            {appliedSearchQuery && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Search: {appliedSearchQuery}</Text>
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close" size={16} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            )}
            {appliedFilters.status && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Status: {appliedFilters.status}</Text>
              </View>
            )}
            {appliedFilters.categoryId && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Category: {categoryMap[appliedFilters.categoryId] || appliedFilters.categoryId}</Text>
              </View>
            )}
            {appliedFilters.pageSize !== 10 && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Per page: {appliedFilters.pageSize}</Text>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.clearAllFiltersButton} onPress={resetFilters}>
            <Text style={styles.clearAllFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {error && !refreshing ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchExercises()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              renderItem={renderExerciseItem}
              keyExtractor={(item,index) => {
                return item.exerciseId ? `exercise-${item.exerciseId}` : `item-${index}`
              }}
              contentContainerStyle={[
                styles.listContainer,
                { minHeight: height - 300 }
              ]}
              style={styles.flatListStyle}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#4F46E5"]}
                  tintColor="#4F46E5"
                />
              }
              showsVerticalScrollIndicator={false}
              bounces={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="barbell-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No exercises found</Text>
                    <Text style={styles.emptyText}>
                      {appliedSearchQuery || appliedFilters.status || appliedFilters.categoryId
                        ? "No exercises match your search criteria."
                        : "Try refreshing or check your connection."}
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchExercises()}>
                      <Text style={styles.retryButtonText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              }
            />

            {/* Pagination Controls */}
            {renderPaginationControls()}
          </>
        )}
      </View>

      {renderFilterModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#4F46E5",
  },
  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
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
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  searchContainer: {
    backgroundColor: "#F8FAFC",
    marginTop: -10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
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
  clearButton: {
    padding: 4,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  activeFiltersContainer: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  activeFiltersScroll: {
    flex: 1,
  },
  activeFilterChip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "500",
  },
  clearAllFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllFiltersText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  flatListStyle: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  // Pagination Styles
  paginationContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  paginationInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  paginationText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  paginationButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  paginationButtonDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  pageNumbersContainer: {
    maxWidth: width * 0.6,
  },
  pageNumberButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pageNumberButtonActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  pageNumberText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  pageNumberTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  paginationEllipsis: {
    fontSize: 14,
    color: "#9CA3AF",
    paddingHorizontal: 8,
    alignSelf: "center",
  },
  // Page Size Styles
  pageSizeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pageSizeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 40,
    alignItems: "center",
  },
  selectedPageSize: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  pageSizeText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  selectedPageSizeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  exerciseItem: {
    marginBottom: 20,
  },
  exerciseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  exerciseImageContainer: {
    position: "relative",
  },
  exerciseImage: {
    width: "100%",
    height: 180,
  },
  exerciseGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseContent: {
    padding: 20,
  },
  exerciseDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 16,
  },
  exerciseDetailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  exerciseDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  exerciseDetailText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    minHeight: height * 0.4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: "#F9FAFB",
    minHeight: height * 0.6,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2937",
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  selectedOption: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#4F46E5",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  categoryOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
})

export default WorkoutScreen