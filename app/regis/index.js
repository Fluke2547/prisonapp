// app/regis/index.js
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Alert
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
// 🟢 อิมพอร์ต Theme มาใช้เหมือนหน้า Admin สีจะได้ตรงเป๊ะ!
import { useTheme } from "../../hooks/useTheme";

export default function OfficerDashboardScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [officer, setOfficer] = useState(null);
    const [loading, setLoading] = useState(true);

    /* 🟢 เมนู 2 อัน: เรียกดูการจอง และ ดูประวัติการจอง */
    const menuItems = [
        {
            id: 1,
            title: "เรียกดูการจอง",
            icon: "calendar",
            iconLib: "Feather",
            to: "/regis/bookings",
        },
        {
            id: 2,
            title: "ดูประวัติการจอง",
            icon: "clock",
            iconLib: "Feather",
            to: "/regis/history",
        },
        {
            id: 3,
            title: "วิดีโอคอลเยี่ยม",
            icon: "video",
            iconLib: "Feather",
            to: "/regis/video-call" },
    ];

    const renderIcon = (iconLib, iconName, size, color) => {
        if (iconLib === "Feather") {
            return <Feather name={iconName} size={size} color={color} />;
        }
        return <Ionicons name={iconName} size={size} color={color} />;
    };

    /* Logout */
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
                        await AsyncStorage.clear();
                        router.replace("/admin/login");
                    },
                },
            ]
        );
    };

    useEffect(() => {
        const fetchOfficerData = async () => {
            try {
                const token = await AsyncStorage.getItem("userToken");
                const role = await AsyncStorage.getItem("userRole");
                const savedName = await AsyncStorage.getItem("userName");

                if (!token) {
                    router.replace("/admin/login");
                    return;
                }

                setOfficer({
                    name: savedName || "เจ้าหน้าที่",
                    role: role === "visitation" || role === "officer" ? "เจ้าหน้าที่ประจำจุดรับเยี่ยม" : "เจ้าหน้าที่",
                });
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        };
        fetchOfficerData();
    }, []);

    return (
        <View style={[s.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBg} />

            {/* Header */}
            <View style={[s.header, { backgroundColor: theme.headerBg }]}>
                <View style={s.headerTop}>
                    <View style={s.row}>
                        <Ionicons name="home" size={24} color={theme.headerText} />
                        <Text style={[s.headerTitle, { color: theme.headerText }]}>
                            หน้าหลัก
                        </Text>
                    </View>

                    <View style={s.row}>
                        <TouchableOpacity style={{ marginRight: 12 }} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={24} color={theme.headerText} />
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <Ionicons name="notifications-outline" size={24} color={theme.headerText} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Card */}
                <View style={[s.userCard, { borderColor: theme.border }]}>
                    <Text style={[s.userCardTitle, { color: theme.headerText }]}>
                        ข้อมูลบัญชี
                    </Text>

                    <View style={[s.userBox, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                        {loading ? (
                            <ActivityIndicator color={theme.headerText} />
                        ) : (
                            <>
                                <Text style={[s.userText, { color: theme.headerText }]}>
                                    ชื่อ : {officer?.name}
                                </Text>
                                <Text style={[s.userText, { color: theme.headerText }]}>
                                    ตำแหน่ง : {officer?.role}
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </View>

            {/* Content / Grid Menu */}
            <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
                <View style={s.grid}>
                    {menuItems.map((m) => (
                        <TouchableOpacity
                            key={m.id}
                            style={[s.card, { backgroundColor: theme.primary, borderColor: theme.border }]}
                            onPress={() => router.push(m.to)}
                            activeOpacity={0.8}
                        >
                            <View style={s.cardIcon}>
                                {renderIcon(m.iconLib, m.icon, 32, "#fff")}
                            </View>
                            <Text style={s.cardText}>{m.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Nav */}
            <View style={[s.bottom, { backgroundColor: theme.bottomBar }]}>
                <TouchableOpacity style={s.navItem} onPress={() => router.replace("/regis")}>
                    <View style={s.activeBg}>
                        <Ionicons name="home" size={26} color={theme.accent} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem}>
                    <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem}>
                    <Ionicons name="person-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// 🟢 ก๊อปปี้ Style จากหน้า Admin มาทั้งดุ้น เพื่อให้ UI ออกมาเหมือนกัน 100%
const s = StyleSheet.create({
    container: { flex: 1 },
    row: { flexDirection: "row", alignItems: "center" },

    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 6,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    headerTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginLeft: 10,
    },

    userCard: {
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
    },
    userCardTitle: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    userBox: {
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
    },
    userText: {
        lineHeight: 20,
        textAlign: "center",
    },

    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 20,
    },
    card: {
        width: "48%",
        borderRadius: 20,
        padding: 22,
        marginBottom: 16,
        alignItems: "center",
        minHeight: 130,
        elevation: 5,
        borderWidth: 1,
    },
    cardIcon: {
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 50,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    cardText: {
        fontWeight: "bold",
        textAlign: "center",
        color: "#fff",
    },

    bottom: {
        flexDirection: "row",
        paddingVertical: 12,
        paddingBottom: 30,
        justifyContent: "space-around",
        alignItems: "center",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    navItem: {
        padding: 8,
        borderRadius: 30,
        minWidth: 50,
        alignItems: "center",
        justifyContent: "center",
    },
    activeBg: {
        backgroundColor: "#fff",
        borderRadius: 30,
        padding: 10,
        elevation: 3,
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
});