import { useState,useEffect,useRef } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Platform,
    Alert,
    Linking,
    BackHandler,
} from "react-native"
import { WebView } from "react-native-webview"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons,MaterialCommunityIcons } from "@expo/vector-icons"
import DynamicStatusBar from "screens/statusBar/DynamicStatusBar"
import { theme } from "theme/color"

const QRPaymentScreen = ({ route,navigation }) => {
    const { paymentUrl,packageName,amount,paymentCode,packageId,subscriptionId } = route.params

    const [loading,setLoading] = useState(true)
    const [webViewError,setWebViewError] = useState(false)
    const [currentUrl,setCurrentUrl] = useState("")
    const [paymentStatus,setPaymentStatus] = useState("pending")
    const webViewRef = useRef(null)

    useEffect(() => {
        const backAction = () => {
            Alert.alert("Cancel Payment?","Are you sure you want to cancel this payment transaction?",[
                { text: "Continue Payment",style: "cancel" },
                {
                    text: "Cancel Payment",
                    style: "destructive",
                    onPress: () => {
                        navigation.goBack()
                    },
                },
            ])
            return true
        }

        const backHandler = BackHandler.addEventListener("hardwareBackPress",backAction)
        return () => backHandler.remove()
    },[navigation])

    const handleNavigationStateChange = (navState) => {
        const { url } = navState
        setCurrentUrl(url)

        console.log("Current URL:",url)

        const urlParams = new URLSearchParams(url.split("?")[1])
        const returnedPaymentCode = urlParams.get("paymentCode")
        const returnedPackageId = urlParams.get("packageId")
        const returnedSubscription = urlParams.get("subscription")
        if (url.includes("/booking-services/success")) {
            setPaymentStatus("success")
            setLoading(false)

            setTimeout(() => {
                Alert.alert("Payment Successful! ","Your transaction has been processed successfully.",[
                    {
                        text: "Complete",
                        onPress: () => {
                            navigation.navigate("PaymentSuccessScreen",{
                                paymentCode: returnedPaymentCode,
                                packageId: returnedPackageId,
                                subscriptionId: returnedSubscription,
                                amount: amount,
                                packageName: packageName,
                            })
                        },
                    },
                ])
            },1000)
        }
        if (url.includes("/booking-services/cancel") || url.includes("KeysEdunext")) {
            setPaymentStatus("failed")
            setLoading(false)

            setTimeout(() => {
                Alert.alert("Payment Cancelled","Payment transaction was cancelled or failed.",[
                    {
                        text: "Payment Cancelled",
                        onPress: () => {
                            navigation.navigate("PaymentCancelled",{
                                paymentCode: returnedPaymentCode,
                                packageId: returnedPackageId,
                                subscriptionId: returnedSubscription,
                                amount: amount,
                                packageName: packageName,
                            })
                        },
                    },
                ])
            },1000)
        }
    }

    const handleWebViewLoad = () => {
        setLoading(false)
        setWebViewError(false)
    }

    const handleWebViewError = () => {
        setLoading(false)
        setWebViewError(true)
    }

    const openBankingApp = async () => {
        const isIOS = Platform.OS === "ios";
        const appStoreUrl = isIOS
            ? "https://apps.apple.com/app/id"
            : "https://play.google.com/store/apps/details?id=";

        Alert.alert(
            "Open Banking App",
            "Choose how you want to scan the QR code for payment:",
            [
                {
                    text: "Open VietQR App",
                    onPress: async () => {
                        try {
                            const vietQRUrl = isIOS ? "vietqr://scan" : "vietqr://scan";
                            console.log("Attempting to open VietQR:",vietQRUrl);
                            const canOpen = await Linking.canOpenURL(vietQRUrl);
                            if (canOpen) {
                                await Linking.openURL(vietQRUrl);
                            } else {
                                const storeUrl = isIOS
                                    ? "https://apps.apple.com/vn/app/vietqr/id1538341132"
                                    : "https://play.google.com/store/apps/details?id=vn.vnpay.vietqr";
                                console.log("Redirecting to store:",storeUrl);
                                await Linking.openURL(storeUrl);
                            }
                        } catch (error) {
                            console.error("VietQR Error:",error);
                            Alert.alert("Error","Unable to open VietQR app.");
                        }
                    },
                },
                {
                    text: "Open Banking App",
                    onPress: async () => {
                        try {
                            const bankingApps = [
                                { name: "MB Bank",url: isIOS ? "mbbank://qrscan" : "mbbank://",storeId: isIOS ? "id1114708317" : "vn.mbbank" },
                                { name: "Techcombank",url: isIOS ? "techcombank://qrscan" : "techcombank://",storeId: isIOS ? "id1138419349" : "com.tcb" },
                                { name: "Vietcombank",url: isIOS ? "vietcombank://qrscan" : "vietcombank://",storeId: isIOS ? "id547942223" : "com.vietcombank" },
                                { name: "BIDV",url: isIOS ? "bidv://qrscan" : "bidv://",storeId: isIOS ? "id1061866301" : "com.bidv" },
                                { name: "ACB",url: isIOS ? "acb://qrscan" : "acb://",storeId: isIOS ? "id1161731833" : "com.acb" },
                            ];

                            let appOpened = false;
                            for (const app of bankingApps) {
                                console.log(`Attempting to open ${app.name}:`,app.url);
                                const canOpen = await Linking.canOpenURL(app.url);
                                if (canOpen) {
                                    await Linking.openURL(app.url);
                                    appOpened = true;
                                    break;
                                }
                            }

                            if (!appOpened) {
                                const qrScannerUrl = isIOS
                                    ? "https://apps.apple.com/us/app/qr-code-reader-barcode-scan/id1152732156"
                                    : "https://play.google.com/store/apps/details?id=com.google.zxing.client.android";
                                console.log("Redirecting to QR scanner store:",qrScannerUrl);
                                await Linking.openURL(qrScannerUrl);
                            }
                        } catch (error) {
                            console.error("Banking App Error:",error);
                            Alert.alert("Error","Unable to open banking app.");
                        }
                    },
                },
                {
                    text: "Instructions",
                    onPress: () => {
                        const instructions = isIOS
                            ? "1. Open your banking app on iPhone\n2. Find the QR scan feature\n3. Scan the QR code on screen\n4. Confirm payment\n\nSupported: MB Bank, Techcombank, Vietcombank, BIDV, ACB"
                            : "1. Open your banking app on Android\n2. Find the QR scan feature\n3. Scan the QR code on screen\n4. Confirm payment\n\nSupported: MB Bank, Techcombank, Vietcombank, BIDV, ACB";
                        Alert.alert("Payment Instructions",instructions);
                    },
                },
                { text: "Cancel",style: "cancel" },
            ]
        );
    };
    const refreshPayment = () => {
        setLoading(true)
        setWebViewError(false)
        setPaymentStatus("pending")
        webViewRef.current?.reload()
    }

    const renderHeader = () => (
        <LinearGradient colors={["#4F46E5","#6366F1","#818CF8"]} style={styles.header}>
            <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                    Alert.alert("Cancel Payment?","Are you sure you want to cancel this transaction?",[
                        { text: "Continue",style: "cancel" },
                        { text: "Cancel",onPress: () => navigation.goBack() },
                    ])
                }}
            >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>QR Payment</Text>
                <Text style={styles.headerSubtitle}>Scan to pay</Text>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={refreshPayment}>
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </LinearGradient>
    )

    const renderPaymentInfo = () => (
        <View style={styles.paymentInfoCard}>
            <View style={styles.paymentInfoHeader}>
                <LinearGradient colors={["#EEF2FF","#F8FAFC"]} style={styles.paymentIcon}>
                    <MaterialCommunityIcons name="qrcode-scan" size={24} color="#4F46E5" />
                </LinearGradient>
                <View style={styles.paymentDetails}>
                    <Text style={styles.packageNameText}>{packageName}</Text>
                    <Text style={styles.amountText}>{amount?.toLocaleString()} VND</Text>
                </View>
                <View style={[styles.statusBadge,getStatusBadgeStyle()]}>
                    <Text style={[styles.statusText,getStatusTextStyle()]}>{getStatusText()}</Text>
                </View>
            </View>
        </View>
    )

    const getStatusBadgeStyle = () => {
        switch (paymentStatus) {
            case "success":
                return { backgroundColor: "#F0FDF4" }
            case "failed":
                return { backgroundColor: "#FEF2F2" }
            default:
                return { backgroundColor: "#FEF3C7" }
        }
    }

    const getStatusTextStyle = () => {
        switch (paymentStatus) {
            case "success":
                return { color: "#10B981" }
            case "failed":
                return { color: "#EF4444" }
            default:
                return { color: "#F59E0B" }
        }
    }

    const getStatusText = () => {
        switch (paymentStatus) {
            case "success":
                return "Success"
            case "failed":
                return "Failed"
            default:
                return "Processing"
        }
    }

    const renderActionButtons = () => (
        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.scanButton} onPress={openBankingApp}>
                <LinearGradient colors={["#10B981","#059669"]} style={styles.scanButtonGradient}>
                    <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.scanButtonText}>Open Banking App</Text>
                </LinearGradient>
            </TouchableOpacity>

            <View style={styles.secondaryButtons}>
                <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() => {
                        Alert.alert(
                            "Payment Support",
                            "• Ensure stable internet connection\n• Check account balance\n• Contact your bank if issues occur\n\nHotline: 1900-xxxx",
                        )
                    }}
                >
                    <Ionicons name="help-circle-outline" size={20} color="#4F46E5" />
                    <Text style={styles.helpButtonText}>Help</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.refreshButton} onPress={refreshPayment}>
                    <Ionicons name="refresh-outline" size={20} color="#4F46E5" />
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        </View>
    )

    if (webViewError) {
        return (
            <SafeAreaView style={styles.safeArea}>
                {renderHeader()}
                <View style={styles.errorContainer}>
                    <LinearGradient colors={["#FEF2F2","#FFFFFF"]} style={styles.errorContent}>
                        <Ionicons name="wifi-outline" size={64} color="#EF4444" />
                        <Text style={styles.errorTitle}>Connection Error</Text>
                        <Text style={styles.errorText}>
                            Unable to load payment page. Please check your internet connection and try again.
                        </Text>
                        <TouchableOpacity style={styles.retryButton} onPress={refreshPayment}>
                            <LinearGradient colors={["#4F46E5","#6366F1"]} style={styles.retryButtonGradient}>
                                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <DynamicStatusBar backgroundColor={theme.primaryColor} />

            {renderHeader()}
            {renderPaymentInfo()}

            <View style={styles.webViewContainer}>
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text style={styles.loadingText}>Loading payment page...</Text>
                    </View>
                )}

                <WebView
                    ref={webViewRef}
                    source={{ uri: paymentUrl }}
                    style={styles.webView}
                    onLoad={handleWebViewLoad}
                    onError={handleWebViewError}
                    onNavigationStateChange={handleNavigationStateChange}
                    startInLoadingState={true}
                    scalesPageToFit={true}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    allowsBackForwardNavigationGestures={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    mixedContentMode="compatibility"
                />
            </View>

            {renderActionButtons()}
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
        borderRadius: 22,
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
    },
    headerSubtitle: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.8)",
        marginTop: 2,
    },
    refreshBtn: {
        width: 44,
        height: 44,
        borderRadius: "50%",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    paymentInfoCard: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginTop: 15,
        borderRadius: 20,
        padding: 20,
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0,height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    paymentInfoHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    paymentIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    paymentDetails: {
        flex: 1,
    },
    packageNameText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 4,
    },
    amountText: {
        fontSize: 18,
        fontWeight: "800",
        color: "#4F46E5",
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    webViewContainer: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0,height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    webView: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: "#4F46E5",
        fontWeight: "500",
    },
    actionButtonsContainer: {
        padding: 16,
        backgroundColor: "#F8FAFC",
    },
    scanButton: {
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 12,
        shadowColor: "#10B981",
        shadowOffset: { width: 0,height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    scanButtonGradient: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 12,
    },
    scanButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    secondaryButtons: {
        flexDirection: "row",
        gap: 12,
    },
    helpButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
        borderWidth: 2,
        borderColor: "#E2E8F0",
    },
    helpButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#4F46E5",
    },
    refreshButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
        borderWidth: 2,
        borderColor: "#E2E8F0",
    },
    refreshButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#4F46E5",
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
    errorTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#EF4444",
        marginTop: 16,
        marginBottom: 12,
    },
    errorText: {
        fontSize: 16,
        color: "#64748B",
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 24,
    },
    retryButton: {
        borderRadius: 16,
        overflow: "hidden",
    },
    retryButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
})

export default QRPaymentScreen
