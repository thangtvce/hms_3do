import { useState,useEffect,useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  StatusBar,
  Animated,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { Feather,Ionicons,MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import HTML from "react-native-render-html";
import { trainerService } from "services/apiTrainerService";
import { useAuth } from "context/AuthContext";
import DynamicStatusBar from "screens/statusBar/DynamicStatusBar";
import { theme } from "theme/color";

const { width,height } = Dimensions.get("window")

const ServicePackageScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [packages,setPackages] = useState([]);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [showDeleteModal,setShowDeleteModal] = useState(false);
  const [showFilterModal,setShowFilterModal] = useState(false);
  const [selectedPackageId,setSelectedPackageId] = useState(null);

  const [pageNumber,setPageNumber] = useState(1);
  const [pageSize,setPageSize] = useState(10);
  const [totalPages,setTotalPages] = useState(1);
  const [totalItems,setTotalItems] = useState(0);
  const [searchTerm,setSearchTerm] = useState("");
  const [hasMore,setHasMore] = useState(true);

  const [filters,setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minDays: "",
    maxDays: "",
    startDate: null,
    endDate: null,
    sortBy: "packageId",
    sortDescending: true,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [tempFilters,setTempFilters] = useState(filters);
  // const [showCategoryModal,setShowCategoryModal] = useState(false);
  // const [showStartDatePicker,setShowStartDatePicker] = useState(false);
  // const [showEndDatePicker,setShowEndDatePicker] = useState(false);

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
    ]).start();
    return () => {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    };
  },[]);

  const fetchPackages = async (page = 1,refresh = false) => {
    try {
      setLoading(true);

      const formatDate = (date) => {
        if (!date) return undefined;
        return `${(date.getMonth() + 1).toString().padStart(2,"0")}-${date
          .getDate()
          .toString()
          .padStart(2,"0")}-${date.getFullYear()}`;
      };
      const response = await trainerService.getAllActiveServicePackage({
        PageNumber: page,
        PageSize: pageSize,
        SearchTerm: searchTerm || undefined,
        Status: "active",
        StartDate: null,
        EndDate: null,
        MinPrice: filters.minPrice || undefined,
        MaxPrice: filters.maxPrice || undefined,
        MinDuration: filters.minDays || undefined,
        MaxDuration: filters.maxDays || undefined,
        SortBy: filters.sortBy,
        SortDescending: filters.sortDescending,
      });

      if (response.statusCode === 200 && response.data) {
        if (Array.isArray(response.data.packages)) {
          const newPackages = response.data.packages;
          setPackages(newPackages);
          setTotalPages(response.data.totalPages || 1);
          setTotalItems(response.data.totalCount || 0);
          setHasMore(page < (response.data.totalPages || 1));
        } else {
          Alert.alert("Notice","Unable to load service package data.");
        }
      } else {
        Alert.alert("Notice",response.message || "Unable to load service packages.");
      }
    } catch (error) {
      console.log("Fetch Error:",error);
      Alert.alert("Error","An error occurred while loading service packages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPackages(pageNumber);
  },[pageNumber,pageSize,searchTerm,filters]);

  const onRefresh = () => {
    setPageNumber(1);
    fetchPackages(1,true);
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    setPageNumber(1);
  };

  const handleNextPage = () => {
    if (hasMore && !loading) {
      setPageNumber((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageNumber > 1 && !loading) {
      setPageNumber((prev) => prev - 1);
    }
  };

  const applyTempFilters = () => {
    setFilters(tempFilters);
    setPageNumber(1);
    setShowFilterModal(false);
    fetchPackages(1);
  };

  const resetTempFilters = () => {
    const defaultFilters = {
      minPrice: "",
      maxPrice: "",
      minDays: "",
      maxDays: "",
      startDate: null,
      endDate: null,
      sortBy: "packageId",
      sortDescending: true,
      category: "all",
    };
    setTempFilters(defaultFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      minPrice: "",
      maxPrice: "",
      minDays: "",
      maxDays: "",
      startDate: null,
      endDate: null,
      sortBy: "packageId",
      sortDescending: true,
      category: "all",
    };
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    setSearchTerm("");
    setPageNumber(1);
  };

  const getPackageIcon = (packageName) => {
    if (!packageName) return "fitness";
    const name = packageName.toLowerCase();
    if (name.includes("yoga") || name.includes("meditation")) {
      return "yoga";
    } else if (name.includes("diet") || name.includes("nutrition")) {
      return "nutrition";
    } else if (name.includes("cardio") || name.includes("running")) {
      return "cardio";
    } else {
      return "fitness";
    }
  };

  const renderPackageIcon = (type) => {
    switch (type) {
      case "yoga":
        return <MaterialCommunityIcons name="yoga" size={24} color="#10B981" />;
      case "nutrition":
        return <Ionicons name="nutrition" size={24} color="#F59E0B" />;
      case "cardio":
        return <Ionicons name="heart" size={24} color="#EF4444" />;
      default:
        return <MaterialCommunityIcons name="weight-lifter" size={24} color="#4F46E5" />;
    }
  };

  const renderPackage = ({ item }) => {
    const packageType = getPackageIcon(item.packageName);

    return (
      <Animated.View
        style={[
          styles.packageItem,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0,30],
                  outputRange: [0,30],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.packageCard}
          onPress={() => navigation.navigate("PackageDetail",{ package: item })}
          activeOpacity={0.8}
        >
          <LinearGradient colors={["#FFFFFF","#F8FAFC"]} style={styles.cardGradient}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>{renderPackageIcon(packageType)}</View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.packageName}>{item.packageName || "Service Package"}</Text>
                <Text style={styles.trainerName}>by {item.trainerFullName || "Unknown Trainer"}</Text>
              </View>
              {user?.roles?.includes("Trainer") && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setSelectedPackageId(item.packageId);
                    setShowDeleteModal(true);
                  }}
                  hitSlop={{ top: 10,bottom: 10,left: 10,right: 10 }}
                >
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.cardContent}>
              {item.description && (
                <View style={styles.descriptionContainer}>
                  <HTML
                    source={{ html: item.description }}
                    contentWidth={width - 72}
                    baseStyle={styles.packageDescription}
                    tagsStyles={{
                      p: { margin: 0,padding: 0 },
                      strong: { fontWeight: "700" },
                      em: { fontStyle: "italic" },
                      ul: { marginVertical: 4,paddingLeft: 20 },
                      ol: { marginVertical: 4,paddingLeft: 20 },
                      li: { marginBottom: 4 },
                      div: { margin: 0,padding: 0 },
                      span: { margin: 0,padding: 0 },
                      a: { color: "#4F46E5",textDecorationLine: "underline" },
                    }}
                    defaultTextProps={{
                      numberOfLines: 2,
                      ellipsizeMode: "tail",
                    }}
                    renderersProps={{
                      TText: {
                        numberOfLines: 2,
                        ellipsizeMode: "tail",
                      },
                    }}
                    onHTMLParsingError={(error) => {
                      return <Text style={styles.packageDescription} numberOfLines={2}>
                        {item.description.replace(/<[^>]+>/g,"")}
                      </Text>;
                    }}
                  />
                </View>
              )}
              <View style={styles.packageDetailsContainer}>
                <View style={styles.packageDetailItem}>
                  <View style={[styles.detailIconContainer,{ backgroundColor: "#EEF2FF" }]}>
                    <Ionicons name="pricetag-outline" size={14} color="#4F46E5" />
                  </View>
                  <Text style={styles.packageDetailText}>
                    {item.price ? `$${item.price.toLocaleString()}` : "Contact"}
                  </Text>
                </View>

                <View style={styles.packageDetailItem}>
                  <View style={[styles.detailIconContainer,{ backgroundColor: "#F0FDF4" }]}>
                    <Ionicons name="calendar-outline" size={14} color="#10B981" />
                  </View>
                  <Text style={styles.packageDetailText}>{item.durationDays || "N/A"} days</Text>
                </View>

                <View style={styles.packageDetailItem}>
                  <View style={[styles.detailIconContainer,{ backgroundColor: "#FEF2F2" }]}>
                    <Ionicons name="fitness-outline" size={14} color="#EF4444" />
                  </View>
                  <Text style={styles.packageDetailText}>
                    {packageType === "yoga"
                      ? "Yoga"
                      : packageType === "nutrition"
                        ? "Nutrition"
                        : packageType === "cardio"
                          ? "Cardio"
                          : "Fitness"}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const sortOptions = [
    { label: "Package ID",value: "packageId",icon: "key-outline" },
    { label: "Price",value: "price",icon: "pricetag-outline" },
    { label: "Duration",value: "days",icon: "calendar-outline" },
    { label: "Created Date",value: "created",icon: "time-outline" },
  ];

  const pageSizeOptions = [
    { label: "5",value: 5 },
    { label: "10",value: 10 },
    { label: "20",value: 20 },
    { label: "50",value: 50 },
  ];

  const formatDisplayDate = (date) => {
    if (!date) return "Select Date";
    return `${(date.getMonth() + 1).toString().padStart(2,"0")}-${date
      .getDate()
      .toString()
      .padStart(2,"0")}-${date.getFullYear()}`;
  };

  const renderFilterModal = () => {
    return (
      <>
        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowFilterModal(false);
            setTempFilters(filters);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.filterModalContent}>
              <View style={styles.dragHandle} />

              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Filter & Sort</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowFilterModal(false);
                    setTempFilters(filters);
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.filterScrollView} showsVerticalScrollIndicator={false}>
                {/* Price Range */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Price Range</Text>
                  <View style={styles.rangeInputContainer}>
                    <TextInput
                      style={styles.rangeInput}
                      placeholder="Min Price"
                      value={tempFilters.minPrice}
                      onChangeText={(text) => setTempFilters({ ...tempFilters,minPrice: text })}
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                    <Text style={styles.rangeSeparator}>to</Text>
                    <TextInput
                      style={styles.rangeInput}
                      placeholder="Max Price"
                      value={tempFilters.maxPrice}
                      onChangeText={(text) => setTempFilters({ ...tempFilters,maxPrice: text })}
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Duration Range */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Duration (Days)</Text>
                  <View style={styles.rangeInputContainer}>
                    <TextInput
                      style={styles.rangeInput}
                      placeholder="Min Days"
                      value={tempFilters.minDays}
                      onChangeText={(text) => setTempFilters({ ...tempFilters,minDays: text })}
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                    <Text style={styles.rangeSeparator}>to</Text>
                    <TextInput
                      style={styles.rangeInput}
                      placeholder="Max Days"
                      value={tempFilters.maxDays}
                      onChangeText={(text) => setTempFilters({ ...tempFilters,maxDays: text })}
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Date Range */}
                {/* <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Date Range</Text>
                  <View style={styles.rangeInputContainer}>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(tempFilters.startDate)}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.rangeSeparator}>to</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(tempFilters.endDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View> */}

                {/* Sort Options */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Sort By</Text>
                  <View style={styles.sortOptionsGrid}>
                    {sortOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.sortOptionCard,
                          tempFilters.sortBy === option.value && styles.selectedSortCard,
                        ]}
                        onPress={() => setTempFilters({ ...tempFilters,sortBy: option.value })}
                      >
                        <Ionicons
                          name={option.icon}
                          size={24}
                          color={tempFilters.sortBy === option.value ? "#4F46E5" : "#64748B"}
                        />
                        <Text
                          style={[
                            styles.sortOptionText,
                            tempFilters.sortBy === option.value && styles.selectedSortText,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Sort Direction Toggle */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Sort Order</Text>
                  <View style={styles.sortDirectionContainer}>
                    <TouchableOpacity
                      style={[
                        styles.sortDirectionButton,
                        !tempFilters.sortDescending && styles.selectedSortDirection,
                      ]}
                      onPress={() => setTempFilters({ ...tempFilters,sortDescending: false })}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={20}
                        color={!tempFilters.sortDescending ? "#FFFFFF" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.sortDirectionText,
                          !tempFilters.sortDescending && styles.selectedSortDirectionText,
                        ]}
                      >
                        Ascending
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.sortDirectionButton,
                        tempFilters.sortDescending && styles.selectedSortDirection,
                      ]}
                      onPress={() => setTempFilters({ ...tempFilters,sortDescending: true })}
                    >
                      <Ionicons
                        name="arrow-down"
                        size={20}
                        color={tempFilters.sortDescending ? "#FFFFFF" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.sortDirectionText,
                          tempFilters.sortDescending && styles.selectedSortDirectionText,
                        ]}
                      >
                        Descending
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Items per Page */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Items per Page</Text>
                  <View style={styles.pageSizeGrid}>
                    {pageSizeOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.pageSizeCard,
                          pageSize === option.value && styles.selectedPageSizeCard,
                        ]}
                        onPress={() => setPageSize(option.value)}
                      >
                        <Text
                          style={[
                            styles.pageSizeCardText,
                            pageSize === option.value && styles.selectedPageSizeCardText,
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text
                          style={[
                            styles.pageSizeCardLabel,
                            pageSize === option.value && styles.selectedPageSizeCardLabel,
                          ]}
                        >
                          items
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.filterActions}>
                <TouchableOpacity style={styles.clearFiltersButton} onPress={resetTempFilters}>
                  <Text style={styles.clearFiltersText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyFiltersButton} onPress={applyTempFilters}>
                  <Text style={styles.applyFiltersText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Date Pickers */}
        {/* {showStartDatePicker == true && (
          <DateTimePicker
            value={tempFilters.startDate || new Date()}
            mode="date"
            display="default"
            onChange={(event,selectedDate) => {
              setShowStartDatePicker(Platform.OS === "ios");
              if (selectedDate) {
                setTempFilters({ ...tempFilters,startDate: selectedDate });
              }
            }}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={tempFilters.endDate || new Date()}
            mode="date"
            display="default"
            onChange={(event,selectedDate) => {
              setShowEndDatePicker(Platform.OS === "ios");
              if (selectedDate) {
                setTempFilters({ ...tempFilters,endDate: selectedDate });
              }
            }}
          />
        )} */}
      </>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness-outline" size={64} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>No Service Packages Found</Text>
      <Text style={styles.emptyText}>No service packages match your current search and filter criteria.</Text>
      <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
        <Text style={styles.clearFiltersText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <DynamicStatusBar backgroundColor={theme.primaryColor} />

      {/* Header */}
      <LinearGradient colors={["#4F46E5","#6366F1","#818CF8"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Service Packages</Text>
            <Text style={styles.headerSubtitle}>Choose the perfect plan for you</Text>
          </View>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => {
              setShowFilterModal(true);
            }}
          >
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
            placeholder="Search service packages..."
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

        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {totalItems} packages found • Page {pageNumber} of {totalPages}
          </Text>
        </View>
      </Animated.View>

      {/* Content */}
      {loading && pageNumber === 1 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loaderText}>Loading service packages...</Text>
        </View>
      ) : (
        <FlatList
          data={packages}
          key={(item) => item.packageId.toString()}
          keyExtractor={(item) => item.packageId.toString()}
          renderItem={renderPackage}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading && pageNumber > 1 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.footerLoaderText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <Animated.View
          style={[
            styles.paginationContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.paginationButton,pageNumber <= 1 || loading ? styles.disabledButton : null]}
            onPress={handlePreviousPage}
            disabled={pageNumber <= 1 || loading}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.pageInfoContainer}>
            <Text style={styles.pageInfo}>Page {pageNumber} of {totalPages}</Text>
          </View>

          <TouchableOpacity
            style={[styles.paginationButton,pageNumber >= totalPages || loading ? styles.disabledButton : null]}
            onPress={handleNextPage}
            disabled={pageNumber >= totalPages || loading}
          >
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}
      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.primaryColor,
  },
  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    paddingBottom: 16,
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
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0,height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0,height: 1 },
    textShadowRadius: 1,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  searchContainer: {
    backgroundColor: "#F8FAFC",
    marginTop: 15,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
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
    paddingBottom: 100,
    backgroundColor: "#fff"
  },
  packageItem: {
    marginBottom: 20,
  },
  packageCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  packageName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  trainerName: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
  },
  cardContent: {
    marginTop: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 16,
  },
  descriptionContainer: {
    maxHeight: 40,
    overflow: "hidden",
  },
  packageDetailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  packageDetailItem: {
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
  packageDetailText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
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
    color: "#4F46E5",
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    shadowOffset: { width: 0,height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  paginationButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginHorizontal: 4,
  },
  pageInfoContainer: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  pageInfo: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
  },
  pageSubInfo: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  addButton: {
    position: "absolute",
    bottom: 100,
    right: 24,
    backgroundColor: "#4F46E5",
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "stretch",
  },
  filterModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    minHeight: "50%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  closeButton: {
    padding: 4,
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
  },
  rangeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
  },
  dateInputText: {
    fontSize: 16,
    color: "#1E293B",
  },
  rangeSeparator: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  filterActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  clearFiltersText: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "600",
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyFiltersText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  deleteModalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    width: "85%",
    alignItems: "center",
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: "auto",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  confirmButton: {
    backgroundColor: "#EF4444",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categorySelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categorySelectorText: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  sortOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sortOptionCard: {
    flex: 1,
    minWidth: "25%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedSortCard: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 8,
  },
  selectedSortText: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  sortDirectionContainer: {
    flexDirection: "row",
    gap: 12,
  },
  sortDirectionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  selectedSortDirection: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  sortDirectionText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  selectedSortDirectionText: {
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
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedPageSizeCard: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  pageSizeCardText: {
    fontSize: 18,
    color: "#1E293B",
    fontWeight: "700",
  },
  selectedPageSizeCardText: {
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
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  categoryModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 320,
    maxHeight: "70%",
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedCategoryOption: {
    backgroundColor: "#EEF2FF",
  },
  categoryOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryOptionText: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  selectedCategoryOptionText: {
    color: "#4F46E5",
    fontWeight: "600",
  },
});

export default ServicePackageScreen;