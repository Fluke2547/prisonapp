//prison-visit-app/app/admin/profile.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminProfileScreen() {
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert(
            "ยืนยันการออกจากระบบ",
            "คุณต้องการออกจากระบบใช่หรือไม่?",
            [
                { text: "ยกเลิก", style: "cancel" },
                {
                    text: "ออกจากระบบ",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem("userToken");
                        router.replace("/");
                    },
                },
            ]
        );
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor="#722F37" />
            
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>ข้อมูลส่วนตัว</Text>
                <View style={{ width: 30 }} />
            </View>

            <View style={s.content}>
                <View style={s.avatarContainer}>
                    <Ionicons name="person-circle" size={100} color="#CCC" />
                    <Text style={s.nameText}>เจ้าหน้าที่ผู้ดูแลระบบ</Text>
                    <Text style={s.roleText}>Administrator</Text>
                </View>

                <View style={s.infoCard}>
                    <View style={s.infoRow}>
                        <Text style={s.label}>รหัสเจ้าหน้าที่:</Text>
                        <Text style={s.value}>ADM-001</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.infoRow}>
                        <Text style={s.label}>สังกัดหน่วยงาน:</Text>
                        <Text style={s.value}>ศูนย์ควบคุมส่วนกลาง</Text>
                    </View>
                </View>

                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={s.logoutText}>ออกจากระบบ</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    // --- โครงสร้างหลัก (Layout) ---
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
    },

    // --- Header Section ---
    header: {
        backgroundColor: "#722F37",
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        flex: 1,
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },

    // --- Content & Avatar Section ---
    content: {
        padding: 20,
        alignItems: "center",
    },
    avatarContainer: {
        alignItems: "center",
        marginBottom: 30,
    },
    nameText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginTop: 10,
    },
    roleText: {
        fontSize: 14,
        color: "#722F37",
        marginTop: 5,
        fontWeight: "bold",
    },

    // --- Information Card ---
    infoCard: {
        width: "100%",
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        marginBottom: 30,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
    },
    divider: {
        height: 1,
        backgroundColor: "#EEE",
    },
    label: {
        fontSize: 15,
        color: "#666",
    },
    value: {
        fontSize: 15,
        color: "#000",
        fontWeight: "bold",
    },

    // --- Action Button (Logout) ---
    logoutBtn: {
        flexDirection: "row",
        backgroundColor: "#D32F2F",
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 3,
    },
    logoutText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
});