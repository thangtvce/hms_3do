import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [currentDate] = React.useState(new Date());
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDayIndex = currentDate.getDay();

  // Dữ liệu giả lập (tương tự HomeTabs.js)
  const dashboardData = {
    user: { fullName: 'User' },
    nutritionSummary: {
      consumedCalories: 275,
      remainingCalories: 1928,
      macros: {
        carbs: { value: 58, target: 219, unit: 'g' },
        protein: { value: 67, target: 117, unit: 'g' },
        fats: { value: 75, target: 105, unit: 'g' },
      },
    },
    activitySummary: { burnedCalories: 79 },
    mealPlans: [
      {
        plan_name: 'Balanced Diet',
        daily_calories: 2200,
        meal_frequency: 3,
      },
    ],
  };

  // Lấy lời chào theo giờ
  const getGreeting = useCallback(() => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }, [currentDate]);

  // Xử lý điều hướng
  const handleNavigation = useCallback(
    (route) => {
      if (route) {
        navigation.navigate(route);
      } else {
        Alert.alert('Error', 'Route not implemented.');
      }
    },
    [navigation],
  );

  // Danh sách khám phá
  const discoverItems = useMemo(
    () => [
      { title: 'Profile', subtitle: 'View your profile', icon: 'user', route: 'Profile' },
      { title: 'Recipes', subtitle: 'Healthy meals', icon: 'book', route: 'Recipes' },
      { title: 'Workouts', subtitle: 'Stay active', icon: 'activity', route: 'Workouts' },
      { title: 'Community', subtitle: 'Get inspired', icon: 'message-circle', route: 'Community' },
    ],
    [],
  );

  // Danh sách bữa ăn
  const meals = useMemo(
    () =>
      dashboardData.mealPlans.map((plan) => ({
        type: plan.plan_name,
        recommended: `${Math.round(plan.daily_calories / plan.meal_frequency)} Cal`,
      })),
    [dashboardData.mealPlans],
  );

  // Render thẻ khám phá
  const renderDiscoverItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.discoverItem}
      onPress={() => handleNavigation(item.route)}
    >
      <View style={styles.discoverCard}>
        <View style={styles.discoverIconContainer}>
          <Feather name={item.icon} size={28} color="#2563EB" />
        </View>
        <Text style={styles.discoverTitle}>{item.title}</Text>
        <Text style={styles.discoverSubtitle}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  // Placeholder cho CalorieCircle
  const CalorieCircle = ({ consumed, remaining }) => (
    <View style={styles.calorieCircle}>
      <Text style={styles.calorieText}>{remaining} cal</Text>
      <Text style={styles.calorieLabel}>Remaining</Text>
    </View>
  );

  // Placeholder cho MacroProgress
  const MacroProgress = ({ name, color, value, target, unit }) => (
    <View style={styles.macroItem}>
      <Text style={styles.macroName}>{name}</Text>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${(value / target) * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.macroValue}>{value}/{target} {unit}</Text>
    </View>
  );

  // Placeholder cho MealItem
  const MealItem = ({ meal }) => (
    <View style={styles.mealCard}>
      <Text style={styles.mealTitle}>{meal.type}</Text>
      <Text style={styles.mealSubtitle}>{meal.recommended}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleNavigation('Food')}
      >
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('Info', 'Notifications not implemented.')}>
          <Feather name="bell" size={28} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {getGreeting()}, {dashboardData.user.fullName}!
        </Text>
        <TouchableOpacity onPress={() => handleNavigation('Settings')}>
          <Feather name="menu" size={28} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Your Health Journey</Text>
          <Text style={styles.welcomeSubtitle}>Track nutrition & hit your goals!</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <View style={styles.calendarCard}>
            {daysOfWeek.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text style={styles.dayText}>{day}</Text>
                <View
                  style={[
                    styles.dateCircle,
                    index === currentDayIndex && styles.activeDateCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      index === currentDayIndex && styles.activeDateText,
                    ]}
                  >
                    {currentDate.getDate() - (currentDayIndex - index)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today’s Stats</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.nutritionSummary.consumedCalories} cal</Text>
              <Text style={styles.statLabel}>Eaten</Text>
            </View>
            <View style={styles.statItem}>
              <CalorieCircle
                consumed={dashboardData.nutritionSummary.consumedCalories}
                remaining={dashboardData.nutritionSummary.remainingCalories}
              />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.activitySummary.burnedCalories} cal</Text>
              <Text style={styles.statLabel}>Burned</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macros Breakdown</Text>
          <View style={styles.macrosCard}>
            <MacroProgress
              name="Carbs"
              color="#2563EB"
              value={dashboardData.nutritionSummary.macros.carbs.value}
              target={dashboardData.nutritionSummary.macros.carbs.target}
              unit={dashboardData.nutritionSummary.macros.carbs.unit}
            />
            <MacroProgress
              name="Protein"
              color="#2563EB"
              value={dashboardData.nutritionSummary.macros.protein.value}
              target={dashboardData.nutritionSummary.macros.protein.target}
              unit={dashboardData.nutritionSummary.macros.protein.unit}
            />
            <MacroProgress
              name="Fats"
              color="#10B981"
              value={dashboardData.nutritionSummary.macros.fats.value}
              target={dashboardData.nutritionSummary.macros.fats.target}
              unit={dashboardData.nutritionSummary.macros.fats.unit}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore More</Text>
          <View style={styles.discoverGrid}>
            {discoverItems.map((item, index) => renderDiscoverItem(item, index))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Meal Plans</Text>
          {meals.map((meal, index) => (
            <MealItem key={index} meal={meal} style={styles.mealCard} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#E2E8F0',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  calendarCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 8,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  activeDateCircle: {
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#EA580C',
  },
  dateText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  activeDateText: {
    color: '#FFFFFF',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexWrap: 'wrap',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: width / 3 - 24,
    marginVertical: 8,
  },
  calorieCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  calorieLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  macrosCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  macroItem: {
    marginBottom: 12,
  },
  macroName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  macroValue: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  discoverItem: {
    width: '48%',
    marginBottom: 12,
  },
  discoverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  discoverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  discoverTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  discoverSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  mealSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});