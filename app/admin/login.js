// prison-visit-app/app/admin/login.js
import { useState } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Image, 
    Alert, 
    ActivityIndicator, 
    KeyboardAvoidingView, 
    Platform, 
    ScrollView 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../../constants/api";

const COLORS = {
    primary: "#722F37",
    bg: "#F7F7F7",
    card: "#FFFFFF",
    text: "#2E2E2E",
    subtext: "#777",
    border: "#DDD",
};

export default function AdminLogin() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);

    const onLogin = async () => {
        if (!username || !password) {
            return Alert.alert("ผิดพลาด", "กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
        }

        setLoading(true);

        try {
            console.log("🚀 Logging in with:", username);

            const res = await apiClient.post("/admin/login", {
                username: username,
                password: password
            });

            console.log("✅ Login Success, Token:", res.data.token);
            
            const token = res.data.token;
            
            // 🟢 ดึงข้อมูล Role และ Fullname จาก Backend 
            const role = res.data.data?.role || "STAFF";
            const fullname = res.data.data?.fullname || "เจ้าหน้าที่";

            // บันทึก Token, Role, และ Name ลงในเครื่อง
            await AsyncStorage.setItem("userToken", token);
            await AsyncStorage.setItem("userRole", role.toLowerCase());
            await AsyncStorage.setItem("userName", fullname);

            // 🟢 แยกการนำทาง (Routing) 
            switch (role.toUpperCase()) {
                // 🚀 สิทธิ์ ผบ. (Commander)
                case "COMMANDER":
                    router.replace("/commander/dashboard"); // 👈 เตะไปหน้า ผบ.
                    break;

                case "SUPER_ADMIN":
                case "ADMIN":
                case "REGISTRAR":    
                case "STAFF": 
                    router.replace("/admin");
                    break;

                case "VISITATION":
                case "OFFICER":      
                    await AsyncStorage.setItem("officerToken", "true"); 
                    router.replace("/regis"); 
                    break;
                    
                default:
                    Alert.alert("แจ้งเตือน", "สิทธิ์การใช้งานไม่ถูกต้อง");
                    break;
            }

        } catch (error) {
            console.error("Login Error:", error);
            const msg = error.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ ข้อมูลไม่ถูกต้อง";
            Alert.alert("ผิดพลาด", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Image
                        source={require("../../assets/images/logo.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <Text style={styles.title}>ระบบจัดการและสถิติ</Text>
                    <Text style={styles.subtitle}>สำหรับเจ้าหน้าที่</Text>

                    <Text style={styles.label}>ชื่อผู้ใช้งาน (Username)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="กรอกชื่อผู้ใช้งาน"
                        placeholderTextColor="#999"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>รหัสผ่าน</Text>
                    <View style={styles.passwordWrap}>
                        <TextInput
                            style={styles.inputInside}
                            placeholder="รหัสผ่าน"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!show}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.iconButton} onPress={() => setShow(!show)}>
                            <Ionicons 
                                name={show ? "eye-off-outline" : "eye-outline"} 
                                size={24} 
                                color="#666" 
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && { opacity: 0.7 }]}
                        onPress={onLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>เข้าสู่ระบบ</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.replace("/")}
                        style={styles.backBtnWrapper}
                    >
                        <Text style={styles.userLink}>กลับหน้าหลักผู้ใช้งานทั่วไป</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingTop: 40, paddingBottom: Platform.OS === "android" ? 150 : 60 },
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, elevation: 3 },
    logo: { width: 100, height: 100, alignSelf: "center", marginBottom: 10 },
    title: { fontSize: 20, fontWeight: "bold", color: COLORS.text, textAlign: "center" },
    subtitle: { fontSize: 13, color: COLORS.subtext, textAlign: "center", marginBottom: 15 },
    label: { marginBottom: 5, fontWeight: 'bold', color: '#555', marginTop: 10 },
    input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 16, marginBottom: 16, backgroundColor: "#fff", color: "#333" },
    passwordWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, height: 48, marginBottom: 20, backgroundColor: "#fff" },
    inputInside: { flex: 1, height: "100%", fontSize: 16, color: "#333" },
    iconButton: { padding: 4 },
    btn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 5 },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    backBtnWrapper: { marginTop: 20, alignItems: "center" },
    userLink: { color: "#8B2C2C", marginTop: 10, fontWeight: "bold" },
});