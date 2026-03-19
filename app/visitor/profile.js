import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../hooks/useTheme";
import { getMainProfile } from "../../constants/api"; // 🟢 อย่าลืม Import ตัวนี้

const maskIdCard = (id) => {
    if (!id || id.length !== 13) return "1-XXXX-XXXX-XX-X";
    return `${id[0]}-${id.slice(1, 5)}-${id.slice(5, 9)}-${id.slice(9, 11)}-${id.slice(11)}`;
};

export default function ProfileScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    // 🟢 เอา address ออกจาก State
    const [user, setUser] = useState({
        name: "กำลังโหลด...",
        idCard: "กำลังโหลด...",
        birthDate: "01/01/2535",
        age: "30 ปี",
        phone: "081-234-5678",
        inmateName: "นาย สมชาย ใจดี (ผู้ต้องขัง)",
        relation: "บุตรชาย",
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMixedProfile = async () => {
            try {
                const token = await AsyncStorage.getItem("userToken");
                const localIdCard = await AsyncStorage.getItem("idCard");

                if (!token) {
                    router.replace("/");
                    return;
                }

                // 1. ดึงข้อมูลจริงจาก Backend
                const res = await getMainProfile(token);
                const userData = res.data.user || res.data.data || {};

                // 2. ผสมข้อมูล (จริง + Mock)
                setUser({
                    name: userData.fullname || "ไม่ระบุชื่อ", // 🟢 ของจริงจาก DB
                    idCard: maskIdCard(userData.id_card || localIdCard || "1234567890123"), // 🟢 ของจริงจาก DB
                    birthDate: "01/01/2535", // 🟡 Mock
                    age: "30 ปี", // 🟡 Mock
                    phone: "081-234-5678", // 🟡 Mock
                    inmateName: "นาย สมชาย ใจดี (ผู้ต้องขัง)", // 🟡 Mock
                    relation: "บุตรชาย", // 🟡 Mock
                });

            } catch (error) {
                setUser({
                    name: "นาย วาเลน ทิพย์มาศ",
                    idCard: maskIdCard("1800600229255"),
                    birthDate: "01/01/2535",
                    age: "30 ปี",
                    phone: "081-234-5678",
                    inmateName: "นาย สมชาย ใจดี (ผู้ต้องขัง)",
                    relation: "บุตรชาย",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchMixedProfile();
    }, []);

    return (
        <View style={[s.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBg} />

            <View style={[s.header, { backgroundColor: theme.headerBg }]}>
                <TouchableOpacity style={s.backButton} onPress={() => router.replace("/visitor")}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={s.headerCenter}>
                    <Text style={[s.headerTitle, { color: theme.headerText }]}>
                        ข้อมูลผู้ใช้
                    </Text>
                    <Text style={[s.headerSub, { color: "#F3E8EA" }]}>
                        แสดงข้อมูลของผู้ใช้งาน(ญาติ)
                    </Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            >
                <View style={[s.card, { backgroundColor: theme.card }]}>
                    <Text style={[s.cardTitle, { color: theme.primary }]}>
                        บัญชีผู้ใช้งาน
                    </Text>

                    <View style={s.avatarWrap}>
                        <View
                            style={[
                                s.avatarCircle,
                                { backgroundColor: theme.primarySoft },
                            ]}
                        >
                            <Ionicons name="person" size={46} color="#fff" />
                        </View>
                    </View>

                    {/* 🟢 ชื่อของจริงจะมาโชว์ตรงนี้ */}
                    <Text style={[s.nameText, { color: theme.text }]}>{user.name}</Text>
                </View>

                <View style={[s.card, { backgroundColor: theme.card }]}>
                    <Text style={[s.sectionHeader, { color: theme.primary }]}>
                        ข้อมูลส่วนตัวของญาติ
                    </Text>

                    <View style={s.infoRow}>
                        <View style={s.iconBox}>
                            <Ionicons name="card-outline" size={20} color={theme.primary} />
                        </View>
                        <View style={s.infoTextBox}>
                            <Text style={[s.infoLabel, { color: theme.subtext }]}>
                                รหัสประจำตัวประชาชน
                            </Text>
                            {/* 🟢 เลขบัตรของจริงจะมาโชว์ตรงนี้ */}
                            <Text style={[s.infoValue, { color: theme.text }]}>
                                {user.idCard}
                            </Text>
                        </View>
                    </View>

                    <View style={s.infoRow}>
                        <View style={s.iconBox}>
                            <Ionicons
                                name="calendar-outline"
                                size={20}
                                color={theme.primary}
                            />
                        </View>
                        <View style={s.infoTextBox}>
                            <Text style={[s.infoLabel, { color: theme.subtext }]}>
                                วันเดือนปีเกิด / อายุ
                            </Text>
                            <Text style={[s.infoValue, { color: theme.text }]}>
                                {user.birthDate}  ·  {user.age}
                            </Text>
                        </View>
                    </View>

                    <View style={s.infoRow}>
                        <View style={s.iconBox}>
                            <Ionicons name="call-outline" size={20} color={theme.primary} />
                        </View>
                        <View style={s.infoTextBox}>
                            <Text style={[s.infoLabel, { color: theme.subtext }]}>
                                เบอร์โทรศัพท์
                            </Text>
                            <Text style={[s.infoValue, { color: theme.text }]}>
                                {user.phone}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={[s.bottom, { backgroundColor: theme.bottomBar }]}>
                <TouchableOpacity
                    style={s.navItem}
                    onPress={() => router.replace("/visitor")}
                >
                    <Ionicons name="home-outline" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.navItem}
                    onPress={() => router.replace("/visitor/settings")}
                >
                    <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={s.navItem}>
                    <View style={s.activeBg}>
                        <Ionicons name="person-outline" size={26} color={theme.accent} />
                    </View>
                </View>

                <TouchableOpacity
                    style={s.navItem}
                    onPress={() => router.replace("/visitor/help")}
                >
                    <Ionicons name="help-circle-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading && (
                <View style={s.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: {
        position: "absolute",
        left: 16,
        bottom: 12,
        padding: 4,
    },
    headerCenter: { alignItems: "center" },
    headerTitle: { fontWeight: "800", fontSize: 18 },
    headerSub: { fontSize: 12, marginTop: 2 },
    card: {
        borderRadius: 20,
        padding: 22,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 12,
    },
    avatarWrap: {
        alignItems: "center",
        marginBottom: 8,
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: "center",
        justifyContent: "center",
    },
    nameText: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 8,
        marginBottom: 4,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        marginBottom: 10,
        alignItems: "flex-start",
    },
    iconBox: {
        width: 32,
        alignItems: "center",
        marginTop: 2,
    },
    infoTextBox: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: "600",
    },
    bottom: {
        flexDirection: "row",
        paddingVertical: 12,
        paddingBottom: 30,
        alignItems: "center",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    navItem: {
        flex: 1,
        padding: 8,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    activeBg: {
        backgroundColor: "#fff",
        borderRadius: 30,
        padding: 10,
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        elevation: 3,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
});