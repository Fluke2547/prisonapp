// prison-visit-app/app/visitor/claim-rejected.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ClaimRejectedScreen() {
    const router = useRouter();
    const { reason } = useLocalSearchParams();

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace("/");
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.centerBox}>
                <MaterialIcons name="error-outline" size={120} color="#D32F2F" style={s.icon} />
                <Text style={s.title}>คำขอถูกปฏิเสธ</Text>

                <View style={s.reasonBox}>
                    <Text style={s.reasonLabel}>เหตุผลจากเจ้าหน้าที่:</Text>
                    <Text style={s.reasonText}>{reason || "เอกสารไม่ชัดเจน หรือข้อมูลไม่ถูกต้อง"}</Text>
                </View>

                <TouchableOpacity
                    style={s.retryBtn}
                    onPress={() => router.replace("/visitor/claim-relationship")}
                >
                    <Text style={s.retryBtnText}>ส่งคำขอใหม่</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                    <Text style={s.logoutBtnText}>ออกจากระบบ</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    // --- โครงสร้างหลัก (Layout) ---
    container: {
        flex: 1,
        backgroundColor: "#FFEBEE",
        justifyContent: "center",
        alignItems: "center",
    },
    centerBox: {
        width: "85%",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#FFF",
        borderRadius: 20,
        elevation: 4,
    },

    // --- ส่วนหัวและข้อความ (Header & Text) ---
    icon: {
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#D32F2F",
        textAlign: "center",
        marginBottom: 20,
    },

    // --- กล่องแสดงเหตุผล (Reason Box) ---
    reasonBox: {
        width: "100%",
        backgroundColor: "#FFEBEE",
        padding: 15,
        borderRadius: 10,
        marginBottom: 25,
    },
    reasonLabel: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#D32F2F",
        marginBottom: 5,
    },
    reasonText: {
        fontSize: 15,
        color: "#B71C1C",
    },

    // --- ปุ่มกด (Buttons) ---
    retryBtn: {
        backgroundColor: "#D32F2F",
        width: "100%",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 15,
    },
    retryBtnText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 16,
    },
    logoutBtn: {
        paddingVertical: 10,
    },
    logoutBtnText: {
        color: "#999",
        fontWeight: "bold",
        textDecorationLine: "underline",
    },
});