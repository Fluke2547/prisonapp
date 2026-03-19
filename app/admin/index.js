// app/admin/index.js
import { useEffect, useState } from "react";
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
import { useTheme } from "../../hooks/useTheme";

export default function AdminHome() {
    const router = useRouter();
    const { theme } = useTheme();

    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    const allMenuitems = [
        {
            id: 5,
            title: "คำขอสมัครสมาชิก",
            icon: "user-plus",
            iconLib: "Feather",
            to: "/admin/manage-register",
            allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'REGISTRAR']
        },
        {
            id: 6,
            title: "จัดการรอบการจอง",
            icon: "calendar-outline",
            iconLib: "Ionicons",
            to: "/admin/manage-slots",
            allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'REGISTRAR']
        },
        {
            id: 7,
            title: "จัดการอุปกรณ์",
            icon: "monitor", // ไอคอนหน้าจอ
            iconLib: "Feather",
            to: "/admin/devices", // 👈 ลิงก์ไปไฟล์ที่เราจะสร้างใหม่
            allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'REGISTRAR'] // ทะเบียนใช้งานได้
        },
        {
            id: 1,
            title: "จัดการผู้ใช้",
            icon: "users",
            iconLib: "Feather",
            to: "/admin/users",
            allowedRoles: ['SUPER_ADMIN', 'ADMIN']
        },
        {
            id: 2,
            title: "จัดการผู้ต้องขัง",
            icon: "person-outline",
            iconLib: "Ionicons",
            to: "/admin/inmates",
            allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'REGISTRAR']
        },
        {
            id: 3,
            title: "จัดการคิวเยี่ยม",
            icon: "check-square",
            iconLib: "Feather",
            to: "/admin/adminbookings",
            allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'REGISTRAR']
        },
        {
            id: 4,
            title: "รายงาน",
            icon: "file-text",
            iconLib: "Feather",
            to: "/admin/reports",
            allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'REGISTRAR']
        },
    ];

    const renderIcon = (iconLib, iconName, size, color) => {
        if (iconLib === "Feather") {
            return <Feather name={iconName} size={size} color={color} />;
        }
        return <Ionicons name={iconName} size={size} color={color} />;
    };

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
                        router.replace("/");
                    },
                },
            ]
        );
    };

    useEffect(() => {
        const fetchAdmin = async () => {
            try {
                const token = await AsyncStorage.getItem("userToken");
                const role = await AsyncStorage.getItem("userRole");

                // 🟢 1. ล้วงกระเป๋าเอาชื่อที่จำไว้ตอน Login มาใช้
                const savedName = await AsyncStorage.getItem("userName");

                if (!token) {
                    router.replace("/admin/login");
                    return;
                }

                if (role) {
                    setUserRole(role.toUpperCase());
                }

                // 🟢 2. เอาชื่อจริงมาใส่ใน State แทนคำว่า "เจ้าหน้าที่" เฉยๆ
                setAdmin({
                    name: savedName || "เจ้าหน้าที่", // ถ้าไม่มีชื่อให้ขึ้นว่า เจ้าหน้าที่
                    role: role ? role.toUpperCase() : "STAFF",
                });
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAdmin();
    }, []);

    const visibleMenuItems = userRole
        ? allMenuitems.filter(item => item.allowedRoles.includes(userRole))
        : [];

    const getDisplayName = (role) => {
        switch (role) {
            case 'SUPER_ADMIN': return "ผู้ดูแลระบบ";
            case 'ADMIN': return "ผู้ดูแลระบบ";
            case 'REGISTRAR': return "เจ้าหน้าที่ฝ่ายทะเบียน";
            default: return "เจ้าหน้าที่";
        }
    }

    return (
        <View style={[s.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBg} />

            <View style={[s.header, { backgroundColor: theme.headerBg }]}>
                <View style={s.headerTop}>
                    <View style={s.row}>
                        <Ionicons name="home" size={24} color={theme.headerText} />
                        <Text style={[s.headerTitle, { color: theme.headerText }]}>
                            หน้าหลัก ({getDisplayName(userRole)})
                        </Text>
                    </View>

                    <View style={s.row}>
                        <TouchableOpacity style={{ marginRight: 12 }} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={24} color={theme.headerText} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push("/admin/notifications")}>
                            <Ionicons name="notifications-outline" size={24} color={theme.headerText} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[s.userCard, { borderColor: theme.border }]}>
                    <Text style={[s.userCardTitle, { color: theme.headerText }]}>
                        ข้อมูลบัญชี
                    </Text>

                    <View style={[s.userBox, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                        {loading ? (
                            <ActivityIndicator color={theme.headerText} />
                        ) : (
                            <>
                                {/* 🟢 โชว์ชื่อตรงนี้เลย! */}
                                <Text style={[s.userText, { color: theme.headerText }]}>
                                    ชื่อ : {admin?.name}
                                </Text>
                                <Text style={[s.userText, { color: theme.headerText }]}>
                                    ตำแหน่ง : {getDisplayName(admin?.role)}
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
                <View style={s.grid}>
                    {visibleMenuItems.map((m) => (
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

            <View style={[s.bottom, { backgroundColor: theme.bottomBar }]}>
                <TouchableOpacity style={s.navItem} onPress={() => router.replace("/admin")}>
                    <View style={s.activeBg}>
                        <Ionicons name="home" size={26} color={theme.accent} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem} onPress={() => router.push("/admin/settings")}>
                    <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem} onPress={() => router.push("/admin/profile")}>
                    <Ionicons name="person-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    row: { flexDirection: "row", alignItems: "center" },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 6 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    headerTitle: { fontWeight: "bold", fontSize: 18, marginLeft: 10 },
    userCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 14, borderWidth: 1 },
    userCardTitle: { fontWeight: "bold", marginBottom: 8 },
    userBox: { borderRadius: 10, padding: 12, alignItems: "center" },
    userText: { lineHeight: 20, textAlign: "center" },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 20 },
    card: { width: "48%", borderRadius: 20, padding: 22, marginBottom: 16, alignItems: "center", minHeight: 130, elevation: 5, borderWidth: 1 },
    cardIcon: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 50, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
    cardText: { fontWeight: "bold", textAlign: "center", color: "#fff" },
    bottom: { flexDirection: "row", paddingVertical: 12, paddingBottom: 30, justifyContent: "space-around", alignItems: "center", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    navItem: { padding: 8, borderRadius: 30, minWidth: 50, alignItems: "center", justifyContent: "center" },
    activeBg: { backgroundColor: "#fff", borderRadius: 30, padding: 10, elevation: 3, width: 50, height: 50, justifyContent: "center", alignItems: "center" },
});