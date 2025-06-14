import React,{ useCallback,useMemo,useState,useEffect,useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import apiUserService from "services/apiUserService";
import { AuthContext } from "context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const SPACING = 16;

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(20)).current;

  const [currentDate] = useState(new Date());
  const [activeIcon,setActiveIcon] = useState("Profile");
  const [dashboardData,setDashboardData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
  const [refreshing,setRefreshing] = useState(false);

  const daysOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const currentDayIndex = currentDate.getDay();

  const defaultSummary = {
    nutritionSummary: {
      consumedCalories: 875,
      remainingCalories: 1328,
      totalCalories: 2203,
      macros: {
        carbs: { value: 98,target: 219,unit: "g",color: "#4F46E5" },
        protein: { value: 87,target: 117,unit: "g",color: "#10B981" },
        fats: { value: 35,target: 75,unit: "g",color: "#F59E0B" },
      },
    },
    activitySummary: { burnedCalories: 379,steps: 6842,target: 10000 },
    mealPlans: [
      {
        plan_name: "Balanced Diet",
        daily_calories: 2200,
        meal_frequency: 3,
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      },
      {
        plan_name: "High Protein",
        daily_calories: 2400,
        meal_frequency: 4,
        image:
          "https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      },
    ],
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const formatLastLogin = (lastLogin) => {
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const fetchUserData = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      const userData = await apiUserService.getUserById(user?.userId);
      const avatar = userData.data.avatar;
      if (avatar) {
        await AsyncStorage.setItem("userAvatar",avatar);
      }
      setDashboardData({
        user: userData.data,
        ...defaultSummary,
      });
    } catch (err) {
      setError("Failed to load user data. Please try again later.");
      console.log("Error fetching user data:",err);
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchUserData();

    Animated.parallel([
      Animated.timing(fadeAnim,{
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY,{
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  },[fadeAnim,translateY,user?.userId]);

  const getGreeting = useCallback(() => {
    const hour = currentDate.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  },[currentDate]);

  const handleNavigation = useCallback(
    (route) => {
      if (route) {
        setActiveIcon(route);
        navigation.navigate(route);
      } else {
        Alert.alert("Coming Soon","This feature will be available soon!");
      }
    },
    [navigation],
  );

  const discoverItems = useMemo(
    () => [
      {
        title: "Profile",
        icon: "user",
        route: "Profile",
        gradient: ["#4F46E5","#7C3AED"],
        badge: null,
      },
      {
        title: "Recipes",
        icon: "book-open",
        route: "Recipes",
        gradient: ["#10B981","#059669"],
        badge: 3,
      },
      {
        title: "Workouts",
        icon: "activity",
        route: "Workouts",
        gradient: ["#F59E0B","#D97706"],
        badge: null,
      },
      {
        title: "Community",
        icon: "users",
        route: "Community",
        gradient: ["#EC4899","#DB2777"],
        badge: 5,
      },
      {
        title: "Food",
        icon: "coffee",
        route: "Food",
        gradient: ["#3B82F6","#2563EB"],
        badge: null,
      },
      {
        title: "Payment",
        icon: "credit-card",
        route: "Payment",
        gradient: ["#8B5CF6","#7C3AED"],
        badge: null,
      },
    ],
    [],
  );

  const renderDiscoverItem = (item,index) => {
    const isActive = activeIcon === item.title;

    return (
      <TouchableOpacity
        key={index}
        style={[styles.discoverItem,isActive && styles.activeDiscoverItem]}
        onPress={() => handleNavigation(item.route)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={item.gradient}
          style={styles.discoverIconContainer}
          start={{ x: 0,y: 0 }}
          end={{ x: 1,y: 1 }}
        >
          <Feather name={item.icon} size={24} color="#FFFFFF" />
          {item.badge && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </LinearGradient>
        <Text style={[styles.discoverTitle,isActive && styles.activeDiscoverTitle]}>{item.title}</Text>
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  const CalorieCircle = ({ consumed,remaining,total }) => {
    const percentage = (consumed / total) * 100;

    return (
      <View style={styles.calorieCircleContainer}>
        <View style={styles.calorieCircle}>
          <View style={styles.calorieProgress}>
            <LinearGradient
              colors={["#4F46E5","#7C3AED"]}
              style={[styles.calorieProgressFill,{ width: `${percentage}%` }]}
              start={{ x: 0,y: 0 }}
              end={{ x: 1,y: 0 }}
            />
          </View>
          <View style={styles.calorieTextContainer}>
            <Text style={styles.calorieRemaining}>{remaining}</Text>
            <Text style={styles.calorieUnit}>cal left</Text>
          </View>
          <View style={styles.calorieDetails}>
            <View style={styles.calorieDetailItem}>
              <View style={[styles.calorieDetailDot,{ backgroundColor: "#4F46E5" }]} />
              <Text style={styles.calorieDetailLabel}>Consumed</Text>
              <Text style={styles.calorieDetailValue}>{consumed} cal</Text>
            </View>
            <View style={styles.calorieDetailItem}>
              <View style={[styles.calorieDetailDot,{ backgroundColor: "#E5E7EB" }]} />
              <Text style={styles.calorieDetailLabel}>Remaining</Text>
              <Text style={styles.calorieDetailValue}>{remaining} cal</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const MacroProgress = ({ name,color,value,target,unit }) => {
    const percentage = Math.min((value / target) * 100,100);

    return (
      <View style={styles.macroItem}>
        <View style={styles.macroHeader}>
          <Text style={styles.macroName}>{name}</Text>
          <Text style={styles.macroValue}>
            <Text style={{ color,fontWeight: "700" }}>{value}</Text>
            <Text style={{ color: "#64748B" }}>
              /{target} {unit}
            </Text>
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <LinearGradient
            colors={[color,color]}
            style={[styles.progressBar,{ width: `${percentage}%` }]}
            start={{ x: 0,y: 0 }}
            end={{ x: 1,y: 0 }}
          />
        </View>
      </View>
    );
  };

  const MealItem = ({ meal }) => (
    <View style={styles.mealCard}>
      <Image source={{ uri: meal.image }} style={styles.mealImage} resizeMode="cover" />
      <View style={styles.mealContent}>
        <View>
          <Text style={styles.mealTitle}>{meal.type}</Text>
          <Text style={styles.mealSubtitle}>{meal.recommended}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => handleNavigation("Food")}>
          <LinearGradient
            colors={["#4F46E5","#7C3AED"]}
            style={styles.addButtonGradient}
            start={{ x: 0,y: 0 }}
            end={{ x: 1,y: 0 }}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Improved onRefresh function
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData(true);
  },[user?.userId]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchUserData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header with Avatar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: dashboardData?.user?.avatar }} style={styles.avatar} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerGreeting}>{getGreeting()}</Text>
            <Text style={styles.headerName}>{dashboardData?.user?.fullName}</Text>
            <Text style={styles.headerSubInfo}>
              {dashboardData?.user?.gender} • Age {dashboardData?.user?.birthDate ? calculateAge(dashboardData.user.birthDate) : 'N/A'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleNavigation("Notifications")}>
            <Feather name="bell" size={22} color="#1E293B" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleNavigation("Settings")}>
            <Feather name="settings" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4F46E5"]}
            tintColor="#4F46E5"
            progressBackgroundColor="#FFFFFF"
            progressViewOffset={0}
          />
        }
        // Improved scroll performance
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
        getItemLayout={undefined}
      >
        {dashboardData && (
          <>
            {/* Welcome Card with Gradient */}
            <Animated.View
              style={[styles.welcomeCardContainer,{ opacity: fadeAnim,transform: [{ translateY: translateY }] }]}
            >
              <LinearGradient
                colors={["#4F46E5","#7C3AED"]}
                style={styles.welcomeCard}
                start={{ x: 0,y: 0 }}
                end={{ x: 1,y: 1 }}
              >
                <View style={styles.welcomeContent}>
                  <Text style={styles.welcomeTitle}>Welcome back, {dashboardData.user.fullName.split(" ")[0]}!</Text>
                  <Text style={styles.welcomeSubtitle}>Last login: {formatLastLogin(dashboardData.user.lastLogin)}</Text>
                  <Text style={styles.welcomeSubtitle}>Track nutrition & hit your goals!</Text>
                </View>
                <View style={styles.welcomeStatsContainer}>
                  <View style={styles.welcomeStatItem}>
                    <Text style={styles.welcomeStatValue}>{dashboardData.activitySummary.steps}</Text>
                    <Text style={styles.welcomeStatLabel}>Steps</Text>
                  </View>
                  <View style={styles.welcomeStatDivider} />
                  <View style={styles.welcomeStatItem}>
                    <Text style={styles.welcomeStatValue}>{dashboardData.activitySummary.burnedCalories}</Text>
                    <Text style={styles.welcomeStatLabel}>Calories Burned</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Weekly Progress Calendar */}
            <Animated.View style={[styles.section,{ opacity: fadeAnim,transform: [{ translateY: translateY }] }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Weekly Progress</Text>
                <TouchableOpacity onPress={() => handleNavigation("Calendar")}>
                  <Text style={styles.sectionAction}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.calendarCard}>
                {daysOfWeek.map((day,index) => {
                  const isActive = index === currentDayIndex;
                  const date = new Date();
                  date.setDate(currentDate.getDate() - (currentDayIndex - index));

                  return (
                    <View key={index} style={styles.dayColumn}>
                      <Text style={[styles.dayText,isActive && styles.activeDayText]}>{day}</Text>
                      <View style={[styles.dateCircle,isActive && styles.activeDateCircle]}>
                        <Text style={[styles.dateText,isActive && styles.activeDateText]}>{date.getDate()}</Text>
                      </View>
                      <View
                        style={[
                          styles.progressIndicator,
                          { height: Math.random() * 30 + 10 },
                          isActive && styles.activeProgressIndicator,
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Calories Summary */}
            <Animated.View style={[styles.section,{ opacity: fadeAnim,transform: [{ translateY: translateY }] }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Calories Summary</Text>
                <TouchableOpacity onPress={() => handleNavigation("Nutrition")}>
                  <Text style={styles.sectionAction}>Details</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.calorieCard}>
                <CalorieCircle
                  consumed={dashboardData.nutritionSummary.consumedCalories}
                  remaining={dashboardData.nutritionSummary.remainingCalories}
                  total={dashboardData.nutritionSummary.totalCalories}
                />
              </View>
            </Animated.View>

            {/* Macros Breakdown */}
            <Animated.View style={[styles.section,{ opacity: fadeAnim,transform: [{ translateY: translateY }] }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Macros Breakdown</Text>
                <TouchableOpacity onPress={() => handleNavigation("Macros")}>
                  <Text style={styles.sectionAction}>Details</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.macrosCard}>
                {Object.entries(dashboardData.nutritionSummary.macros).map(([key,macro],index) => (
                  <MacroProgress
                    key={key}
                    name={key.charAt(0).toUpperCase() + key.slice(1)}
                    color={macro.color}
                    value={macro.value}
                    target={macro.target}
                    unit={macro.unit}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Explore More - Horizontal Scrollable Icons */}
            <Animated.View style={[styles.section,{ opacity: fadeAnim,transform: [{ translateY: translateY }] }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Access</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.discoverScroll}
                decelerationRate="fast"
                snapToInterval={100}
              >
                {discoverItems.map((item,index) => renderDiscoverItem(item,index))}
              </ScrollView>
            </Animated.View>

            {/* Meal Plans */}
            <Animated.View style={[styles.section,{ opacity: fadeAnim,transform: [{ translateY: translateY }] }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Meal Plans</Text>
                <TouchableOpacity onPress={() => handleNavigation("MealPlans")}>
                  <Text style={styles.sectionAction}>View All</Text>
                </TouchableOpacity>
              </View>
              {dashboardData.mealPlans.map((meal,index) => (
                <MealItem
                  key={index}
                  meal={{
                    type: meal.plan_name,
                    recommended: `${Math.round(meal.daily_calories / meal.meal_frequency)} Cal per meal`,
                    image: meal.image,
                  }}
                />
              ))}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  headerTextContainer: {
    justifyContent: "center",
  },
  headerGreeting: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  headerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EF4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  welcomeCardContainer: {
    marginHorizontal: SPACING,
    marginTop: SPACING,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: SPACING,
  },
  welcomeContent: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
  },
  welcomeStatsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
  },
  welcomeStatItem: {
    flex: 1,
    alignItems: "center",
  },
  welcomeStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  welcomeStatLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  welcomeStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 8,
  },
  section: {
    paddingHorizontal: SPACING,
    marginTop: SPACING * 1.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  calendarCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  dayColumn: {
    alignItems: "center",
    flex: 1,
  },
  dayText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 8,
  },
  activeDayText: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    marginBottom: 8,
  },
  activeDateCircle: {
    backgroundColor: "#4F46E5",
  },
  dateText: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  activeDateText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  progressIndicator: {
    width: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
  },
  activeProgressIndicator: {
    backgroundColor: "#4F46E5",
  },
  calorieCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  calorieCircleContainer: {
    alignItems: "center",
  },
  calorieCircle: {
    width: "100%",
    alignItems: "center",
  },
  calorieProgress: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    width: "100%",
    marginBottom: 16,
    overflow: "hidden",
  },
  calorieProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  calorieTextContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  calorieRemaining: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
  },
  calorieUnit: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  calorieDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  calorieDetailItem: {
    alignItems: "center",
    flexDirection: "row",
  },
  calorieDetailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  calorieDetailLabel: {
    fontSize: 14,
    color: "#64748B",
    marginRight: 4,
  },
  calorieDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  macrosCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  macroItem: {
    marginBottom: 16,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  macroName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  macroValue: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  discoverScroll: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  discoverItem: {
    alignItems: "center",
    marginRight: 20,
    width: 80,
    position: "relative",
  },
  activeDiscoverItem: {
    transform: [{ scale: 1.05 }],
  },
  discoverIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    elevation: 4,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  discoverTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  activeDiscoverTitle: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -4,
    width: 20,
    height: 3,
    backgroundColor: "#4F46E5",
    borderRadius: 1.5,
  },
  badgeContainer: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  mealCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    overflow: "hidden",
    paddingBottom: 70,
  },
  mealImage: {
    width: "100%",
    height: 120,
  },
  mealContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  mealSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  addButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  addButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  headerSubInfo: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING,
    backgroundColor: "#F8FAFC",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});