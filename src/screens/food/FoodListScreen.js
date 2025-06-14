import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { foodService } from 'services/apiFoodService';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SPACING = 16;
const ITEM_HEIGHT = 110;

const FoodListScreen = () => {
  const navigation = useNavigation();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  // Fetch active categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await foodService.getAllActiveCategories({ pageNumber: 1, pageSize: 100 });
      if (response.statusCode === 200) {
        setCategories(response.data.categories);
      } else {
        setError(response.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active foods with filters
  const fetchFoods = async () => {
    try {
      setLoading(true);
      const response = await foodService.getAllActiveFoods({
        pageNumber: 1,
        pageSize: 20,
        categoryId: selectedCategory,
        searchTerm: searchTerm || undefined,
      });
      if (response.statusCode === 200) {
        setFoods(response.data.foods);
      } else {
        setError(response.message || 'Failed to fetch foods');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch foods');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle food selection
  const handleSelectFood = (food) => {
    setSelectedFoods((prev) => {
      const exists = prev.find((f) => f.foodId === food.foodId);
      if (exists) {
        return prev.filter((f) => f.foodId !== food.foodId);
      }
      return [...prev, food];
    });
  };

  // Navigate to food details
  const navigateToFoodDetails = (food) => {
    navigation.navigate('FoodDetails', { food });
  };

  // Handle search and filter
  const handleSearch = () => {
    fetchFoods();
  };

  useEffect(() => {
    fetchCategories();
    fetchFoods();
  }, [selectedCategory]);

  const renderFoodItem = ({ item, index }) => {
    const isSelected = selectedFoods.some((f) => f.foodId === item.foodId);
    
    // Animation for each item
    const inputRange = [
      -1,
      0,
      ITEM_HEIGHT * index,
      ITEM_HEIGHT * (index + 2)
    ];
    
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.9],
      extrapolate: 'clamp'
    });
    
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.5],
      extrapolate: 'clamp'
    });
    
    return (
      <Animated.View 
        style={{ transform: [{ scale }], opacity }}
        key={`food-item-${item.foodId}`}
      >
        <TouchableOpacity
          style={[styles.foodCard, isSelected && styles.selectedFoodCard]}
          onPress={() => navigateToFoodDetails(item)}
          activeOpacity={0.7}
        >
          <View style={styles.foodImageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.foodInfo}>
            <View style={styles.foodHeader}>
              <Text style={styles.foodName} numberOfLines={1}>{item.foodName}</Text>
              <View style={styles.caloriesBadge}>
                <Text style={styles.foodCalories}>{item.calories} kcal</Text>
              </View>
            </View>
            <Text style={styles.foodCategory}>{item.categoryName}</Text>
            <View style={styles.macrosContainer}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{item.protein || 0}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{item.carbs || 0}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{item.fats || 0}g</Text>
                <Text style={styles.macroLabel}>Fats</Text>
              </View>
            </View>
          </View>
          
          {/* Selection button on the right */}
          <TouchableOpacity 
            style={[styles.selectionButton, isSelected && styles.selectedButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleSelectFood(item);
            }}
          >
            <Icon 
              name={isSelected ? "check-circle" : "add-circle-outline"} 
              size={28} 
              color={isSelected ? "#FFFFFF" : "#5E72E4"} 
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCategoryPill = ({ item }) => {
    const isSelected = selectedCategory === item.categoryId;
    return (
      <TouchableOpacity
        style={[styles.categoryPill, isSelected && styles.selectedCategoryPill]}
        onPress={() => setSelectedCategory(item.categoryId)}
        activeOpacity={0.7}
        key={`category-${item.categoryId || 'all'}`}
      >
        <Text style={[styles.categoryPillText, isSelected && styles.selectedCategoryPillText]}>
          {item.categoryName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <Text style={styles.headerTitle}>Food Explorer</Text>
          {selectedFoods.length > 0 && (
            <View style={styles.selectedCountBadge}>
              <Text style={styles.selectedCountText}>{selectedFoods.length}</Text>
            </View>
          )}
        </Animated.View>

        {/* Search Bar */}
        <Animated.View 
          style={[
            styles.searchBarContainer, 
            { transform: [{ translateY: searchBarTranslateY }] }
          ]}
        >
          <View style={styles.searchContainer}>
            <Icon name="search" size={22} color="#A0A0A0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search delicious foods..."
              placeholderTextColor="#A0A0A0"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={handleSearch}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={() => setSearchTerm('')}
              >
                <Icon name="close" size={18} color="#A0A0A0" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchIconButton} onPress={handleSearch}>
            <LinearGradient
              colors={['#5E72E4', '#825EE4']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="search" size={22} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Main Content */}
        <Animated.ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={24} color="#FFF" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchFoods}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Categories Horizontal Scroll */}
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <FlatList
              data={[{ categoryId: null, categoryName: 'All' }, ...categories]}
              renderItem={renderCategoryPill}
              keyExtractor={(item) => (item.categoryId || 'all').toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {/* Selected Foods Section */}
          {selectedFoods.length > 0 && (
            <View style={styles.selectedFoodsSection}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Your Selection</Text>
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => {/* Handle view all */}}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Icon name="chevron-right" size={16} color="#5E72E4" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={selectedFoods.slice(0, 3)} // Show only first 3 items
                renderItem={({ item }) => (
                  <View style={styles.selectedFoodItem} key={`selected-${item.foodId}`}>
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.selectedFoodImage} 
                      resizeMode="cover"
                    />
                    <View style={styles.selectedFoodDetails}>
                      <Text style={styles.selectedFoodName} numberOfLines={1}>
                        {item.foodName}
                      </Text>
                      <Text style={styles.selectedFoodCalories}>
                        {item.calories} kcal
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleSelectFood(item)}
                    >
                      <LinearGradient
                        colors={['#FF5E5E', '#FF3A3A']}
                        style={styles.removeGradient}
                      >
                        <Icon name="close" size={16} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item) => `selected-${item.foodId}`}
                scrollEnabled={false}
                ListFooterComponent={
                  selectedFoods.length > 3 ? (
                    <View style={styles.moreItemsContainer} key="more-items">
                      <Text style={styles.moreItemsText}>
                        +{selectedFoods.length - 3} more items
                      </Text>
                    </View>
                  ) : null
                }
              />
              
              <TouchableOpacity style={styles.confirmButton}>
                <LinearGradient
                  colors={['#5E72E4', '#825EE4']}
                  style={styles.confirmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.confirmText}>Confirm Selection</Text>
                  <Icon name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Foods List */}
          <View style={styles.foodsSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>All Foods</Text>
              <View style={styles.foodCountBadge}>
                <Text style={styles.foodCountText}>{foods.length}</Text>
              </View>
            </View>
            
            {foods.length === 0 && !loading ? (
              <View style={styles.emptyStateContainer} key="empty-state">
                <Icon name="restaurant-menu" size={60} color="#E0E0E0" />
                <Text style={styles.emptyText}>No foods found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              </View>
            ) : (
              foods.map((item, index) => renderFoodItem({ item, index }))
            )}
          </View>
        </Animated.ScrollView>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#5E72E4" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING,
    paddingTop: SPACING,
    paddingBottom: SPACING / 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1F36',
  },
  selectedCountBadge: {
    backgroundColor: '#5E72E4',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCountText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    paddingVertical: SPACING / 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 9,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1F36',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
  },
  searchIconButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    paddingHorizontal: SPACING,
    paddingBottom: SPACING * 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5E5E',
    borderRadius: 12,
    padding: SPACING,
    marginTop: SPACING,
    marginBottom: SPACING / 2,
  },
  errorText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  categoriesContainer: {
    marginTop: SPACING,
    marginBottom: SPACING / 2,
  },
  categoriesList: {
    paddingVertical: SPACING / 2,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F4F5F7',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategoryPill: {
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    borderColor: '#5E72E4',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8898AA',
  },
  selectedCategoryPillText: {
    color: '#5E72E4',
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING,
    marginTop: SPACING,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F36',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5E72E4',
    marginRight: 4,
  },
  foodCountBadge: {
    backgroundColor: '#F4F5F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  foodCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8898AA',
  },
  selectedFoodsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING,
    marginTop: SPACING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  selectedFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F7',
  },
  selectedFoodImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  selectedFoodDetails: {
    flex: 1,
    marginLeft: 12,
  },
  selectedFoodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1F36',
  },
  selectedFoodCalories: {
    fontSize: 13,
    color: '#8898AA',
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  removeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemsContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  moreItemsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8898AA',
  },
  confirmButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: SPACING,
  },
  confirmGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  foodsSection: {
    marginTop: SPACING,
  },
  foodCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
    height: ITEM_HEIGHT,
    position: 'relative',
  },
  selectedFoodCard: {
    borderWidth: 2,
    borderColor: '#5E72E4',
  },
  foodImageContainer: {
    width: 110,
    height: ITEM_HEIGHT,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  foodInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    paddingRight: 50, // Make room for selection button
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F36',
    flex: 1,
  },
  caloriesBadge: {
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  foodCalories: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5E72E4',
  },
  foodCategory: {
    fontSize: 14,
    color: '#8898AA',
    marginTop: 4,
  },
  macrosContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  macroItem: {
    marginRight: 16,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1F36',
  },
  macroLabel: {
    fontSize: 12,
    color: '#8898AA',
    marginTop: 2,
  },
  // New styles for selection button
  selectionButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  selectedButton: {
    backgroundColor: '#5E72E4',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING * 3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8898AA',
    marginTop: SPACING,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: SPACING / 2,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING * 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    minWidth: 150,
  },
  loadingText: {
    marginTop: SPACING,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F36',
  },
});

export default FoodListScreen;