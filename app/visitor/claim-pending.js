// prison-visit-app/app/visitor/claim-pending.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ClaimPendingScreen() {
    const router = useRouter();

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace("/");
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.centerBox}>
                <MaterialCommunityIcons name="timer-sand" size={120} color="#FFB300" style={s.icon} />
                <Text style={s.title}>กำลังรอเจ้าหน้าที่ตรวจสอบเอกสาร</Text>
                <Text style={s.subTitle}>
                    ระบบได้รับข้อมูลของท่านแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัติสิทธิ์การเข้าเยี่ยมภายใน 1-3 วันทำการ
                </Text>
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
        backgroundColor: "#FFF8E1",
        justifyContent: "center",
        alignItems: "center",
    },
    centerBox: {
        width: "85%",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#FFF",
        borderRadius: 20,
        elevation: 4,
    },


    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#F57C00",
        textAlign: "center",
        marginBottom: 10,
    },
    subTitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 30,
    },

    // --- ปุ่มกด (Buttons) ---
    logoutBtn: {
        borderWidth: 1,
        borderColor: "#CCC",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    logoutBtnText: {
        color: "#666",
        fontWeight: "bold",
    },
});