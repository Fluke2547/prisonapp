//prison-visit-app/app/visitor/inmate.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getInmateInfo, getInmateDetailById } from "../../service/inmate.service";

const C = {
    primary: "#722F37",
    text: "#333",
    subtext: "#666",
    card: "#FFFFFF",
    bg: "#F5F5F5",
    buttonBg: "#722F37",
};

export default function InmateScreen() {
    const router = useRouter();
    const [inmates, setInmates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const apiResponse = await getInmateInfo();
                const rawList = Array.isArray(apiResponse) ? apiResponse : (apiResponse.data || []);

                const formattedData = rawList.map((item) => ({
                    id: item.id || item.inmate_id,
                    name: item.fullname || item.inmate_firstname || "(รอข้อมูลชื่อ)",
                    code: item.inmate_number || item.inmate_code || "-",
                    gender: item.inmate_gender || 'male',
                    status: item.status || "อยู่ระหว่างคุมขัง",
                    bookingStatus: "อนุญาตให้เยี่ยม",
                }));

                setInmates(formattedData);

            } catch (error) {
                console.error("Error loading inmates:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={{ marginTop: 10, color: C.subtext }}>กำลังโหลดข้อมูล...</Text>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>ข้อมูลผู้ต้องขัง</Text>
                    <Text style={s.headerSub}>แสดงข้อมูลของผู้ต้องขังที่ท่านได้ลงชื่อไว้</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {inmates.length > 0 ? (
                    inmates.map((item, index) => (
                        <View key={index} style={s.cardContainer}>
                            <View style={s.cardHeader}>
                                <Text style={s.cardHeaderTitle}>ข้อมูลผู้ต้องขัง</Text>
                            </View>

                            <View style={s.cardBody}>
                                <View style={s.avatarCircle}>
                                    <Ionicons name="person" size={50} color="#CCC" />
                                </View>

                                <Text style={s.nameText}>{item.name}</Text>
                                <Text style={s.detailText}>รหัสผู้ต้องขัง : {item.code}</Text>
                                <Text style={s.detailText}>สถานะของผู้ต้องขัง: {item.status}</Text>
                                <Text style={s.detailText}>สถานะเกี่ยวกับการจอง: {item.bookingStatus}</Text>

                                <TouchableOpacity
                                    style={s.actionButton}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        router.push({
                                            pathname: "/visitor/inmate-detail",
                                            params: {
                                                id: item.id,
                                                name: item.name,
                                                code: item.code,
                                                gender: item.gender
                                            }
                                        });
                                    }}
                                >
                                    <View>
                                        <Text style={s.btnTitle}>ข้อมูลส่วนตัวของผู้ต้องขัง</Text>
                                        <Text style={s.btnSub}>กดเพื่อดูรายละเอียดข้อมูลส่วนตัวของผู้ต้องขัง</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Ionicons name="folder-open-outline" size={60} color="#DDD" />
                        <Text style={{ color: C.subtext, marginTop: 10 }}>ไม่พบข้อมูลผู้ต้องขัง</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
        backgroundColor: C.primary,
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: { position: "absolute", left: 16, bottom: 12, padding: 4 },
    headerCenter: { alignItems: "center" },
    headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
    headerSub: { color: "#F3E8EA", fontSize: 12, marginTop: 2 },

    cardContainer: {
        borderRadius: 16,
        backgroundColor: C.card,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#E0E0E0"
    },
    cardHeader: {
        backgroundColor: "#6D2E35",
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardHeaderTitle: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    cardBody: {
        padding: 20,
        alignItems: 'center',
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F0F0F0",
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#DDD"
    },
    nameText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 12,
        textAlign: 'center'
    },
    detailText: {
        fontSize: 14,
        color: "#333",
        marginBottom: 4,
        textAlign: 'center'
    },
    actionButton: {
        marginTop: 20,
        backgroundColor: "#6D2E35",
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    btnTitle: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "bold",
    },
    btnSub: {
        color: "#DAB6B6",
        fontSize: 10,
        marginTop: 2
    },
});