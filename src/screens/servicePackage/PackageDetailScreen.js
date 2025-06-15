import { useState,useEffect,useRef,useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Animated,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native"
import HTML from "react-native-render-html"
import { LinearGradient } from "expo-linear-gradient"
import { trainerService } from "services/apiTrainerService"
import { useAuth } from "context/AuthContext"
import { Feather,Ionicons,MaterialCommunityIcons } from "@expo/vector-icons"
import DynamicStatusBar from "screens/statusBar/DynamicStatusBar"
import { theme } from "theme/color"

const { width,height } = Dimensions.get("window")

const PackageDetailScreen = ({ route,navigation }) => {
  const { package: initialPackage } = route.params || {}
  const { user } = useAuth()
  const [packageData,setPackageData] = useState(initialPackage || null)
  const [relatedPackages,setRelatedPackages] = useState([])
  const [loading,setLoading] = useState(true)
  const [loadingRelated,setLoadingRelated] = useState(false)
  const [error,setError] = useState(null)
  const [showFullDescription,setShowFullDescription] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    console.log("Initial Package:",JSON.stringify(initialPackage,null,2))

    // Enhanced entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim,{
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim,{
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim,{
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    return () => {
      fadeAnim.setValue(0)
      slideAnim.setValue(50)
      scaleAnim.setValue(0.9)
    }
  },[])

  const withTimeout = (promise,ms = 10000) => {
    return Promise.race([
      promise,
      new Promise((_,reject) => setTimeout(() => reject(new Error("Request timed out")),ms)),
    ])
  }

  const fetchPackageDetail = useCallback(async () => {
    if (!initialPackage?.packageId) {
      console.warn("Invalid initialPackage or missing packageId")
      setError("Invalid package data provided.")
      setLoading(false)
      Alert.alert("Error","Invalid package data provided.",[{ text: "OK",onPress: () => navigation.goBack() }])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await withTimeout(trainerService.getServicePackageById(initialPackage?.packageId))
      if (response.statusCode === 200 && response.data) {
        setPackageData(response.data)
        if (response.data.trainerId) {
          fetchRelatedPackages(response.data.trainerId,response.data.packageId)
        }
      } else {
        const errorMessage = response.message || "Unknown error occurred"
        console.warn("API Error:",errorMessage)
        setError(`Error ${response.statusCode}: ${errorMessage}`)
        setPackageData(null)
      }
    } catch (error) {
      const errorMessage = error.message || "An error occurred while loading package information"
      console.error("Fetch Error:",error)
      setError(`Error: ${errorMessage}`)
      setPackageData(null)
    } finally {
      setLoading(false)
    }
  },[initialPackage?.packageId,navigation])

  useEffect(() => {
    fetchPackageDetail()
  },[fetchPackageDetail])

  const fetchRelatedPackages = async (trainerId,currentPackageId) => {
    try {
      setLoadingRelated(true)
      const response = await withTimeout(
        trainerService.getAllActiveServicePackage({
          PageNumber: 1,
          PageSize: 4,
          TrainerId: trainerId,
        }),
      )
      if (response.statusCode === 200 && response.data?.packages) {
        const filtered = response.data.packages.filter((pkg) => pkg.packageId !== currentPackageId).slice(0,4)
        setRelatedPackages(filtered)
      } else {
        setRelatedPackages([])
      }
    } catch (error) {
      console.error("Error fetching related packages:",error)
      setRelatedPackages([])
    } finally {
      setLoadingRelated(false)
    }
  }

  const getPackageIcon = (packageName) => {
    if (!packageName) return "fitness"
    const name = packageName.toLowerCase()
    if (name.includes("yoga") || name.includes("meditation")) {
      return "yoga"
    } else if (name.includes("diet") || name.includes("nutrition")) {
      return "nutrition"
    } else if (name.includes("cardio") || name.includes("running")) {
      return "cardio"
    } else if (name.includes("strength") || name.includes("weight")) {
      return "strength"
    } else if (name.includes("wellness") || name.includes("mental")) {
      return "wellness"
    } else {
      return "fitness"
    }
  }

  const renderPackageIcon = (type,size = 32) => {
    const iconProps = { size,color: "#FFFFFF" }

    switch (type) {
      case "yoga":
        return <MaterialCommunityIcons name="yoga" {...iconProps} />
      case "nutrition":
        return <Ionicons name="nutrition" {...iconProps} />
      case "cardio":
        return <Ionicons name="heart" {...iconProps} />
      case "strength":
        return <MaterialCommunityIcons name="weight-lifter" {...iconProps} />
      case "wellness":
        return <MaterialCommunityIcons name="meditation" {...iconProps} />
      default:
        return <MaterialCommunityIcons name="dumbbell" {...iconProps} />
    }
  }

  const getPackageGradient = (type) => {
    switch (type) {
      case "yoga":
        return ["#10B981","#059669"]
      case "nutrition":
        return ["#F59E0B","#D97706"]
      case "cardio":
        return ["#EF4444","#DC2626"]
      case "strength":
        return ["#8B5CF6","#7C3AED"]
      case "wellness":
        return ["#06B6D4","#0891B2"]
      default:
        return ["#4F46E5","#3730A3"]
    }
  }

  const isHtml = (text) => {
    return /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(text || "")
  }

  const renderDescription = () => {
    if (!packageData?.description) {
      return (
        <View style={styles.descriptionEmpty}>
          <View style={styles.emptyIconContainer}>
            <Feather name="file-text" size={32} color="#94A3B8" />
          </View>
          <Text style={styles.descriptionEmptyTitle}>No Description</Text>
          <Text style={styles.descriptionEmptyText}>
            Detailed information about this package is not available at the moment.
          </Text>
        </View>
      )
    }

    const description = packageData.description
    const isLongText = description.length > 200
    const displayText = showFullDescription || !isLongText ? description : description.substring(0,200) + "..."

    if (isHtml(description)) {
      return (
        <View style={styles.descriptionContainer}>
          <HTML
            source={{ html: displayText }}
            contentWidth={width - 64}
            tagsStyles={{
              p: { marginBottom: 12,color: "#475569",fontSize: 16,lineHeight: 24 },
              li: { color: "#475569",fontSize: 16,marginBottom: 6,lineHeight: 24 },
              h1: { color: "#0F172A",fontSize: 22,fontWeight: "bold",marginVertical: 12 },
              h2: { color: "#0F172A",fontSize: 20,fontWeight: "bold",marginVertical: 10 },
              h3: { color: "#0F172A",fontSize: 18,fontWeight: "bold",marginVertical: 8 },
              a: { color: "#4F46E5",textDecorationLine: "underline" },
            }}
            ignoredTags={["script","style"]}
          />
          {isLongText && (
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={() => setShowFullDescription(!showFullDescription)}
            >
              <Text style={styles.readMoreText}>{showFullDescription ? "Show Less" : "Read More"}</Text>
              <Ionicons name={showFullDescription ? "chevron-up" : "chevron-down"} size={16} color="#4F46E5" />
            </TouchableOpacity>
          )}
        </View>
      )
    }

    return (
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>{displayText}</Text>
        {isLongText && (
          <TouchableOpacity style={styles.readMoreButton} onPress={() => setShowFullDescription(!showFullDescription)}>
            <Text style={styles.readMoreText}>{showFullDescription ? "Show Less" : "Read More"}</Text>
            <Ionicons name={showFullDescription ? "chevron-up" : "chevron-down"} size={16} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const handleCheckout = () => {
    if (!user?.userId) {
      Alert.alert("Login Required","Please log in to enroll in this package.",[
        { text: "Cancel",style: "cancel" },
        { text: "Login",onPress: () => navigation.navigate("Login") },
      ])
      return
    }
    if (!packageData?.price || packageData.price <= 0) {
      Alert.alert("Notice","Invalid service package price.")
      return
    }
    navigation.navigate("Payment",{
      packageId: packageData.packageId,
      packageName: packageData.packageName,
      price: packageData.price,
      trainerId: packageData.trainerId || null,
      trainerFullName: packageData.trainerFullName,
      userId: user.userId,
    })
  }

  const handleContact = () => {
    Alert.alert("Contact Trainer","Would you like to contact the trainer for more information?",[
      { text: "Cancel",style: "cancel" },
      { text: "Message",onPress: () => console.log("Open chat") },
      { text: "Call",onPress: () => console.log("Make call") },
    ])
  }

  const renderRelatedPackageItem = ({ item }) => {
    const packageType = getPackageIcon(item.packageName)
    const gradientColors = getPackageGradient(packageType)

    return (
      <TouchableOpacity
        style={styles.relatedPackageCard}
        onPress={() => navigation.push("PackageDetail",{ package: item })}
        activeOpacity={0.8}
      >
        <View style={styles.relatedCardContent}>
          <LinearGradient
            colors={gradientColors}
            style={styles.relatedIconContainer}
            start={{ x: 0,y: 0 }}
            end={{ x: 1,y: 1 }}
          >
            {renderPackageIcon(packageType,24)}
          </LinearGradient>

          <Text style={styles.relatedPackageName} numberOfLines={2}>
            {item.packageName || "Service Package"}
          </Text>

          <View style={styles.relatedPriceContainer}>
            <Text style={styles.relatedPackagePrice}>{item.price ? `$${item.price.toLocaleString()}` : "Contact"}</Text>
            <View style={styles.relatedDurationBadge}>
              <Ionicons name="time-outline" size={12} color="#64748B" />
              <Text style={styles.relatedDurationText}>{item.durationDays || "N/A"} days</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderRelatedPackages = () => {
    if (relatedPackages.length === 0 && !loadingRelated) return null

    return (
      <Animated.View
        style={[
          styles.relatedSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.relatedHeader}>
          <View style={styles.relatedTitleContainer}>
            <View style={styles.relatedTitleIcon}>
              <Ionicons name="grid-outline" size={20} color="#4F46E5" />
            </View>
            <View>
              <Text style={styles.relatedTitle}>More from this Trainer</Text>
              <Text style={styles.relatedSubtitle}>
                Other packages by {packageData?.trainerFullName || "this trainer"}
              </Text>
            </View>
          </View>
        </View>

        {loadingRelated ? (
          <View style={styles.relatedLoading}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.relatedLoadingText}>Loading related packages...</Text>
          </View>
        ) : (
          <FlatList
            data={relatedPackages.slice(0,3)}
            renderItem={renderRelatedPackageItem}
            keyExtractor={(item,index) => item.packageId?.toString() || `related-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedList}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          />
        )}

        {relatedPackages.length > 3 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() =>
              navigation.navigate("ServicePackages",{
                trainerId: packageData?.trainerId,
                trainerName: packageData?.trainerFullName,
              })
            }
          >
            <Text style={styles.viewAllText}>View All Packages</Text>
            <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </Animated.View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#4F46E5","#6366F1"]} style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
            <Text style={styles.loadingTitle}>Loading Package</Text>
            <Text style={styles.loadingText}>Please wait while we fetch the details...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    )
  }

  if (!packageData || error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <LinearGradient colors={["#FEF2F2","#FFFFFF"]} style={styles.errorContent}>
            <View style={styles.errorIconContainer}>
              <Feather name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Package Not Found</Text>
            <Text style={styles.errorText}>
              {error || "We couldn't find the information for this package. Please try again later."}
            </Text>
            <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
              <LinearGradient colors={["#4F46E5","#6366F1"]} style={styles.errorButtonGradient}>
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.errorButtonText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    )
  }

  const packageType = getPackageIcon(packageData.packageName)
  const gradientColors = getPackageGradient(packageType)

  return (
    <SafeAreaView style={styles.safeArea}>
      <DynamicStatusBar backgroundColor={theme.primaryColor} />

      {/* Enhanced Header */}
      <LinearGradient colors={["#4F46E5","#6366F1","#818CF8"]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Package Details</Text>
          <Text style={styles.headerSubtitle}>Health & Fitness</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={() => Alert.alert("Share","Share feature coming soon!")}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Enhanced Hero Section */}
        <Animated.View
          style={[
            styles.heroContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim },{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient colors={["#FFFFFF","#F8FAFC"]} style={styles.heroGradient}>
            <View style={styles.heroContent}>
              <LinearGradient
                colors={gradientColors}
                style={styles.heroIconContainer}
                start={{ x: 0,y: 0 }}
                end={{ x: 1,y: 1 }}
              >
                {renderPackageIcon(packageType,48)}
              </LinearGradient>

              <View style={styles.heroInfo}>
                <Text style={styles.packageName}>{packageData.packageName || "Service Package"}</Text>

                <View style={styles.tagContainer}>
                  <LinearGradient
                    colors={[`${gradientColors[0]}20`,`${gradientColors[1]}20`]}
                    style={styles.categoryTag}
                  >
                    <Text style={[styles.categoryTagText,{ color: gradientColors[0] }]}>
                      {packageType === "yoga"
                        ? "Yoga & Meditation"
                        : packageType === "nutrition"
                          ? "Nutrition & Diet"
                          : packageType === "cardio"
                            ? "Cardio & Fitness"
                            : packageType === "strength"
                              ? "Strength Training"
                              : packageType === "wellness"
                                ? "Mental Wellness"
                                : "General Fitness"}
                    </Text>
                  </LinearGradient>

                  <View style={[styles.statusTag,packageData.status === "Active" && styles.activeStatusTag]}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: packageData.status === "Active" ? "#10B981" : "#EF4444" },
                      ]}
                    />
                    <Text style={[styles.statusTagText,packageData.status === "Active" && styles.activeStatusText]}>
                      {packageData.status || "Unknown"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <LinearGradient colors={[`${gradientColors[0]}10`,`${gradientColors[1]}10`]} style={styles.priceContainer}>
              <View style={styles.priceHeader}>
                <Ionicons name="pricetag" size={20} color={gradientColors[0]} />
                <Text style={[styles.priceLabel,{ color: gradientColors[0] }]}>Package Price</Text>
              </View>
              <Text style={styles.priceValue}>
                {packageData.price ? `$${packageData.price.toLocaleString()}` : "Contact for Price"}
              </Text>
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={16} color="#64748B" />
                <Text style={styles.durationValue}>
                  {packageData.durationDays ? `${packageData.durationDays} days program` : "Duration varies"}
                </Text>
              </View>
            </LinearGradient>
          </LinearGradient>
        </Animated.View>

        {/* Enhanced Trainer Section */}
        <Animated.View
          style={[
            styles.trainerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <LinearGradient colors={gradientColors} style={styles.sectionIcon}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Your Personal Trainer</Text>
            </View>
          </View>

          <View style={styles.trainerCard}>
            <View style={styles.trainerAvatar}>
              {packageData.trainerAvatar ? (
                <Image source={{ uri: packageData.trainerAvatar }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={gradientColors} style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color="#FFFFFF" />
                </LinearGradient>
              )}
              <View style={styles.onlineIndicator} />
            </View>

            <View style={styles.trainerInfo}>
              <Text style={styles.trainerName}>{packageData.trainerFullName || "Professional Trainer"}</Text>
              <Text style={styles.trainerTitle}>Certified Health & Fitness Coach</Text>

              <View style={styles.trainerStats}>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.statText}>4.9</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color="#64748B" />
                  <Text style={styles.statText}>200+ clients</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <Ionicons name="trophy" size={16} color="#10B981" />
                  <Text style={styles.statText}>5+ years</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.contactTrainerBtn} onPress={handleContact}>
              <LinearGradient colors={gradientColors} style={styles.contactBtnGradient}>
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Enhanced Package Details */}
        <Animated.View
          style={[
            styles.detailsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <LinearGradient colors={gradientColors} style={styles.sectionIcon}>
                <Ionicons name="information-circle" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Package Information</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <LinearGradient colors={["#EEF2FF","#F8FAFC"]} style={styles.detailIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
              </LinearGradient>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Created Date</Text>
                <Text style={styles.detailValue}>
                  {packageData.createdDate
                    ? new Date(packageData.createdDate).toLocaleDateString("en-US",{
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    : "Not available"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <LinearGradient colors={["#F0FDF4","#F8FAFC"]} style={styles.detailIconContainer}>
                <Ionicons name="time-outline" size={20} color="#10B981" />
              </LinearGradient>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Program Duration</Text>
                <Text style={styles.detailValue}>
                  {packageData.durationDays ? `${packageData.durationDays} days` : "Flexible"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <LinearGradient colors={["#FEF3C7","#F8FAFC"]} style={styles.detailIconContainer}>
                <Ionicons name="fitness-outline" size={20} color="#F59E0B" />
              </LinearGradient>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fitness Level</Text>
                <Text style={styles.detailValue}>All Levels Welcome</Text>
              </View>
            </View>

            {packageData.updatedDate && (
              <View style={styles.detailItem}>
                <LinearGradient colors={["#F3E8FF","#F8FAFC"]} style={styles.detailIconContainer}>
                  <Ionicons name="refresh-outline" size={20} color="#8B5CF6" />
                </LinearGradient>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Last Updated</Text>
                  <Text style={styles.detailValue}>
                    {new Date(packageData.updatedDate).toLocaleDateString("en-US",{
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Enhanced Description Section */}
        <Animated.View
          style={[
            styles.descriptionSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <LinearGradient colors={gradientColors} style={styles.sectionIcon}>
                <Ionicons name="document-text" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>About This Package</Text>
            </View>
          </View>
          {renderDescription()}
        </Animated.View>

        {/* Enhanced Features Section */}
        {packageData.features && packageData.features.length > 0 && (
          <Animated.View
            style={[
              styles.featuresSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <LinearGradient colors={gradientColors} style={styles.sectionIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>What's Included</Text>
              </View>
            </View>

            <View style={styles.featuresGrid}>
              {packageData.features.map((feature,index) => (
                <View key={`feature-${index}`} style={styles.featureItem}>
                  <LinearGradient colors={["#F0FDF4","#FFFFFF"]} style={styles.featureIconContainer}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </LinearGradient>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Related Packages */}
        {renderRelatedPackages()}

        {/* Enhanced Action Buttons */}
        <Animated.View
          style={[
            styles.actionSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.primaryButton} onPress={handleCheckout} activeOpacity={0.8}>
            <LinearGradient colors={gradientColors} style={styles.buttonGradient}>
              <Ionicons name="card-outline" size={22} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Enroll Now</Text>
              <View style={styles.buttonBadge}>
                <Text style={styles.buttonBadgeText}>
                  ${packageData.price ? packageData.price.toLocaleString() : "0"}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleContact} activeOpacity={0.8}>
              <Ionicons name="chatbubble-outline" size={20} color={gradientColors[0]} />
              <Text style={[styles.secondaryButtonText,{ color: gradientColors[0] }]}>Contact Trainer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
              <Ionicons name="bookmark-outline" size={20} color={gradientColors[0]} />
              <Text style={[styles.secondaryButtonText,{ color: gradientColors[0] }]}>Save Package</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.primaryColor,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 16 : 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
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
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    marginTop: 15,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  heroContainer: {
    margin: 20,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGradient: {
    paddingBottom: 50,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
    lineHeight: 34,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryTagText: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeStatusTag: {
    backgroundColor: "#F0FDF4",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTagText: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "600",
  },
  activeStatusText: {
    color: "#10B981",
  },
  priceContainer: {
    borderRadius: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.1)",
  },
  priceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  durationValue: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  trainerSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  trainerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  trainerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 20,
    overflow: "hidden",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  trainerTitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
    fontWeight: "500",
  },
  trainerStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statSeparator: {
    width: 1,
    height: 12,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  contactTrainerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  contactBtnGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  detailsGrid: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "600",
  },
  descriptionSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  descriptionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#475569",
  },
  readMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 8,
    gap: 6,
  },
  readMoreText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
  },
  descriptionEmpty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  descriptionEmptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  descriptionEmptyText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
  featuresSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  featuresGrid: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: "#334155",
    flex: 1,
    fontWeight: "500",
  },
  relatedSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  relatedHeader: {
    marginBottom: 20,
  },
  relatedTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  relatedTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  relatedTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  relatedSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  relatedLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  relatedLoadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  relatedList: {
    paddingLeft: 0,
  },
  relatedPackageCard: {
    width: (width - 64) / 2.5,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  relatedCardContent: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
  },
  relatedIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  relatedPackageName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
    minHeight: 40,
  },
  relatedPriceContainer: {
    alignItems: "center",
    gap: 8,
  },
  relatedPackagePrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4F46E5",
  },
  relatedDurationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  relatedDurationText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  viewAllText: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "700",
  },
  actionSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0,height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
    position: "relative",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  buttonBadge: {
    position: "absolute",
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  buttonBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  errorContent: {
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#EF4444",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  errorButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  errorButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bottomSpacing: {
    height: 40,
  },
})

export default PackageDetailScreen
