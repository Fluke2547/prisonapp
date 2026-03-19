// prison-visit-app/app/index.js
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { loginUser } from "../constants/api";

const COLORS = {
  primary: "#722F37",
  border: "#DDD",
  text: "#333",
  subtext: "#722F37",
  bg: "#FFF",
};

export default function Login() {
  const router = useRouter();

  const [idCard, setIdCard] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    console.log("--- START LOGIN ---");
    console.log("Input:", { idCard, password });

    if (!idCard || !password) {
      return Alert.alert("ผิดพลาด", "กรุณากรอกข้อมูลให้ครบ");
    }

    if (idCard.length !== 13) {
      return Alert.alert(
        "ผิดพลาด",
        "กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง (13 หลัก)"
      );
    }

    try {
      setLoading(true);

      const payload = {
        id_card: idCard,
        password: password,
        device_token: "dummy_fcm_token",
        device_type: "android",
      };

      console.log("Sending Payload:", JSON.stringify(payload, null, 2));

      const res = await loginUser(payload);

      console.log("API Response Status:", res.status);
      console.log("API Response Data:", JSON.stringify(res.data, null, 2));

      const { token, message2, is_first_login, claim_status, reject_reason } = res.data;

      if (!token) {
        console.log("Error: No token in response");
        return Alert.alert("ผิดพลาด", "ไม่พบ token จากระบบ");
      }

      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("idCard", idCard);
      await AsyncStorage.setItem("userRole", "USER");

      console.log("Login Success! Routing based on claim_status...");

      Alert.alert("สำเร็จ", message2 || "เข้าสู่ระบบสำเร็จ", [
        {
          text: "ตกลง",
          onPress: () => {
            if (is_first_login) {
              router.replace("/visitor/intro");
            } else {
              switch (claim_status) {
                case "NONE":
                  router.replace("/visitor/claim-relationship");
                  break;
                case "PENDING":
                  router.replace("/visitor/claim-pending");
                  break;
                case "REJECTED":
                  router.replace({
                    pathname: "/visitor/claim-rejected",
                    params: { reason: reject_reason || "เอกสารไม่ถูกต้อง" }
                  });
                  break;
                case "APPROVED":
                default:
                  router.replace("/visitor/");
                  break;
              }
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Login Error Details:", error);

      if (error.response) {
        console.log("Error Response Data:", error.response.data);
        console.log("Error Response Status:", error.response.status);
      }

      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";

      if (status === 401) Alert.alert("เข้าสู่ระบบไม่สำเร็จ", msg);
      else if (status === 403) Alert.alert("บัญชีถูกระงับ", msg);
      else Alert.alert("ผิดพลาด", msg);
    } finally {
      setLoading(false);
      console.log("--- END LOGIN ---");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>ยินดีต้อนรับเข้าสู่ระบบ</Text>

      <TextInput
        style={styles.input}
        placeholder="เลขบัตรประชาชน"
        placeholderTextColor="#999"
        value={idCard}
        onChangeText={setIdCard}
        keyboardType="number-pad"
        maxLength={13}
      />

      <View style={styles.passwordWrap}>
        <TextInput
          style={styles.passwordInput}
          placeholder="รหัสผ่าน"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
        />
        <TouchableOpacity
          onPress={() => setShow(!show)}
          style={styles.iconButton}
        >
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

      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.orText}>หรือ</Text>
        <View style={styles.line} />
      </View>

      <Text style={styles.registerText}>
        หากยังไม่มีบัญชี?{" "}
        <Link href="/register" style={styles.link}>
          สมัครสมาชิก
        </Link>
      </Text>


      <View style={styles.staffContainer}>
        {/* ปุ่มเข้าสู่ระบบแอดมิน (ของเดิม) */}
        <TouchableOpacity
          onPress={() => router.push("/admin/login")}
          style={styles.staffBtn}
        >
          <Ionicons name="settings-outline" size={18} color={COLORS.subtext} style={{ marginRight: 6 }} />
          <Text style={styles.adminLink}>
            เข้าสู่ระบบสำหรับผู้ดูแลระบบ
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 140, height: 140, marginBottom: 12 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 28,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    marginBottom: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  passwordWrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#333",
  },
  iconButton: {
    padding: 4,
  },
  btn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  line: { flex: 1, height: 1, backgroundColor: "#EEE" },
  orText: { marginHorizontal: 8, color: COLORS.subtext },
  registerText: { marginTop: 16, color: COLORS.text },
  link: { color: COLORS.primary, fontWeight: "600" },
  
  // 🟢 สไตล์ใหม่สำหรับปุ่มเจ้าหน้าที่และแอดมิน
  staffContainer: {
    marginTop: 40,
    width: "100%",
    alignItems: "center",
    gap: 15,
  },
  staffBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  staffLink: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  adminLink: {
    color: COLORS.subtext,
    fontWeight: "600",
    fontSize: 14,
  },
});