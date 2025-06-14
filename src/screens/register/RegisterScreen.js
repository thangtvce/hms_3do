import { useState,useEffect,useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  SafeAreaView,
  Image,
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFonts,Inter_400Regular,Inter_600SemiBold,Inter_700Bold } from "@expo-google-fonts/inter"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DateTimePicker from "@react-native-community/datetimepicker"
import apiAuthService from "services/apiAuthService"
import apiProfileService from "services/apiProfileService"

const { width,height } = Dimensions.get("window")

const GENDER_OPTIONS = ["Male","Female","Other","Prefer not to say"]

export default function RegisterScreen() {
  const [currentStep,setCurrentStep] = useState(0)
  const [isLoading,setIsLoading] = useState(false)
  const [formData,setFormData] = useState({
    firstName: "",
    goals: [],
    bodyFatPercentage: "",
    activityLevel: "",
    dietaryPreference: "",
    fitnessGoal: "",
    birthDate: new Date(2000,0,1),
    gender: "",
    height: "",
    heightUnit: "cm",
    weight: "",
    weightUnit: "kg",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })

  const [errors,setErrors] = useState({
    firstName: "",
    goals: "",
    bodyFatPercentage: "",
    activityLevel: "",
    dietaryPreference: "",
    fitnessGoal: "",
    birthDate: "",
    gender: "",
    height: "",
    weight: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })

  const [showPassword,setShowPassword] = useState(false)
  const [showConfirmPassword,setShowConfirmPassword] = useState(false)
  const [stepHistory,setStepHistory] = useState([0])
  const [showDatePicker,setShowDatePicker] = useState(false)
  const [showGenderOptions,setShowGenderOptions] = useState(false)

  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  const datePickerAnimation = useRef(new Animated.Value(0)).current
  const genderModalAnimation = useRef(new Animated.Value(0)).current

  const navigation = useNavigation()
  const scrollViewRef = useRef(null)

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem("registrationFormData")
        const savedStep = await AsyncStorage.getItem("registrationCurrentStep")

        if (savedData) {
          const parsedData = JSON.parse(savedData)
          if (parsedData.birthDate) {
            parsedData.birthDate = new Date(parsedData.birthDate)
          }
          setFormData(parsedData)
        }

        if (savedStep) {
          const step = Number.parseInt(savedStep)
          setCurrentStep(step)
          setStepHistory([...Array(step).keys(),step])
        }
      } catch (error) {
        console.log("Error loading saved data:",error)
      }
    }

    loadSavedData()
  },[])

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("registrationFormData",JSON.stringify(formData))
        await AsyncStorage.setItem("registrationCurrentStep",currentStep.toString())
      } catch (error) {
        console.log("Error saving data:",error)
      }
    }

    saveData()
  },[formData,currentStep])

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim,{
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim,{
        toValue: -50,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim,{
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim,{
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  },[currentStep])

  useEffect(() => {
    if (showDatePicker) {
      Animated.timing(datePickerAnimation,{
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(datePickerAnimation,{
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  },[showDatePicker])

  useEffect(() => {
    if (showGenderOptions) {
      Animated.timing(genderModalAnimation,{
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(genderModalAnimation,{
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  },[showGenderOptions])

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    )
  }

  const handleChange = (field,value) => {
    setFormData((prev) => ({ ...prev,[field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev,[field]: "" }))
    }
  }

  const handleToggle = (field,item) => {
    setFormData((prev) => {
      const currentItems = prev[field]
      const newItems = currentItems.includes(item) ? currentItems.filter((i) => i !== item) : [...currentItems,item]

      return { ...prev,[field]: newItems }
    })

    if (errors[field]) {
      setErrors((prev) => ({ ...prev,[field]: "" }))
    }
  }

  const handleSelect = (field,value) => {
    setFormData((prev) => ({ ...prev,[field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev,[field]: "" }))
    }
  }

  const handleDateChange = (event,selectedDate) => {
    if (selectedDate) {
      setFormData((prev) => ({ ...prev,birthDate: selectedDate }))
      if (errors.birthDate) {
        setErrors((prev) => ({ ...prev,birthDate: "" }))
      }
    }
  }

  const handleGenderSelect = (gender) => {
    setFormData((prev) => ({ ...prev,gender }))
    setShowGenderOptions(false)
    if (errors.gender) {
      setErrors((prev) => ({ ...prev,gender: "" }))
    }
  }

  const formatDate = (date) => {
    if (!date) return ""
    const day = date.getDate().toString().padStart(2,"0")
    const month = (date.getMonth() + 1).toString().padStart(2,"0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const calculateAge = (birthDate) => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const validateCurrentStep = () => {
    let isValid = true
    const newErrors = { ...errors }

    switch (currentStep) {
      case 0:
        if (!formData.firstName.trim()) {
          newErrors.firstName = "Please enter your name"
          isValid = false
        } else if (formData.firstName.length > 50) {
          newErrors.firstName = "Name cannot exceed 50 characters"
          isValid = false
        }
        break

      case 1:
        if (formData.goals.length === 0) {
          newErrors.goals = "Please select at least one goal"
          isValid = false
        } else if (formData.goals.length > 3) {
          newErrors.goals = "Please select up to three goals only"
          isValid = false
        }
        break

      case 2:
        if (!formData.bodyFatPercentage) {
          newErrors.bodyFatPercentage = "Please enter your body fat percentage"
          isValid = false
        } else if (isNaN(Number.parseFloat(formData.bodyFatPercentage))) {
          newErrors.bodyFatPercentage = "Please enter a valid number"
          isValid = false
        } else if (
          Number.parseFloat(formData.bodyFatPercentage) < 0 ||
          Number.parseFloat(formData.bodyFatPercentage) > 100
        ) {
          newErrors.bodyFatPercentage = "Body fat percentage must be between 0 and 100"
          isValid = false
        }
        break

      case 3: // Activity Level step
        if (!formData.activityLevel) {
          newErrors.activityLevel = "Please select your activity level"
          isValid = false
        }
        break

      case 4: // Dietary Preference step
        if (!formData.dietaryPreference) {
          newErrors.dietaryPreference = "Please select your dietary preference"
          isValid = false
        }
        break

      case 5: // Fitness Goal step
        if (!formData.fitnessGoal) {
          newErrors.fitnessGoal = "Please select your fitness goal"
          isValid = false
        }
        break

      case 9: // Personal information step
        if (!formData.birthDate) {
          newErrors.birthDate = "Please select your birth date"
          isValid = false
        } else {
          const today = new Date()
          const age = calculateAge(formData.birthDate)

          if (formData.birthDate > today) {
            newErrors.birthDate = "Birth date cannot be in the future"
            isValid = false
          } else if (age < 13) {
            newErrors.birthDate = "You must be at least 13 years old"
            isValid = false
          } else if (age > 120) {
            newErrors.birthDate = "Please enter a valid birth date"
            isValid = false
          }
        }

        if (!formData.gender) {
          newErrors.gender = "Please select your gender"
          isValid = false
        }

        if (!formData.height) {
          newErrors.height = "Please enter your height"
          isValid = false
        } else if (isNaN(Number.parseFloat(formData.height))) {
          newErrors.height = "Please enter a valid number for height"
          isValid = false
        } else if (
          formData.heightUnit === "cm" &&
          (Number.parseFloat(formData.height) < 50 || Number.parseFloat(formData.height) > 300)
        ) {
          newErrors.height = "Please enter a valid height between 50cm and 300cm"
          isValid = false
        }

        if (!formData.weight) {
          newErrors.weight = "Please enter your weight"
          isValid = false
        } else if (isNaN(Number.parseFloat(formData.weight))) {
          newErrors.weight = "Please enter a valid number for weight"
          isValid = false
        } else if (
          formData.weightUnit === "kg" &&
          (Number.parseFloat(formData.weight) < 5 || Number.parseFloat(formData.weight) > 300)
        ) {
          newErrors.weight = "Please enter a valid weight between 5kg and 300kg"
          isValid = false
        }
        break

      case 10: // Account setup step
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!formData.email) {
          newErrors.email = "Please enter your email"
          isValid = false
        } else if (!emailRegex.test(formData.email)) {
          newErrors.email = "Please enter a valid email address"
          isValid = false
        }

        if (!formData.password) {
          newErrors.password = "Please enter a password"
          isValid = false
        } else if (formData.password.length < 6) {
          newErrors.password = "Password must be at least 6 characters"
          isValid = false
        }

        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password"
          isValid = false
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match"
          isValid = false
        }

        if (!formData.phone) {
          newErrors.phone = "Please enter your phone number"
          isValid = false
        } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g,""))) {
          newErrors.phone = "Please enter a valid 10-digit phone number"
          isValid = false
        }
        break
    }

    setErrors(newErrors)
    return isValid
  }

  // Navigate to next step
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      setStepHistory([...stepHistory,nextStep])

      // Scroll to top when changing steps
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0,y: 0,animated: true })
      }
    }
  }

  // Navigate to previous step
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      const newHistory = [...stepHistory]
      newHistory.pop()
      const prevStep = newHistory[newHistory.length - 1]

      setCurrentStep(prevStep)
      setStepHistory(newHistory)

      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0,y: 0,animated: true })
      }
    } else {
      navigation.navigate("Login")
    }
  }

  const handleRegister = async () => {
    if (!validateCurrentStep()) {
      return
    }

    setIsLoading(true)

    try {
      const register = {
        username: formData.email,
        password: formData.password,
        roles: ["User"],
        fullName: formData.firstName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        birthDate: formData.birthDate.toISOString().split("T")[0],
      }

      const dataRegister = await apiAuthService.register(register)
      if (!dataRegister || dataRegister.statusCode !== 200) {
        if (dataRegister?.statusCode === 400 && dataRegister.errors) {
          const errorMessages = Object.entries(dataRegister.errors)
            .map(([field,messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n")
          throw new Error(`Registration failed:\n${errorMessages}`)
        }
        throw new Error("Registration failed: Invalid user data returned.")
      }

      const heightInMeters = formData.height / 100
      const weightInKg = formData.weight
      const bmi = weightInKg / (heightInMeters * heightInMeters)
      const profile = {
        userId: dataRegister?.data?.userId,
        profileId: 0,
        height: Number.parseFloat(formData.height),
        weight: Number.parseFloat(formData.weight),
        bmi: Number(bmi.toFixed(2)),
        bodyFatPercentage: Number.parseFloat(formData.bodyFatPercentage) || 0,
        activityLevel: formData.activityLevel || "Moderate",
        dietaryPreference: formData.dietaryPreference || "Balanced",
        fitnessGoal: formData.fitnessGoal || "Maintain",
      }

      const responseAddProfile = await apiProfileService.registerProfile(profile)
      if (!responseAddProfile || responseAddProfile.statusCode !== 201) {
        if (responseAddProfile?.statusCode === 400 && responseAddProfile.errors) {
          const errorMessages = Object.entries(responseAddProfile.errors)
            .map(([field,messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n")
          throw new Error(`Profile creation failed:\n${errorMessages}`)
        }
        throw new Error("Profile creation failed: Invalid response.")
      }

      await Promise.all([
        AsyncStorage.removeItem("registrationFormData"),
        AsyncStorage.removeItem("registrationCurrentStep"),
      ])

      const successMessage = `Your account has been created successfully!. Please check your email to verify your account.`
      Alert.alert("Registration Successful",successMessage,[
        {
          text: "OK",
          onPress: () => navigation.replace("Login"),
        },
      ])
    } catch (error) {
      console.log("Registration error:",error?.message)
      let errorMessage = error?.message || "An unexpected error occurred. Please try again."
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors
        const newErrors = { ...errors }

        if (serverErrors.Email) newErrors.email = serverErrors.Email[0]
        if (serverErrors.Password) newErrors.password = serverErrors.Password[0]
        if (serverErrors.Phone) newErrors.phone = serverErrors.Phone[0]
        setErrors(newErrors)
        errorMessage = Object.entries(serverErrors)
          .map(([field,messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n")
      } else if (error.message.includes("Registration failed") || error.message.includes("Profile creation failed")) {
        errorMessage = error.message
      }

      Alert.alert("Registration Failed",errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const totalSteps = 11

  const renderStepIndicators = () => {
    return (
      <View style={styles.stepIndicatorsContainer}>
        {Array.from({ length: totalSteps }).map((_,index) => (
          <View key={index} style={[styles.stepIndicator,index <= currentStep ? styles.activeStepIndicator : {}]} />
        ))}
      </View>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <NameStep formData={formData} handleChange={handleChange} error={errors.firstName} />
      case 1:
        return (
          <GoalsStep formData={formData} handleToggle={(goal) => handleToggle("goals",goal)} error={errors.goals} />
        )
      case 2:
        return <BodyFatStep formData={formData} handleChange={handleChange} error={errors.bodyFatPercentage} />
      case 3:
        return (
          <ActivityLevelStep
            formData={formData}
            handleSelect={(level) => handleSelect("activityLevel",level)}
            error={errors.activityLevel}
          />
        )
      case 4:
        return (
          <DietaryPreferenceStep
            formData={formData}
            handleSelect={(preference) => handleSelect("dietaryPreference",preference)}
            error={errors.dietaryPreference}
          />
        )
      case 5:
        return (
          <FitnessGoalStep
            formData={formData}
            handleSelect={(goal) => handleSelect("fitnessGoal",goal)}
            error={errors.fitnessGoal}
          />
        )
      case 6:
        return <GoalsInfoStep formData={formData} />
      case 7:
        return <HabitsInfoStep formData={formData} />
      case 8:
        return <MealPlansInfoStep formData={formData} />
      case 9:
        return (
          <PersonalInfoStep
            formData={formData}
            handleChange={handleChange}
            handleSelect={handleSelect}
            setShowDatePicker={setShowDatePicker}
            setShowGenderOptions={setShowGenderOptions}
            formatDate={formatDate}
            calculateAge={calculateAge}
            errors={{
              birthDate: errors.birthDate,
              gender: errors.gender,
              height: errors.height,
              weight: errors.weight,
            }}
          />
        )
      case 10:
        return (
          <AccountSetupStep
            formData={formData}
            handleChange={handleChange}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            errors={{
              email: errors.email,
              password: errors.password,
              confirmPassword: errors.confirmPassword,
              phone: errors.phone,
            }}
          />
        )
      default:
        return null
    }
  }

  const getStepTitle = () => {
    const titles = [
      "Personal Information",
      "Your Goals",
      "Body Fat Percentage",
      "Activity Level",
      "Dietary Preference",
      "Fitness Goal",
      "Goals",
      "Habits",
      "Meal Plans",
      "Personal Information",
      "Set Up Account",
    ]

    return titles[currentStep] || "Registration"
  }

  const isFinalStep = currentStep === totalSteps - 1

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      <LinearGradient colors={["#4F46E5","#6366F1","#818CF8"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{getStepTitle()}</Text>

          <View style={styles.stepCounter}>
            <Text style={styles.stepCounterText}>
              {currentStep + 1}/{totalSteps}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar,{ width: `${((currentStep + 1) / totalSteps) * 100}%` }]} />
            </View>
            {renderStepIndicators()}
          </View>

          <Animated.View
            style={[
              styles.stepContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {renderStepContent()}
          </Animated.View>

          <View style={styles.navigationButtons}>
            <TouchableOpacity style={styles.prevButton} onPress={handlePreviousStep} accessibilityLabel="Previous step">
              <Ionicons name="arrow-back" size={24} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={isFinalStep ? handleRegister : handleNextStep}
              disabled={isLoading}
              accessibilityLabel={isFinalStep ? "Register" : "Next step"}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>{isFinalStep ? "Register" : "Next"}</Text>
                  {!isFinalStep && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.nextIcon} />}
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: datePickerAnimation,
              justifyContent: "center",
            },
          ]}
        >
          <TouchableOpacity style={styles.modalBackground} onPress={() => setShowDatePicker(false)} />
          <Animated.View
            style={[
              styles.modalContainer,
              styles.datePickerModalContainer,
              {
                transform: [
                  {
                    scale: datePickerAnimation.interpolate({
                      inputRange: [0,1],
                      outputRange: [0.8,1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Birth Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={formData.birthDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900,0,1)}
                style={styles.datePicker}
              />
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity style={styles.datePickerCancelButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.datePickerConfirmButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Gender Options Modal */}
      <Modal
        visible={showGenderOptions}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowGenderOptions(false)}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: genderModalAnimation,
            },
          ]}
        >
          <TouchableOpacity style={styles.modalBackground} onPress={() => setShowGenderOptions(false)} />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    translateY: genderModalAnimation.interpolate({
                      inputRange: [0,1],
                      outputRange: [300,0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderOptions(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {GENDER_OPTIONS.map((gender) => (
              <TouchableOpacity key={gender} style={styles.modalOption} onPress={() => handleGenderSelect(gender)}>
                <Text style={styles.modalOptionText}>{gender}</Text>
                {formData.gender === gender && <Ionicons name="checkmark" size={20} color="#4F46E5" />}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  )
}

// Step 1: Name Input
const NameStep = ({ formData,handleChange,error }) => {
  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Welcome to HealthTrack</Text>
      <Text style={styles.stepDescription}>Let's start by getting to know you. What's your name?</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Your Name</Text>
        <TextInput
          style={[styles.input,error ? styles.inputError : null]}
          value={formData.firstName}
          onChangeText={(value) => handleChange("firstName",value)}
          placeholder="Enter your name"
          placeholderTextColor="#94A3B8"
          maxLength={50}
          accessibilityLabel="Name input"
        />
        {error ? (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {error}
          </Text>
        ) : null}
      </View>

      <Text style={styles.tipText}>This helps us personalize your experience throughout the app.</Text>
    </View>
  )
}

// Step 2: Goals Selection
const GoalsStep = ({ formData,handleToggle,error }) => {
  const goalsOptions = [
    "Lose weight",
    "Maintain weight",
    "Gain weight",
    "Build muscle",
    "Improve diet",
    "Plan meals",
    "Manage stress",
    "Stay active",
  ]

  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Your Health Goals</Text>
      <Text style={styles.stepDescription}>
        Hello {formData.firstName || "there"}! Select up to three goals that are most important to you.
      </Text>

      {error ? (
        <Text style={styles.errorText}>
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {error}
        </Text>
      ) : null}

      <View style={styles.optionsContainer}>
        {goalsOptions.map((goal) => (
          <TouchableOpacity
            key={goal}
            style={[styles.optionButton,formData.goals.includes(goal) ? styles.selectedOptionButton : {}]}
            onPress={() => handleToggle(goal)}
            accessibilityLabel={`${goal} option`}
            accessibilityState={{ selected: formData.goals.includes(goal) }}
          >
            <Text style={[styles.optionText,formData.goals.includes(goal) ? styles.selectedOptionText : {}]}>
              {goal}
            </Text>
            <View style={formData.goals.includes(goal) ? styles.checkedBox : styles.uncheckedBox}>
              {formData.goals.includes(goal) && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.selectionCountText}>{formData.goals.length}/3 goals selected</Text>
    </View>
  )
}

// Step 3: Body Fat Percentage
const BodyFatStep = ({ formData,handleChange,error }) => {
  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Body Fat Percentage</Text>
      <Text style={styles.stepDescription}>
        Enter your body fat percentage to help us personalize your fitness recommendations.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Body Fat Percentage</Text>
        <View style={styles.unitInputContainer}>
          <TextInput
            style={[styles.unitInput,error ? styles.inputError : null]}
            value={formData.bodyFatPercentage}
            onChangeText={(value) => handleChange("bodyFatPercentage",value.replace(/[^0-9.]/g,""))}
            placeholder="Enter your body fat percentage"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={5}
            accessibilityLabel="Body fat percentage input"
          />
          <View style={styles.unitToggle}>
            <View style={[styles.unitButton,styles.unitButtonSelected]}>
              <Text style={[styles.unitButtonText,styles.unitButtonTextSelected]}>%</Text>
            </View>
          </View>
        </View>
        {error ? (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#4F46E5" />
        <Text style={styles.infoCardText}>
          If you don't know your exact body fat percentage, you can estimate it or use 15% for men and 25% for women as
          average values.
        </Text>
      </View>

      <View style={styles.bodyFatRangeContainer}>
        <Text style={styles.bodyFatRangeTitle}>Typical Body Fat Percentage Ranges:</Text>
        <View style={styles.bodyFatRangeItem}>
          <Text style={styles.bodyFatRangeLabel}>Essential fat:</Text>
          <Text style={styles.bodyFatRangeValue}>3-5% (men), 10-13% (women)</Text>
        </View>
        <View style={styles.bodyFatRangeItem}>
          <Text style={styles.bodyFatRangeLabel}>Athletes:</Text>
          <Text style={styles.bodyFatRangeValue}>6-13% (men), 14-20% (women)</Text>
        </View>
        <View style={styles.bodyFatRangeItem}>
          <Text style={styles.bodyFatRangeLabel}>Fitness:</Text>
          <Text style={styles.bodyFatRangeValue}>14-17% (men), 21-24% (women)</Text>
        </View>
        <View style={styles.bodyFatRangeItem}>
          <Text style={styles.bodyFatRangeLabel}>Average:</Text>
          <Text style={styles.bodyFatRangeValue}>18-24% (men), 25-31% (women)</Text>
        </View>
      </View>
    </View>
  )
}

// Step 4: Activity Level
const ActivityLevelStep = ({ formData,handleSelect,error }) => {
  const activityLevels = [
    { value: "Sedentary",description: "Little or no exercise, desk job" },
    { value: "Lightly Active",description: "Light exercise 1-3 days/week" },
    { value: "Moderately Active",description: "Moderate exercise 3-5 days/week" },
    { value: "Very Active",description: "Hard exercise 6-7 days/week" },
    { value: "Extremely Active",description: "Very hard exercise, physical job or training twice a day" },
  ]

  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Activity Level</Text>
      <Text style={styles.stepDescription}>
        Select the option that best describes your typical weekly activity level.
      </Text>

      {error ? (
        <Text style={styles.errorText}>
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {error}
        </Text>
      ) : null}

      <View style={styles.optionsContainer}>
        {activityLevels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[styles.optionButton,formData.activityLevel === level.value ? styles.selectedOptionButton : {}]}
            onPress={() => handleSelect(level.value)}
            accessibilityLabel={`${level.value} option`}
            accessibilityState={{ selected: formData.activityLevel === level.value }}
          >
            <View style={styles.activityLevelContent}>
              <Text
                style={[styles.optionText,formData.activityLevel === level.value ? styles.selectedOptionText : {}]}
              >
                {level.value}
              </Text>
              <Text style={styles.activityLevelDescription}>{level.description}</Text>
            </View>
            <View style={formData.activityLevel === level.value ? styles.checkedBox : styles.uncheckedBox}>
              {formData.activityLevel === level.value && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="fitness-outline" size={20} color="#4F46E5" />
        <Text style={styles.infoCardText}>
          Your activity level helps us calculate your daily calorie needs and create appropriate fitness
          recommendations.
        </Text>
      </View>
    </View>
  )
}

// Step 5: Dietary Preference
const DietaryPreferenceStep = ({ formData,handleSelect,error }) => {
  const dietaryPreferences = [
    "Standard",
    "Vegetarian",
    "Vegan",
    "Pescatarian",
    "Paleo",
    "Keto",
    "Mediterranean",
    "Low-carb",
    "Gluten-free",
    "Dairy-free",
  ]

  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Dietary Preference</Text>
      <Text style={styles.stepDescription}>
        Select the eating pattern that best describes your dietary preferences.
      </Text>

      {error ? (
        <Text style={styles.errorText}>
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {error}
        </Text>
      ) : null}

      <View style={styles.dietaryPreferencesContainer}>
        {dietaryPreferences.map((preference) => (
          <TouchableOpacity
            key={preference}
            style={[
              styles.dietaryPreferenceButton,
              formData.dietaryPreference === preference ? styles.selectedDietaryPreference : {},
            ]}
            onPress={() => handleSelect(preference)}
            accessibilityLabel={`${preference} option`}
            accessibilityState={{ selected: formData.dietaryPreference === preference }}
          >
            <Text
              style={[
                styles.dietaryPreferenceText,
                formData.dietaryPreference === preference ? styles.selectedDietaryPreferenceText : {},
              ]}
            >
              {preference}
            </Text>
            {formData.dietaryPreference === preference && (
              <Ionicons name="checkmark-circle" size={16} color="#4F46E5" style={styles.dietaryPreferenceIcon} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="nutrition-outline" size={20} color="#4F46E5" />
        <Text style={styles.infoCardText}>
          Your dietary preference helps us tailor nutrition recommendations and meal plans to your specific needs.
        </Text>
      </View>
    </View>
  )
}

// Step 6: Fitness Goal
const FitnessGoalStep = ({ formData,handleSelect,error }) => {
  const fitnessGoals = [
    { value: "Weight Loss",icon: "trending-down-outline" },
    { value: "Maintain",icon: "swap-horizontal-outline" },
    { value: "Muscle Gain",icon: "trending-up-outline" },
    { value: "Improve Endurance",icon: "pulse-outline" },
    { value: "Increase Strength",icon: "barbell-outline" },
    { value: "Improve Flexibility",icon: "body-outline" },
  ]

  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Fitness Goal</Text>
      <Text style={styles.stepDescription}>What is your primary fitness goal?</Text>

      {error ? (
        <Text style={styles.errorText}>
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {error}
        </Text>
      ) : null}

      <View style={styles.fitnessGoalsGrid}>
        {fitnessGoals.map((goal) => (
          <TouchableOpacity
            key={goal.value}
            style={[styles.fitnessGoalCard,formData.fitnessGoal === goal.value ? styles.selectedFitnessGoalCard : {}]}
            onPress={() => handleSelect(goal.value)}
            accessibilityLabel={`${goal.value} option`}
            accessibilityState={{ selected: formData.fitnessGoal === goal.value }}
          >
            <View
              style={[
                styles.fitnessGoalIconContainer,
                formData.fitnessGoal === goal.value ? styles.selectedFitnessGoalIconContainer : {},
              ]}
            >
              <Ionicons
                name={goal.icon}
                size={24}
                color={formData.fitnessGoal === goal.value ? "#FFFFFF" : "#4F46E5"}
              />
            </View>
            <Text
              style={[
                styles.fitnessGoalText,
                formData.fitnessGoal === goal.value ? styles.selectedFitnessGoalText : {},
              ]}
            >
              {goal.value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="trophy-outline" size={20} color="#4F46E5" />
        <Text style={styles.infoCardText}>
          Your fitness goal will help us create a personalized plan to achieve your desired results.
        </Text>
      </View>
    </View>
  )
}

// Step 7: Goals Info
const GoalsInfoStep = ({ formData }) => {
  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Your Goals Matter</Text>
      <Text style={styles.stepDescription}>
        We understand, {formData.firstName || "there"}. A busy lifestyle can get in the way of achieving your health
        goals.
      </Text>

      <View style={styles.infoCardLarge}>
        <Ionicons name="trophy" size={40} color="#4F46E5" style={styles.infoCardIcon} />
        <Text style={styles.infoCardTitle}>We've helped millions overcome obstacles</Text>
        <Text style={styles.infoCardDescription}>
          Our personalized approach has helped people just like you achieve their health goals despite busy schedules
          and other challenges.
        </Text>
      </View>

      <View style={styles.bulletPoints}>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.bulletText}>Personalized guidance</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.bulletText}>Realistic, achievable goals</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.bulletText}>Support when you need it</Text>
        </View>
      </View>
    </View>
  )
}

// Step 8: Habits Info
const HabitsInfoStep = ({ formData }) => {
  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Small Habits, Big Impact</Text>
      <Text style={styles.stepDescription}>
        Great choices, {formData.firstName || "there"}! Your selections will help us create a personalized health plan.
      </Text>

      <View style={styles.infoCardLarge}>
        <Ionicons name="fitness" size={40} color="#4F46E5" style={styles.infoCardIcon} />
        <Text style={styles.infoCardTitle}>Building Sustainable Habits</Text>
        <Text style={styles.infoCardDescription}>
          We'll guide you to small wins that add up to big results over time. Our approach focuses on consistency rather
          than perfection.
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>87%</Text>
          <Text style={styles.statLabel}>of users report improved habits within 30 days</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>92%</Text>
          <Text style={styles.statLabel}>say our approach is easier to maintain long-term</Text>
        </View>
      </View>
    </View>
  )
}

// Step 9: Meal Plans Info
const MealPlansInfoStep = ({ formData }) => {
  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Your Kitchen, Your Rules</Text>
      <Text style={styles.stepDescription}>
        We can simplify your life with customized, flexible meal plans that fit your lifestyle.
      </Text>

      <View style={styles.infoCardLarge}>
        <Ionicons name="restaurant" size={40} color="#4F46E5" style={styles.infoCardIcon} />
        <Text style={styles.infoCardTitle}>Personalized Meal Planning</Text>
        <Text style={styles.infoCardDescription}>
          Our meal plans adapt to your preferences, dietary needs, and schedule. You'll save time while eating
          healthier.
        </Text>
      </View>

      <View style={styles.featureGrid}>
        <View style={styles.featureItem}>
          <Ionicons name="time-outline" size={24} color="#4F46E5" />
          <Text style={styles.featureText}>Save time planning</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="cash-outline" size={24} color="#4F46E5" />
          <Text style={styles.featureText}>Reduce food waste</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="nutrition-outline" size={24} color="#4F46E5" />
          <Text style={styles.featureText}>Balanced nutrition</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="options-outline" size={24} color="#4F46E5" />
          <Text style={styles.featureText}>Flexible options</Text>
        </View>
      </View>
    </View>
  )
}

// Step 10: Personal Information (Updated)
const PersonalInfoStep = ({
  formData,
  handleChange,
  handleSelect,
  setShowDatePicker,
  setShowGenderOptions,
  formatDate,
  calculateAge,
  errors,
}) => {
  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        This helps us personalize your experience and calculate your nutritional needs.
      </Text>

      {/* Birth Date Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Birth Date</Text>
        <TouchableOpacity
          style={[
            styles.selectContainer,
            formData.birthDate ? styles.filledSelect : {},
            errors.birthDate ? styles.inputError : null,
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.selectContent}>
            <Ionicons name="calendar-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <Text style={[styles.selectText,!formData.birthDate && styles.placeholderText]}>
              {formData.birthDate
                ? `${formatDate(formData.birthDate)} (Age: ${calculateAge(formData.birthDate)})`
                : "Select birth date"}
            </Text>
          </View>
          <Ionicons name="calendar" size={20} color="#64748B" />
        </TouchableOpacity>
        {errors.birthDate ? (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {errors.birthDate}
          </Text>
        ) : null}
      </View>

      {/* Gender Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Gender</Text>
        <TouchableOpacity
          style={[
            styles.selectContainer,
            formData.gender ? styles.filledSelect : {},
            errors.gender ? styles.inputError : null,
          ]}
          onPress={() => setShowGenderOptions(true)}
        >
          <View style={styles.selectContent}>
            <Ionicons name="person-circle-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <Text style={[styles.selectText,!formData.gender && styles.placeholderText]}>
              {formData.gender || "Select gender"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#64748B" />
        </TouchableOpacity>
        {errors.gender ? (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {errors.gender}
          </Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Height</Text>
        <View style={styles.unitInputContainer}>
          <TextInput
            style={[styles.unitInput,errors.height ? styles.inputError : null]}
            value={formData.height}
            onChangeText={(value) => handleChange("height",value.replace(/[^0-9.]/g,""))}
            placeholder={`Enter your height in ${formData.heightUnit}`}
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={6}
            accessibilityLabel="Height input"
          />
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[styles.unitButton,formData.heightUnit === "cm" ? styles.unitButtonSelected : {}]}
              onPress={() => handleSelect("heightUnit","cm")}
              accessibilityLabel="Centimeters"
              accessibilityState={{ selected: formData.heightUnit === "cm" }}
            >
              <Text style={[styles.unitButtonText,formData.heightUnit === "cm" ? styles.unitButtonTextSelected : {}]}>
                cm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {errors.height ? (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {errors.height}
          </Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Weight</Text>
        <View style={styles.unitInputContainer}>
          <TextInput
            style={[styles.unitInput,errors.weight ? styles.inputError : null]}
            value={formData.weight}
            onChangeText={(value) => handleChange("weight",value.replace(/[^0-9.]/g,""))}
            placeholder={`Enter your weight in ${formData.weightUnit}`}
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={6}
            accessibilityLabel="Weight input"
          />
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[styles.unitButton,formData.weightUnit === "kg" ? styles.unitButtonSelected : {}]}
              onPress={() => handleSelect("weightUnit","kg")}
              accessibilityLabel="Kilograms"
              accessibilityState={{ selected: formData.weightUnit === "kg" }}
            >
              <Text style={[styles.unitButtonText,formData.weightUnit === "kg" ? styles.unitButtonTextSelected : {}]}>
                kg
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {errors.weight ? (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {errors.weight}
          </Text>
        ) : null}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#4F46E5" />
        <Text style={styles.infoCardText}>
          Your information is secure and will only be used to personalize your experience.
        </Text>
      </View>
    </View>
  )
}

// Step 11: Account Setup
const AccountSetupStep = ({
  formData,
  handleChange,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  errors,
}) => {
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0,label: "None",color: "#94A3B8" }

    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    const strengthMap = [
      { label: "Weak",color: "#EF4444" },
      { label: "Fair",color: "#F59E0B" },
      { label: "Good",color: "#10B981" },
      { label: "Strong",color: "#10B981" },
      { label: "Very Strong",color: "#10B981" },
    ]

    return {
      strength: strength,
      label: strengthMap[strength].label,
      color: strengthMap[strength].color,
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: "https://letankim.id.vn/3do/uploads/images/1747652554_3.png" }}
        style={styles.stepIcon}
        resizeMode="contain"
      />

      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepDescription}>You're almost done! Set up your account to save your progress.</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={[styles.iconInputContainer,errors.email ? styles.inputError : null]}>
          <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.iconInput}
            value={formData.email}
            onChangeText={(value) => handleChange("email",value)}
            placeholder="Enter your email"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Email input"
          />
        </View>
        {errors.email ? (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {errors.email}
          </Text>
        ) : null}
      </View>

      {/* Phone number field moved above password fields */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={[styles.iconInputContainer,errors.phone ? styles.inputError : null]}>
          <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.iconInput}
            value={formData.phone}
            onChangeText={(value) => handleChange("phone",value.replace(/[^0-9]/g,""))}
            placeholder="Enter your phone number"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={10}
            accessibilityLabel="Phone number input"
          />
        </View>
        {errors.phone ? (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {errors.phone}
          </Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={[styles.iconInputContainer,errors.password ? styles.inputError : null]}>
          <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.iconInput}
            value={formData.password}
            onChangeText={(value) => handleChange("password",value)}
            placeholder="Create a password"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword}
            accessibilityLabel="Password input"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
        {errors.password ? (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {errors.password}
          </Text>
        ) : null}

        {/* Password strength indicator */}
        {formData.password.length > 0 && (
          <View style={styles.passwordStrengthContainer}>
            <Text style={styles.passwordStrengthLabel}>Password strength:</Text>
            <View style={styles.passwordStrengthBar}>
              {[...Array(4)].map((_,index) => (
                <View
                  key={index}
                  style={[
                    styles.passwordStrengthSegment,
                    {
                      backgroundColor: index < passwordStrength.strength ? passwordStrength.color : "#E2E8F0",
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.passwordStrengthText,{ color: passwordStrength.color }]}>
              {passwordStrength.label}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={[styles.iconInputContainer,errors.confirmPassword ? styles.inputError : null]}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.iconInput}
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange("confirmPassword",value)}
            placeholder="Confirm your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showConfirmPassword}
            accessibilityLabel="Confirm password input"
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
            accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
          >
            <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" /> {errors.confirmPassword}
          </Text>
        ) : null}
      </View>

      <View style={styles.termsContainer}>
        <Ionicons name="information-circle" size={16} color="#4F46E5" />
        <Text style={styles.termsText}>
          By registering, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  )
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#4F46E5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  stepCounter: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
  },
  stepCounterText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    marginBottom: 16,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 4,
  },
  stepIndicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 4,
  },
  activeStepIndicator: {
    backgroundColor: "#4F46E5",
    width: 16,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  stepIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 40,
  },
  stepTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  stepDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#64748B",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
    marginBottom: 10,
  },
  tipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
  selectContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    height: 56,
  },
  selectContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  filledSelect: {
    borderColor: "#A5B4FC",
    backgroundColor: "#F5F7FF",
  },
  selectText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#0F172A",
  },
  placeholderText: {
    color: "#94A3B8",
  },
  optionsContainer: {
    width: "100%",
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedOptionButton: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
    borderBottomColor: "#4F46E5",
    borderWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 2,
    marginBlock: 2,
  },
  optionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#0F172A",
  },
  selectedOptionText: {
    fontFamily: "Inter_600SemiBold",
    color: "#4F46E5",
  },
  checkedBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  uncheckedBox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
  },
  selectionCountText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#334155",
    alignSelf: "flex-start",
    marginBottom: 12,
    marginTop: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    width: "100%",
  },
  tagButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  selectedTagButton: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#4F46E5",
  },
  tagText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#334155",
  },
  selectedTagText: {
    color: "#4F46E5",
    fontFamily: "Inter_600SemiBold",
  },
  tagIcon: {
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    width: "100%",
  },
  infoCardText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#334155",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  infoCardLarge: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 24,
    marginVertical: 16,
    width: "100%",
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  infoCardIcon: {
    marginBottom: 16,
  },
  infoCardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  infoCardDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#334155",
    textAlign: "center",
    lineHeight: 20,
  },
  bulletPoints: {
    width: "100%",
    marginTop: 16,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bulletText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#334155",
    marginLeft: 12,
  },
  statsContainer: {
    width: "100%",
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: "#4F46E5",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#334155",
    textAlign: "center",
  },
  featureGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
  },
  featureItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  featureText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#334155",
    marginLeft: 8,
  },
  unitInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  unitInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  unitToggle: {
    flexDirection: "row",
    marginLeft: 8,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    marginLeft: 4,
    backgroundColor: "#FFFFFF",
  },
  unitButtonSelected: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  unitButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#64748B",
  },
  unitButtonTextSelected: {
    color: "#4F46E5",
  },
  iconInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 12,
  },
  iconInput: {
    flex: 1,
    height: "100%",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#0F172A",
  },
  eyeIcon: {
    padding: 8,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    paddingHorizontal: 8,
  },
  termsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    fontFamily: "Inter_600SemiBold",
    color: "#4F46E5",
    textDecorationLine: "underline",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
  },
  prevButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0,height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0,height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  nextIcon: {
    marginLeft: 8,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    width: "100%",
  },
  passwordStrengthLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  passwordStrengthBar: {
    flexDirection: "row",
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  passwordStrengthSegment: {
    flex: 1,
    height: "100%",
    marginRight: 2,
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  // Body Fat Percentage styles
  bodyFatRangeContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  bodyFatRangeTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#334155",
    marginBottom: 12,
  },
  bodyFatRangeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bodyFatRangeLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#64748B",
  },
  bodyFatRangeValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#334155",
  },
  // Activity Level styles
  activityLevelContent: {
    flex: 1,
  },
  activityLevelDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  // Dietary Preference styles
  dietaryPreferencesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    marginBottom: 16,
  },
  dietaryPreferenceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 6,
    minWidth: "45%",
  },
  selectedDietaryPreference: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#4F46E5",
  },
  dietaryPreferenceText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#334155",
    textAlign: "center",
  },
  selectedDietaryPreferenceText: {
    color: "#4F46E5",
    fontFamily: "Inter_600SemiBold",
  },
  dietaryPreferenceIcon: {
    marginLeft: 6,
  },
  // Fitness Goal styles
  fitnessGoalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  fitnessGoalCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedFitnessGoalCard: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  fitnessGoalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedFitnessGoalIconContainer: {
    backgroundColor: "#4F46E5",
  },
  fitnessGoalText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#334155",
    textAlign: "center",
  },
  selectedFitnessGoalText: {
    color: "#4F46E5",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0,height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerModalContainer: {
    borderRadius: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: "90%",
    alignSelf: "center",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#1E293B",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalOptionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#334155",
  },
  datePickerContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  datePicker: {
    width: "100%",
    height: 200,
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  datePickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  datePickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
    alignItems: "center",
  },
  datePickerCancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#64748B",
  },
  datePickerConfirmText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
})
