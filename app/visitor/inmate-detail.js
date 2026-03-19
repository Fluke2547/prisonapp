//prison-visit-app/app/visitor/inmate-detail.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getInmateDetailById } from "../../service/inmate.service";

const C = { primary: "#722F37", text: "#333", subtext: "#666", card: "#FFFFFF", bg: "#F5F5F5", divider: "#E0E0E0", iconColor: "#722F37" };

export default function InmateDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [inmate, setInmate] = useState({
        id: params.id,
        name: params.name || "กำลังโหลด...",
        code: params.code || "-",
        gender: params.gender,
        birthDate: "-",
        age: "-",
        status: "อยู่ระหว่างคุมขัง",
        bookingStatus: "อนุญาตให้เยี่ยม",
        zone: params.gender === 'female' ? "แดนหญิง" : "แดนชาย",
        relatives: []
    });

    const [loading, setLoading] = useState(true);

    const formatDateThai = (dateString) => {
        if (!dateString) return "-";
        try {
            const dateObj = new Date(dateString);
            if (isNaN(dateObj.getTime())) return dateString;
            const day = dateObj.getDate();
            const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
            const month = months[dateObj.getMonth()];
            const year = dateObj.getFullYear() + 543;
            return `${day} ${month} ${year}`;
        } catch (e) {
            return dateString;
        }
    };

    useEffect(() => {
        const fetchDetail = async () => {
            if (!params.id) return;

            try {
                const response = await getInmateDetailById(params.id);
                const data = response.data;

                if (data) {
                    let formattedRelatives = [];
                    if (data.relation || data.relationship) {
                        formattedRelatives.push({ name: "ญาติที่ผูกบัญชีไว้", relation: data.relation || data.relationship });
                    } else if (Array.isArray(data.relatives)) {
                        formattedRelatives = data.relatives.map(r => ({ name: r.name || r.visitor_name || "-", relation: r.relation || r.relationship || "-" }));
                    } else if (data.type_name_relationship_th) {
                        formattedRelatives.push({ name: data.visitor_firstname ? `${data.visitor_firstname} ${data.visitor_lastname}` : "ข้อมูลของคุณ", relation: data.type_name_relationship_th });
                    }

                    setInmate(prev => ({
                        ...prev,
                        name: data.fullname || prev.name,
                        code: data.inmate_number || data.inmate_code || params.code || prev.code,
                        birthDate: formatDateThai(data.birthdate) || prev.birthDate, // 🟢 ดึง birthdate และแปลงเป็นไทย
                        age: data.age ? data.age.toString() : prev.age,
                        status: data.status || prev.status,
                        zone: data.location_name || prev.zone,
                        relatives: formattedRelatives 
                    }));
                }
            } catch (error) {
                console.log("⚠️ Backend Error: ใช้ข้อมูลสำรองจาก Params");
                setInmate(prev => ({ ...prev, code: params.code || prev.code, name: params.name || prev.name }));
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [params.id]);

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

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

                <View style={s.mainCard}>
                    <Text style={s.cardHeaderTitle}>ข้อมูลผู้ต้องขัง</Text>

                    <View style={s.profileContainer}>
                        <View style={s.avatarCircle}>
                            <Ionicons name="person" size={50} color="#BDBDBD" />
                        </View>
                    </View>

                    <Text style={s.fullName}>{inmate.name}</Text>
                    <Text style={s.sectionHeader}>ข้อมูลส่วนตัวของผู้ต้องขัง</Text>

                    <View style={s.infoRow}>
                        <View style={s.iconBox}><MaterialCommunityIcons name="card-account-details" size={24} color={C.iconColor} /></View>
                        <View style={s.infoTextContainer}>
                            <Text style={s.infoLabel}>รหัสผู้ต้องขัง :</Text>
                            <Text style={s.infoValue}>{inmate.code}</Text>
                        </View>
                    </View>
                    <View style={s.divider} />

                    <View style={s.infoRow}>
                        <View style={s.iconBox}><FontAwesome5 name="calendar-alt" size={20} color={C.iconColor} /></View>
                        <View style={s.infoTextContainer}>
                            <Text style={s.infoLabel}>วันเดือนปีเกิด: {inmate.birthDate}</Text>
                            <Text style={s.infoLabel}>อายุ: {inmate.age} ปี</Text>
                        </View>
                    </View>
                    <View style={s.divider} />

                    <View style={s.infoRow}>
                        <View style={s.iconBox}><MaterialCommunityIcons name="shield-account" size={24} color={C.iconColor} /></View>
                        <View style={s.infoTextContainer}>
                            <Text style={s.infoLabel}>สถานะของผู้ต้องขัง: {inmate.status}</Text>
                            <Text style={s.infoLabel}>สถานะเกี่ยวกับการจอง: {inmate.bookingStatus}</Text>
                        </View>
                    </View>
                    <View style={s.divider} />

                    <View style={s.infoRowLast}>
                        <View style={s.iconBox}><Ionicons name="location-sharp" size={24} color={C.iconColor} /></View>
                        <View style={s.infoTextContainer}>
                            <Text style={s.infoLabel}>แดนที่อยู่ :</Text>
                            <Text style={s.infoValue}>{inmate.zone}</Text>
                        </View>
                    </View>
                    <View style={s.divider} />

                    <View style={{ marginTop: 16 }}>
                        <Text style={[s.sectionHeader, { color: C.primary, fontSize: 14 }]}>ข้อมูลความสัมพันธ์กับญาติ</Text>
                        {inmate.relatives.length > 0 ? (
                            inmate.relatives.map((rel, index) => (
                                <View key={index} style={{ marginBottom: 12 }}>
                                    <Text style={s.relText}>เกี่ยวข้องกับ : {rel.name}</Text>
                                    <Text style={s.relText}>ความสัมพันธ์ : {rel.relation}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={s.relText}>- รอข้อมูลจากระบบ -</Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={s.visitButton}
                    activeOpacity={0.8}
                    onPress={() => {
                        router.push({
                            pathname: "/visitor/booking",
                            params: { inmateId: inmate.id, inmateName: inmate.name, inmateCode: inmate.code, gender: inmate.gender }
                        });
                    }}
                >
                    <View style={s.visitContent}>
                        <View style={s.visitIconCircle}><Ionicons name="calendar" size={24} color={C.primary} /></View>
                        <View>
                            <Text style={s.visitTitle}>กำหนดการเยี่ยม</Text>
                            <Text style={s.visitSub}>กดเพื่อดูรายละเอียดวันเยี่ยม</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={C.primary} />
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // --- Header Section ---
    header: {
        backgroundColor: C.primary,
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: {
        position: "absolute",
        left: 16,
        bottom: 12,
        padding: 4,
    },
    headerCenter: {
        alignItems: "center",
    },
    headerTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    headerSub: {
        color: "#F3E8EA",
        fontSize: 12,
        marginTop: 2,
    },
    mainCard: {
        backgroundColor: C.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#EEE",
    },
    cardHeaderTitle: {
        textAlign: "center",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#000",
    },
    profileContainer: {
        alignItems: "center",
        marginBottom: 10,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#E0E0E0",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#FFF",
        elevation: 1,
    },
    fullName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
        textAlign: "center",
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 15,
        fontWeight: "bold",
        color: C.primary,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 12,
    },
    infoRowLast: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 12,
        paddingBottom: 4,
    },
    iconBox: {
        width: 30,
        alignItems: "center",
        marginRight: 10,
        marginTop: 2,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: C.text,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: C.text,
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: C.divider,
        marginLeft: 40,
    },
    relText: {
        fontSize: 14,
        color: C.text,
        lineHeight: 20,
    },

    visitButton: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        marginBottom: 20,
    },
    visitContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    visitIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFF3E0",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    visitTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000",
    },
    visitSub: {
        fontSize: 12,
        color: C.subtext,
    },
});