// prison-visit-app/app/regis/bookings.js
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator, RefreshControl, Linking } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';

import { getOfficerBookings, updateBookingStatus } from "../../service/regis.service";

const C = {
    primary: "#722F37",
    darkRed: "#5D242B",
    green: "#00C853",
    red: "#D32F2F",
    gray: "#808080",
    bg: "#F5F5F5",
    white: "#FFF",
    text: "#333",
    border: "#E0E0E0",
    blue: "#3b82f6",
    zoom: "#2D8CFF",
    line: "#00C853"
};

export default function OfficerBookingsScreen() {
    const router = useRouter();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [todayStr, setTodayStr] = useState("");
    const [thaiDate, setThaiDate] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [officerName, setOfficerName] = useState("เจ้าหน้าที่");

    const getLocalISODate = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getThaiDateStr = (dateObj) => {
        const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        return `วันที่ ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear() + 543}`;
    };

    useEffect(() => {
        const init = async () => {
            const token = await AsyncStorage.getItem("userToken");
            const savedName = await AsyncStorage.getItem("userName");
            if (!token) {
                router.replace("/admin/login");
                return;
            }
            if (savedName) setOfficerName(savedName);

            const now = new Date();
            setSelectedDate(now);
            setTodayStr(getLocalISODate(now));
            setThaiDate(getThaiDateStr(now));
        };
        init();
    }, []);

    const onDateChange = (event, newDate) => {
        setShowDatePicker(false);
        if (newDate) {
            setSelectedDate(newDate);
            setTodayStr(getLocalISODate(newDate));
            setThaiDate(getThaiDateStr(newDate));
        }
    };

    const fetchData = async (showLoading = true) => {
        if (!todayStr) return;
        if (showLoading) setLoading(true);

        try {
            const res = await getOfficerBookings(todayStr);

            let data = res.data || [];
            if (!Array.isArray(data)) {
                if (Array.isArray(res)) data = res;
                else if (res?.data && Array.isArray(res.data.data)) data = res.data.data;
            }

            const filteredData = data.filter(item => {
                const rawStatus = String(item.status || item.booking_status || item.slot?.status || "").toUpperCase().trim();
                const excludeStatuses = ["REJECT", "REJECTED", "CANCEL", "CANCELLED", "DECLINE", "ไม่อนุมัติ", "ยกเลิก"];
                return !excludeStatuses.includes(rawStatus);
            });

            const preparedData = filteredData.map(item => {
                const slot = item.slot || {};
                const inmate = item.inmate || {};
                const visitor = item.visitor || {};

                let inmateName = "-";
                if (item.inmate_info) {
                    const prefix = item.inmate_info.prefix || item.inmate_info.prefixe || item.inmate_info.prefixes_nameth || '';
                    inmateName = `${prefix}${item.inmate_info.firstname || ''} ${item.inmate_info.lastname || ''}`.trim();
                } else if (inmate.firstname) {
                    inmateName = `${inmate.firstname} ${inmate.lastname}`;
                } else if (item.inmate_fullname) {
                    inmateName = item.inmate_fullname;
                }

                const visitorName = visitor.firstname ? `${visitor.firstname} ${visitor.lastname}` : (item.visitor_name || item.relative_fullname || "-");
                const targetBookingId = item.booking_id || item.id || slot.booking_id;

                const link = slot.meeting_link || item.meeting_link || "";
                const linkLower = link.toLowerCase();
                const platformLower = (slot.device_platform || item.device_platform || item.platform || "").toLowerCase();
                const deviceLower = (slot.device_name || item.device_name || "").toLowerCase();

                const isLine = platformLower.includes("line") || deviceLower.includes("line") || linkLower.includes("line.me");
                const isWebRTC = platformLower.includes("webrtc") || platformLower.includes("rtc") || deviceLower.includes("webrtc") || linkLower.includes("duckdns.org");

                let channelDisplayName = slot.device_name || item.device_name || "Zoom";
                if (isWebRTC) channelDisplayName = "ระบบวีดีโอเยี่ยม (WebRTC)";
                else if (isLine) channelDisplayName = "LINE Video Call";

                const rawStatus = String(item.status || item.booking_status || slot.status || "PENDING").toUpperCase().trim();
                const hasLink = isWebRTC ? true : !!link;

                return {
                    ...item,
                    targetBookingId,
                    tempLink: link,
                    displayInmateName: inmateName,
                    displayVisitorName: visitorName,
                    displayTime: slot.time || item.time || item.time_slot || "-",
                    channelDisplayName,
                    hasLink,
                    isLine,
                    isWebRTC,
                    rawStatus
                };
            });

            preparedData.sort((a, b) => a.displayTime.localeCompare(b.displayTime));
            setQueue(preparedData);

        } catch (error) {
            console.warn("Fetch Queue Error:", error);
        } finally {
            if (showLoading) setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (todayStr) {
                fetchData(true);
                const intervalId = setInterval(() => fetchData(false), 5000);
                return () => clearInterval(intervalId);
            }
        }, [todayStr])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(false);
    };

    const copyToClipboard = async (text) => {
        if (!text) return;
        await Clipboard.setStringAsync(text);
        Alert.alert("สำเร็จ", "คัดลอกลิงก์แล้ว");
    };

    const openLinkOrWebRTC = async (item) => {
        let url = item.tempLink; // ดึงลิงก์จากที่ Backend ส่งมา

        if (!url || url.trim() === "") {
            if (item.isWebRTC) {
                url = `https://prison-visit-booking.duckdns.org/front.html?room=${item.targetBookingId}`;
            } else {
                Alert.alert("แจ้งเตือน", "ไม่มีลิงก์ให้เปิด");
                return;
            }
        }

        if (item.isWebRTC || url.includes("duckdns.org")) {
            // เช็คว่ามี ?room= อยู่แล้ว จะได้เติม & ต่อท้ายได้เลย
            if (url.includes("?room=")) {
                url = `${url}&role=admin`;
            }
        }

        try {
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert("ผิดพลาด", "ไม่สามารถเปิดแอปหรือเบราว์เซอร์ได้");
        }
    };

    const updateStatus = (id, newStatus, statusText) => {
        Alert.alert("ยืนยันการทำรายการ", `ต้องการอัปเดตคิวนี้เป็น "${statusText}" ใช่หรือไม่?`, [
            { text: "ยกเลิก", style: "cancel" },
            {
                text: "ยืนยัน",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await updateBookingStatus(id, newStatus);
                        Alert.alert("สำเร็จ", "อัปเดตสถานะเรียบร้อยแล้ว");
                        fetchData(true);
                    } catch (error) {
                        Alert.alert("ผิดพลาด", error.response?.data?.message || "ไม่สามารถอัปเดตสถานะได้");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const total = queue.length;
    const completed = queue.filter(q => ["COMPLETED", "สำเร็จ", "เยี่ยมสำเร็จ"].includes(q.rawStatus)).length;
    const missed = queue.filter(q => ["NO_SHOW", "MISSED", "ไม่มา", "ไม่สำเร็จ"].includes(q.rawStatus)).length;
    const pending = total - completed - missed;

    const ListItem = ({ label, value }) => (
        <View style={s.listItemRow}>
            <Ionicons name="checkmark-circle" size={18} color={C.green} style={{ marginRight: 8 }} />
            <Text style={s.listLabel}>{label} : </Text>
            <Text style={s.listValue} numberOfLines={1}>{value}</Text>
        </View>
    );

    if (!todayStr) return null;

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />

            <View style={s.curvedHeader}>
                <View style={s.headerTopRow}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtnPad}>
                        <Ionicons name="arrow-back" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <View style={s.headerTitleContainer}>
                        <Text style={s.headerTitleMain}>ตารางรอบการจอง</Text>
                        <Text style={s.headerSubTitle}>จัดการและดูตารางคิวเวลาทั้งหมด</Text>
                    </View>
                    <View style={{ width: 28 }} />
                </View>

                <View style={s.profileBox}>
                    <Text style={s.profileTitle}>ข้อมูลส่วนตัว</Text>
                    <Text style={s.profileText}>เจ้าหน้าที่ : {officerName}</Text>
                    <Text style={s.profileText}>ประจำจุด : รับเยี่ยมผู้ต้องขัง</Text>
                </View>

                <TouchableOpacity style={s.dateBox} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                    <Text style={s.dateBoxText}>{thaiDate}</Text>
                    <Ionicons name="calendar-outline" size={22} color="#555" />
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
            )}

            <ScrollView
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
            >
                <View style={s.summaryBox}>
                    <Text style={s.summaryText}>
                        สรุปวันนี้ : คิวทั้งหมด {total} | สำเร็จ {completed} | ไม่สำเร็จ {missed} | รอ {pending}
                    </Text>
                </View>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={C.primary} style={s.loader} />
                ) : queue.length === 0 ? (
                    <Text style={s.emptyText}>ไม่มีคิวจองเยี่ยมสำหรับวันที่เลือก</Text>
                ) : (
                    queue.map((item, index) => {
                        const isCompleted = ["COMPLETED", "สำเร็จ", "เยี่ยมสำเร็จ"].includes(item.rawStatus);
                        const isMissed = ["NO_SHOW", "MISSED", "ไม่มา", "ไม่สำเร็จ"].includes(item.rawStatus);
                        const isPending = !isCompleted && !isMissed;

                        return (
                            <View key={`queue-${item.targetBookingId || index}`} style={s.card}>

                                {/* 🟢 ส่วนหัว Card */}
                                <View style={s.cardHeader}>
                                    <View style={s.statusTitleContainer}>
                                        <Ionicons
                                            name={isPending ? "checkmark-circle" : (isCompleted ? "checkmark-circle" : "close-circle")}
                                            size={24}
                                            color={isPending ? C.green : (isCompleted ? C.green : C.red)}
                                        />
                                        <Text style={s.statusTitleText}>
                                            {isPending ? "รอดำเนินการ (มีลิงก์)" : (isCompleted ? "เยี่ยมสำเร็จแล้ว" : "ไม่สำเร็จ/ไม่มา")}
                                        </Text>
                                    </View>
                                    <View style={[s.statusBadge, { borderColor: isPending ? C.green : (isCompleted ? C.green : C.red) }]}>
                                        <Text style={[s.statusBadgeText, { color: isPending ? C.green : (isCompleted ? C.green : C.red) }]}>
                                            สถานะ: {isPending ? "รอดำเนินการ" : (isCompleted ? "สำเร็จ" : "ไม่สำเร็จ")}
                                        </Text>
                                    </View>
                                </View>

                                {/* 🟢 ข้อมูลผู้ต้องขัง */}
                                <View style={s.listContainer}>
                                    <ListItem label="ผู้ต้องขัง" value={item.displayInmateName} />
                                    <ListItem label="ผู้เข้าเยี่ยม" value={item.displayVisitorName} />
                                    <ListItem label="เวลา" value={`${item.displayTime} (${item.channelDisplayName})`} />
                                </View>

                                {/* 🟢 กล่องแสดง Link */}
                                {isPending && (
                                    <View style={s.linkBoxContainer}>
                                        <View style={s.linkHeader}>
                                            <Ionicons name="videocam" size={16} color={C.blue} style={{ marginRight: 5 }} />
                                            <Text style={s.linkHeaderText}>ลิงก์เข้าร่วม ({item.isLine ? 'LINE' : (item.isWebRTC ? 'WebRTC' : 'Zoom')})</Text>
                                        </View>

                                        <View style={s.linkInputBox}>
                                            <Text style={s.linkText} numberOfLines={1} ellipsizeMode="tail">
                                                {item.isWebRTC ? "ระบบแอปพลิเคชัน (ไม่ต้องใช้ลิงก์)" : (item.tempLink || "ระบบยังไม่สร้างลิงก์")}
                                            </Text>
                                            {!item.isWebRTC && item.tempLink && (
                                                <TouchableOpacity onPress={() => copyToClipboard(item.tempLink)}>
                                                    <Ionicons name="copy-outline" size={20} color="#666" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <TouchableOpacity
                                            style={[s.openLinkBtn, { backgroundColor: item.hasLink ? C.blue : '#B0BEC5' }]}
                                            onPress={() => openLinkOrWebRTC(item)}
                                            disabled={!item.hasLink}
                                        >
                                            <Ionicons name="open-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                            <Text style={s.openLinkText}>เปิดลิงก์ / แอปพลิเคชัน</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* 🟢 ปุ่มทำรายการหลังเยี่ยมเสร็จ */}
                                {isPending && (
                                    <View style={s.actionBtnRow}>
                                        <TouchableOpacity
                                            style={[s.actionBtn, { backgroundColor: C.green, marginRight: 5 }]}
                                            onPress={() => updateStatus(item.targetBookingId, "COMPLETED", "เยี่ยมสำเร็จ")}
                                        >
                                            <Text style={s.actionBtnText}>เยี่ยมสำเร็จ</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[s.actionBtn, { backgroundColor: C.red, marginLeft: 5 }]}
                                            onPress={() => updateStatus(item.targetBookingId, "NO_SHOW", "ไม่สำเร็จ/ไม่มา")}
                                        >
                                            <Text style={s.actionBtnText}>ไม่สำเร็จ (ไม่มา)</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    curvedHeader: {
        backgroundColor: C.primary,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 40,
        elevation: 5,
        zIndex: 10,
    },
    headerTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    backBtnPad: {
        padding: 5,
    },
    headerTitleContainer: {
        alignItems: "center",
    },
    headerTitleMain: {
        color: C.white,
        fontSize: 20,
        fontWeight: "bold",
    },
    headerSubTitle: {
        color: "#E0E0E0",
        fontSize: 12,
        marginTop: 2,
    },
    profileBox: {
        backgroundColor: C.darkRed,
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    profileTitle: {
        color: C.white,
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    profileText: {
        color: C.white,
        fontSize: 14,
        marginBottom: 2,
        opacity: 0.9,
    },
    dateBox: {
        flexDirection: "row",
        backgroundColor: C.white,
        borderRadius: 10,
        paddingHorizontal: 15,
        alignItems: "center",
        justifyContent: "space-between",
        height: 45,
        position: "absolute",
        bottom: -20,
        left: 20,
        right: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: "#DDD",
    },
    dateBoxText: {
        fontSize: 15,
        color: "#333",
        fontWeight: "500",
    },
    scrollContent: {
        padding: 16,
        paddingTop: 35,
        paddingBottom: 50,
    },
    summaryBox: {
        backgroundColor: "#FFF",
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#CCC",
    },
    summaryText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#444",
        textAlign: "center",
    },
    loader: {
        marginTop: 50,
    },
    emptyText: {
        textAlign: "center",
        color: "#888",
        marginTop: 30,
        fontSize: 16,
    },
    card: {
        backgroundColor: C.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#EEE",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    statusTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    statusTitleText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginLeft: 8,
    },
    statusBadge: {
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusBadgeText: {
        fontWeight: "bold",
        fontSize: 11,
    },
    listContainer: {
        marginBottom: 10,
    },
    listItemRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    listLabel: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },
    listValue: {
        fontSize: 14,
        color: "#555",
        flex: 1,
    },
    linkBoxContainer: {
        backgroundColor: "#F9F9F9",
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        marginBottom: 15,
    },
    linkHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    linkHeaderText: {
        fontSize: 13,
        fontWeight: "bold",
        color: C.blue,
    },
    linkInputBox: {
        flexDirection: "row",
        backgroundColor: "#EEEEEE",
        borderRadius: 6,
        padding: 10,
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#DDD",
    },
    linkText: {
        fontSize: 13,
        color: "#555",
        flex: 1,
        marginRight: 10,
    },
    openLinkBtn: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 12,
        borderRadius: 25,
    },
    openLinkText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
    },
    actionBtnRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    actionBtnText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
    },
});