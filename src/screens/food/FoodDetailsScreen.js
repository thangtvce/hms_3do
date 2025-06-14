import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform, // Add Platform import
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SPACING = 16;

const FoodDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { food } = route.params;
  const [isInCart, setIsInCart] = useState(false);

  const toggleCart = () => {
    setIsInCart(!isInCart);
  };

  const nutritionItems = [
    { name: 'Calories', value: `${food.calories} kcal`, icon: 'local-fire-department' },
    { name: 'Protein', value: `${food.protein || 0}g`, icon: 'fitness-center' },
    { name: 'Carbs', value: `${food.carbs || 0}g`, icon: 'grain' },
    { name: 'Fats', value: `${food.fats || 0}g`, icon: 'opacity' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: food.image }} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.imageFade}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.3 }}
          />
        </View>
        
        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Food Title and Category */}
          <View style={styles.titleContainer}>
            <View>
              <Text style={styles.categoryLabel}>{food.categoryName}</Text>
              <Text style={styles.foodTitle}>{food.foodName}</Text>
            </View>
            <View style={styles.caloriesBadge}>
              <Text style={styles.caloriesText}>{food.calories} kcal</Text>
            </View>
          </View>
          
          {/* Nutrition Facts */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Nutrition Facts</Text>
            <View style={styles.nutritionGrid}>
              {nutritionItems.map((item, index) => (
                <View style={styles.nutritionItem} key={`nutrition-${index}`}>
                  <View style={styles.nutritionIconContainer}>
                    <Icon name={item.icon} size={24} color="#5E72E4" />
                  </View>
                  <Text style={styles.nutritionValue}>{item.value}</Text>
                  <Text style={styles.nutritionName}>{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {food.description || `${food.foodName} is a delicious and nutritious option with ${food.calories} calories. It contains ${food.protein || 0}g of protein, ${food.carbs || 0}g of carbohydrates, and ${food.fats || 0}g of fats.`}
            </Text>
          </View>
          
          {/* Ingredients */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {(food.ingredients || ['Ingredient 1', 'Ingredient 2', 'Ingredient 3']).map((ingredient, index) => (
                <View style={styles.ingredientItem} key={`ingredient-${index}`}>
                  <Icon name="check-circle" size={16} color="#5E72E4" />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Preparation */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Preparation</Text>
            <Text style={styles.descriptionText}>
              {food.preparation || "This dish is prepared with care using fresh ingredients. Follow the cooking instructions for best results."}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.addToCartButton, isInCart && styles.removeFromCartButton]}
          onPress={toggleCart}
        >
          <LinearGradient
            colors={isInCart ? ['#FF5E5E', '#FF3A3A'] : ['#5E72E4', '#825EE4']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon 
              name={isInCart ? "remove-shopping-cart" : "add-shopping-cart"} 
              size={22} 
              color="#FFFFFF" 
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              {isInCart ? "Remove from Selection" : "Add to Selection"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8F9FC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: SPACING,
    paddingTop: SPACING * 2,
    paddingBottom: 100, // Space for bottom bar
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING * 2,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#5E72E4',
    fontWeight: '600',
    marginBottom: 4,
  },
  foodTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1F36',
    maxWidth: width * 0.7,
  },
  caloriesBadge: {
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  caloriesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5E72E4',
  },
  sectionContainer: {
    marginBottom: SPACING * 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: SPACING,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING,
    marginBottom: SPACING,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nutritionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 2,
  },
  nutritionName: {
    fontSize: 14,
    color: '#8898AA',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A5568',
  },
  ingredientsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F7',
  },
  ingredientText: {
    fontSize: 16,
    color: '#4A5568',
    marginLeft: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: SPACING,
    paddingVertical: SPACING,
    paddingBottom: Platform.OS === 'ios' ? SPACING * 2 : SPACING,
  },
  addToCartButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  removeFromCartButton: {
    // Style differences for when item is in cart
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FoodDetailsScreen;