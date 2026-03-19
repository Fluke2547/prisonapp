// prison-visit-app/app/regis/history.js
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    StatusBar,
    ActivityIndicator,
    Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';

import { getVisitHistory } from "../../service/regis.service";

const C = {
    primary: "#722F37",
    darkRed: "#5D242B",
    green: "#00C853",
    red: "#FF0000",
    gray: "#808080",
    bg: "#F5F5F5",
    white: "#FFF",
    text: "#333",
    border: "#CCC",
    subText: "#666"
};

export default function OfficerHistoryScreen() {
    const router = useRouter();
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchId, setSearchId] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const formatThaiDate = (dateObj) => {
        const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        return `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear() + 543}`;
    };

    const formatAPIDate = (dateObj) => {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = {
                start_date: formatAPIDate(startDate),
                end_date: formatAPIDate(startDate)
            };

            if (searchId.trim() !== "") {
                if (searchId.length >= 13) {
                    params.relative_id = searchId.trim();
                } else {
                    params.inmate_id = searchId.trim();
                }
            }

            const res = await getVisitHistory(params);
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);

            // เรียงลำดับจากเวลาล่าสุด
            const sortedData = data.sort((a, b) => {
                const timeA = a.slot?.time || a.time || a.time_slot || "00:00";
                const timeB = b.slot?.time || b.time || b.time_slot || "00:00";
                return timeB.localeCompare(timeA);
            });

            setHistoryData(sortedData);
        } catch (error) {
            console.warn("Fetch History Error:", error);
            Alert.alert("ผิดพลาด", "ไม่สามารถดึงข้อมูลประวัติได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [startDate]);

    const onDateChange = (event, newDate) => {
        setShowPicker(false);
        if (newDate) {
            setStartDate(newDate);
        }
    };

    const getStatusInfo = (rawStatus) => {
        const s = String(rawStatus).toUpperCase().trim();

        // สำเร็จ
        if (s.includes("COMPLETE") || s.includes("SUCCESS") || s.includes("เยี่ยมสำเร็จ")) {
            return { text: "เยี่ยมสำเร็จ", color: C.green, icon: "checkmark-circle" };
        }

        // ไม่มาตามนัด
        if (s.includes("NO_SHOW") || s.includes("MISSED")) {
            return { text: "ไม่สำเร็จ/ไม่มา", color: C.red, icon: "close-circle" };
        }

        // ยกเลิก
        if (
            s.includes("CANCEL") ||
            s.includes("REJECT") ||
            s.includes("DECLINE") ||
            s.includes("VOID") ||
            s.includes("ยกเลิก")
        ) {
            return { text: "ยกเลิก/ไม่อนุมัติ", color: C.gray, icon: "ban" };
        }

        return { text: "", color: C.primary, icon: "time" };
    };

    // 🟢 อัปเกรดฟังก์ชันนี้ให้ดักจับชื่อตัวแปรได้ทุกรูปแบบ
    const getProcessedItem = (item) => {


        const targetId = item.booking_id || item.id || item.slot?.booking_id || "-";

        // ดักชื่อผู้ต้องขังทุกรูปแบบที่เป็นไปได้
        let inmateName = "-";
        if (item.inmate_fullname) inmateName = item.inmate_fullname;
        else if (item.inmate_name) inmateName = item.inmate_name;
        else if (item.inmate_firstname) inmateName = `${item.inmate_firstname} ${item.inmate_lastname || ''}`;
        else if (item.inmate?.firstname) inmateName = `${item.inmate.firstname} ${item.inmate.lastname || ''}`;

        // ดักชื่อญาติทุกรูปแบบ
        let visitorName = "-";
        if (item.relative_fullname) visitorName = item.relative_fullname;
        else if (item.relative_name) visitorName = item.relative_name;
        else if (item.visitor_name) visitorName = item.visitor_name;
        else if (item.visitor?.firstname) visitorName = `${item.visitor.firstname} ${item.visitor.lastname || ''}`;

        // ดักเวลาและวันที่
        const visitTime = item.time_slot || item.booking_time || item.time || item.slot?.time || "-";
        const visitDate = item.date || item.booking_date || item.visit_date || item.slot?.date || "-";

        // ดักช่องทางเยี่ยม
        let rawChannel = String(item.platform || item.platform_name || item.device_name || item.slot?.device_name || "-").toLowerCase();
        let channelDisplayName = item.platform || item.device_name || "-";

        if (rawChannel.includes('webrtc') || rawChannel.includes('rtc')) channelDisplayName = "ระบบวีดีโอเยี่ยม (WebRTC)";
        else if (rawChannel.includes('line')) channelDisplayName = "LINE Video Call";
        else if (rawChannel.includes('zoom')) channelDisplayName = "Zoom Meeting";

        const rawStatus = String(item.status || item.booking_status || item.slot?.status || "").toUpperCase().trim();
        const statusInfo = getStatusInfo(rawStatus);

        return { targetId, inmateName, visitorName, visitDate, visitTime, channelDisplayName, statusInfo };
    };

    const InfoRow = ({ icon, label, value }) => (
        <View style={s.infoRow}>
            <Ionicons name={icon} size={18} color="#555" style={s.infoIcon} />
            <Text style={s.label}>{label} :</Text>
            <Text style={s.value} numberOfLines={1}>{value}</Text>
        </View>
    );

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />

            <View style={s.curvedHeader}>
                <View style={s.headerTopRow}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtnPad}>
                        <Ionicons name="arrow-back" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <View style={s.headerTitleContainer}>
                        <Text style={s.headerTitleMain}>ประวัติการจอง</Text>
                        <Text style={s.headerSubTitle}>ตรวจสอบประวัติการเยี่ยมย้อนหลัง</Text>
                    </View>
                    <View style={{ width: 28 }} />
                </View>
            </View>

            <View style={s.filterCard}>
                <View style={s.filterRow}>
                    <Text style={s.filterLabel}>วันที่ค้นหา :</Text>
                    <TouchableOpacity style={s.dateBtn} onPress={() => setShowPicker(true)}>
                        <Ionicons name="calendar-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
                        <Text style={s.dateBtnText}>{formatThaiDate(startDate)}</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.searchRow}>
                    <TextInput
                        style={s.searchInput}
                        placeholder="รหัสผู้ต้องขัง หรือ เลขบัตร ปชช. ญาติ"
                        value={searchId}
                        onChangeText={setSearchId}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity style={s.searchBtn} onPress={fetchHistory}>
                        <Ionicons name="search" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {showPicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color={C.primary} style={s.loader} />
                ) : historyData.length === 0 ? (
                    <View style={s.emptyBox}>
                        <Ionicons name="document-text-outline" size={50} color="#CCC" />
                        <Text style={s.emptyText}>ไม่มีประวัติการจองในวันที่เลือก</Text>
                    </View>
                ) : (
                    historyData.map((item, index) => {
                        const { targetId, inmateName, visitorName, visitDate, visitTime, channelDisplayName, statusInfo } = getProcessedItem(item);

                        return (
                            <View key={`hist-${targetId || index}`} style={s.card}>
                                <View style={s.cardHeader}>
                                    <View style={s.timeContainer}>
                                        <Ionicons name="calendar" size={18} color="#333" style={s.timeIcon} />
                                        <Text style={s.dateText}>{visitDate}</Text>
                                        <Text style={s.timeText}>({visitTime})</Text>
                                    </View>

                                    <View style={[s.statusBadge, { backgroundColor: statusInfo.color }]}>
                                        <Ionicons name={statusInfo.icon} size={14} color="#FFF" />
                                        <Text style={s.statusBadgeText}>{statusInfo.text}</Text>
                                    </View>
                                </View>

                                <InfoRow icon="person" label="ผู้ต้องขัง" value={inmateName} />
                                <InfoRow icon="people" label="ผู้เข้าเยี่ยม" value={visitorName} />
                                <InfoRow icon="laptop-outline" label="ช่องทาง" value={channelDisplayName} />
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    // Header
    curvedHeader: {
        backgroundColor: C.primary,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 60 : 45,
        paddingBottom: 30,
        elevation: 5,
        zIndex: 10
    },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtnPad: { padding: 5 },
    headerTitleContainer: { alignItems: 'center' },
    headerTitleMain: { color: C.white, fontSize: 20, fontWeight: 'bold' },
    headerSubTitle: { color: "#E0E0E0", fontSize: 12, marginTop: 2 },

    // Filter Section
    filterCard: {
        backgroundColor: C.white,
        marginHorizontal: 16,
        marginTop: -15,
        borderRadius: 16,
        padding: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 20,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    filterLabel: { fontSize: 14, fontWeight: 'bold', color: C.text },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#F9F9F9",
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8
    },
    dateBtnText: { fontSize: 14, color: C.primary, fontWeight: 'bold' },
    searchRow: { flexDirection: 'row', gap: 10 },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 45,
        backgroundColor: "#FAFAFA",
        fontSize: 14
    },
    searchBtn: {
        backgroundColor: C.primary,
        width: 45,
        height: 45,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },

    // List Section
    scrollContent: { padding: 16, paddingBottom: 50 },
    loader: { marginTop: 50 },
    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#999', marginTop: 10, fontSize: 15 },

    // Card
    card: {
        backgroundColor: C.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 10
    },
    timeContainer: { flexDirection: 'row', alignItems: 'center' },
    timeIcon: { marginRight: 6 },
    dateText: { fontSize: 15, fontWeight: 'bold', color: '#000', marginRight: 5 },
    timeText: { fontSize: 14, color: C.subText },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4
    },
    statusBadgeText: { fontWeight: 'bold', fontSize: 11, color: '#FFF' },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoIcon: { marginRight: 8 },
    label: { width: 90, fontSize: 14, color: '#444', fontWeight: 'bold' },
    value: { flex: 1, fontSize: 14, color: '#222' }
});