// prison-visit-app/app/admin/manage-booking.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, StatusBar, Linking } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAdminVisitBookings, cancelBooking } from "../../service/admin.service";

const COLORS = {
    primary: "#722F37",
    green: "#00C853",
    red: "#D32F2F",
    blue: "#4285F4",
    bg: "#F5F5F5",
    white: "#FFF",
    orange: "#FF9800",
    text: "#333",
    border: "#E0E0E0"
};

export default function AdminManageBooking() {
    const router = useRouter();
    const [date, setDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    useEffect(() => {
        fetchData(true);
        const intervalId = setInterval(() => {
            fetchData(false);
        }, 5000);
        return () => clearInterval(intervalId);
    }, [date]);

    // 🟢 1. ตัวช่วยดึงวันที่ตามเวลาไทยเป๊ะๆ (ไม่ให้โดน Timezone ดึงถอยหลัง)
    const getLocalISODate = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 🟢 ตัวช่วยแปลงเป็นวันที่แบบไทย เผื่อ Backend ส่งมาเป็นภาษาไทย
    const getThaiDateStr = (dateObj) => {
        const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        return `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear() + 543}`;
    };

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const dateStr = getLocalISODate(date); // YYYY-MM-DD
            const thaiStr = getThaiDateStr(date);  // DD MMMM YYYY
            const params = { date: dateStr };

            const res = await getAdminVisitBookings(params);
            let data = res.data || [];

            // 🟢 2. ดักกรองวันที่ขั้นเด็ดขาด (Strict Filter) 
            // ป้องกัน Backend มั่ว ส่งวันที่อื่นปนมา
            data = data.filter(item => {
                const d1 = item.slot?.visit_date || item.slot?.date;
                const d2 = item.visit_date;
                const d3 = item.date;
                return [d1, d2, d3].some(d => {
                    if (!d) return false;
                    const str = String(d);
                    return str.includes(dateStr) || str.includes(thaiStr);
                });
            });

            const preparedData = data.map(item => {
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
                const isZoom = platformLower.includes("zoom") || (!isLine && !isWebRTC && (linkLower.includes("zoom") || link.length > 0));

                const rawStatus = item.booking_status || item.status || item.state || slot.booking_status || slot.status || "ไม่ระบุ";
                const statusStr = String(rawStatus).toUpperCase();

                const hasLink = isWebRTC ? true : !!link; 

                return {
                    ...item,
                    targetBookingId,
                    tempLink: link,
                    displayInmateName: inmateName,
                    displayVisitorName: visitorName,
                    displayVisitDate: slot.visit_date || item.visit_date || item.date || "-",
                    displayTime: slot.time || item.time || item.time_slot || "-",
                    displayDevice: slot.device_name || item.device_name || "-",
                    hasLink,
                    isLine,
                    isWebRTC,
                    isZoom,
                    currentStatus: statusStr, 
                    rawStatus: rawStatus 
                };
            });

            preparedData.sort((a, b) => {
                const idA = a.targetBookingId || 0;
                const idB = b.targetBookingId || 0;
                return idB - idA;
            });

            setBookings(preparedData);
        } catch (error) {
            console.warn("Fetch Error:", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };
    
    const copyToClipboard = async (text) => {
        if (!text) return;
        await Clipboard.setStringAsync(text);
        Alert.alert("สำเร็จ", "คัดลอกลิงก์แล้ว");
    };

    const openLinkOrWebRTC = async (item) => {
        if (item.isWebRTC) {
            router.push({
                pathname: '/regis/video-call', 
                params: { room: item.targetBookingId, visitorName: item.displayVisitorName, inmateName: item.displayInmateName }
            });
            return;
        }

        const url = item.tempLink;
        if (!url || url.trim() === "") {
            Alert.alert("แจ้งเตือน", "ไม่มีลิงก์ให้เปิด");
            return;
        }
        try {
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert("ผิดพลาด", "ไม่สามารถเปิดแอปได้ กรุณาตรวจสอบลิงก์");
        }
    };

    const changeDate = (offset) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + offset);
        setDate(newDate);
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    const onRejectPress = (item) => {
        setSelectedBooking(item);
        setRejectReason("");
        setRejectModalVisible(true);
    };

    const confirmReject = async () => {
        if (!rejectReason.trim()) {
            Alert.alert("แจ้งเตือน", "กรุณาระบุเหตุผลที่ไม่อนุมัติ (ยกเลิกคิว)");
            return;
        }
        try {
            await cancelBooking(selectedBooking.targetBookingId, rejectReason);
            setRejectModalVisible(false);
            Alert.alert("สำเร็จ", "ยกเลิกคิวเยี่ยมเรียบร้อยแล้ว");
            fetchData(true);
        } catch (error) {
            const msg = error.response?.data?.message || "ทำรายการไม่สำเร็จ";
            Alert.alert("ผิดพลาด", msg);
        }
    };

    const activeBookings = bookings.filter(item => {
        const s = item.currentStatus || "";
        return !s.includes('REJECT') && 
               !s.includes('CANCEL') && 
               !s.includes('ยกเลิก') && 
               !s.includes('ปฏิเสธ') &&
               !s.includes('ไม่อนุมัติ') &&
               !s.includes('AVAILABLE') && 
               !s.includes('ว่าง'); 
    });

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={26} color="#FFF" /></TouchableOpacity>
                <View style={s.headerTitleWrap}>
                    <Text style={s.headerTitle}>จัดการคิวเยี่ยม</Text>
                    <Text style={s.headerSub}>ตรวจสอบรายการจองและจัดการลิงก์เข้าเยี่ยม</Text>
                </View>
            </View>

            <View style={s.dateBar}>
                <TouchableOpacity onPress={() => changeDate(-1)} style={{ padding: 5 }}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={s.dateCenterBtn} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <Text style={s.dateLabel}>{getThaiDateStr(date)}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeDate(1)} style={{ padding: 5 }}>
                    <Ionicons name="chevron-forward" size={28} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
            )}

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} /> :
                    activeBookings.length === 0 ? <Text style={s.emptyText}>ไม่มีรายการจองคิวเยี่ยมในวันนี้</Text> :
                        activeBookings.map((item) => (
                            <View key={item.targetBookingId} style={s.card}>
                                <View style={s.statusHeader}>
                                    <Ionicons name={item.hasLink ? "checkmark-circle" : "time"} size={28} color={item.hasLink ? COLORS.green : COLORS.orange} />
                                    <Text style={s.statusText}>{item.hasLink ? "รอดำเนินการ (มีลิงก์)" : "จองสำเร็จ (รอระบบสร้างลิงก์)"}</Text>

                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <View style={[s.badge, item.currentStatus.includes('REJECT') && {borderColor: 'red', backgroundColor: '#FFEBEE'}]}>
                                            <Text style={[s.badgeText, item.currentStatus.includes('REJECT') && {color: 'red'}]}>
                                                สถานะ: {item.rawStatus}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={s.detailBox}>
                                    <InfoRow label="ผู้ต้องขัง" value={item.displayInmateName} />
                                    <InfoRow label="ผู้เข้าเยี่ยม" value={item.displayVisitorName} />
                                    <InfoRow label="เวลา" value={`${item.displayTime} (${item.displayDevice})`} />
                                </View>

                                <View style={[s.zoomSection, 
                                    item.isWebRTC ? { borderColor: '#B71C1C', backgroundColor: '#FFEBEE' } : 
                                    item.isLine ? { borderColor: '#00C853', backgroundColor: '#E8F5E9' } : {}
                                ]}>
                                    <View style={s.zoomHeader}>
                                        <Ionicons 
                                            name={item.isLine ? "chatbubble-ellipses" : "videocam"} 
                                            size={16} 
                                            color={item.isWebRTC ? "#B71C1C" : item.isLine ? "#00C853" : "#2D8CFF"} 
                                        />
                                        <Text style={[s.zoomHeaderText, 
                                            item.isWebRTC ? { color: '#B71C1C' } : 
                                            item.isLine ? { color: '#00C853' } : { color: '#2D8CFF' }
                                        ]}>
                                            {item.isWebRTC ? " ระบบวีดีโอเยี่ยม (WebRTC)" : 
                                             item.isLine ? " ข้อมูลติดต่อ LINE" : " ลิงก์เข้าร่วม (Zoom)"}
                                        </Text>
                                    </View>

                                    <View style={s.inputContainer}>
                                        <TextInput
                                            style={[s.textInput, { color: '#666' }]}
                                            placeholder={item.isWebRTC ? "ระบบแอปพลิเคชัน ไม่ต้องใช้ลิงก์" : "ไม่มีข้อมูลลิงก์"}
                                            value={item.isWebRTC ? "WebRTC Room (In-App)" : item.tempLink}
                                            editable={false}
                                        />
                                        {!item.isWebRTC && (
                                            <TouchableOpacity onPress={() => copyToClipboard(item.tempLink)} style={s.copyBtn}>
                                                <MaterialCommunityIcons name="content-copy" size={20} color="#666" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[s.btnOpenLink, 
                                            !item.hasLink && { opacity: 0.5 },
                                            item.isWebRTC && { backgroundColor: '#B71C1C' },
                                            item.isLine && { backgroundColor: '#00C853' }
                                        ]}
                                        onPress={() => openLinkOrWebRTC(item)}
                                        disabled={!item.hasLink}
                                    >
                                        <Ionicons name={item.isWebRTC ? "videocam" : "open-outline"} size={20} color="#FFF" style={{ marginRight: 8 }} />
                                        <Text style={s.btnOpenLinkText}>
                                            {item.isWebRTC ? "เปิดกล้องวิดีโอสนทนา" : "เปิดลิงก์/แอปพลิเคชัน"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={s.btnReject} onPress={() => onRejectPress(item)}>
                                    <Text style={s.btnRejectText}>ไม่อนุมัติ (ยกเลิกคิวนี้)</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                }
                <View style={{ height: 50 }} />
            </ScrollView>

            <Modal visible={rejectModalVisible} transparent={true} animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <Text style={s.modalTitle}>ต้องการยกเลิก/ไม่อนุมัติคิวนี้หรือไม่ ?</Text>

                        {selectedBooking && (
                            <View style={s.modalDetailBox}>
                                <ModalInfoRow label="ผู้ต้องขัง" value={selectedBooking.displayInmateName} />
                                <ModalInfoRow label="ผู้เข้าเยี่ยม" value={selectedBooking.displayVisitorName} />
                                <ModalInfoRow label="เวลา" value={`${selectedBooking.displayTime} (${selectedBooking.displayDevice})`} />
                            </View>
                        )}

                        <TextInput
                            style={s.modalInput}
                            placeholder="โปรดพิมพ์เหตุผลที่ท่านไม่อนุมัติ/ยกเลิกการจองเยี่ยมครั้งนี้"
                            multiline
                            numberOfLines={4}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            placeholderTextColor="#999"
                        />

                        <View style={s.modalBtnRow}>
                            <TouchableOpacity style={s.modalBtnConfirm} onPress={confirmReject}>
                                <Text style={s.modalBtnConfirmText}>ยืนยันการยกเลิกคิว</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.modalBtnCancel} onPress={() => setRejectModalVisible(false)}>
                                <Text style={s.modalBtnCancelText}>ปิด</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const InfoRow = ({ label, value }) => (
    <View style={s.infoRow}>
        <Ionicons name="checkmark-circle" size={16} color={COLORS.green} style={{ marginRight: 8 }} />
        <Text style={s.infoLabel}>{label} : </Text>
        <Text style={s.infoValue}>{value}</Text>
    </View>
);

const ModalInfoRow = ({ label, value }) => (
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#555', width: 90 }}>{label} : </Text>
        <Text style={{ fontSize: 13, color: '#333', flex: 1 }}>{value}</Text>
    </View>
);

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    header: {
        backgroundColor: COLORS.primary,
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: "center",
        marginRight: 30,
    },
    headerTitle: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },
    headerSub: {
        color: "#E0E0E0",
        fontSize: 11,
        marginTop: 2,
    },

    dateBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#FFF",
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 2,
    },
    dateCenterBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: "#F9F9F9",
    },
    dateLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.primary,
    },

    badge: {
        backgroundColor: "#E8F5E9",
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: COLORS.green,
    },
    badgeText: {
        color: COLORS.green,
        fontSize: 11,
        fontWeight: "bold",
    },
    card: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        elevation: 3,
        marginHorizontal: 4,
        marginTop: 15,
    },
    statusHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    statusText: {
        fontSize: 15,
        fontWeight: "bold",
        marginLeft: 8,
        color: "#333",
    },
    detailBox: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    infoLabel: {
        fontSize: 13,
        color: "#444",
        fontWeight: "bold",
    },
    infoValue: {
        fontSize: 13,
        color: "#666",
        flex: 1,
    },

    zoomSection: {
        backgroundColor: "#F9F9F9",
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: "#DDD",
        marginBottom: 10,
    },
    zoomHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    zoomHeaderText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#555",
    },
    inputContainer: {
        flexDirection: "row",
        backgroundColor: "#EFEFEF",
        borderWidth: 1,
        borderColor: "#CCC",
        borderRadius: 8,
        alignItems: "center",
        paddingHorizontal: 10,
        height: 40,
    },
    textInput: {
        flex: 1,
        height: "100%",
        fontSize: 13,
    },
    copyBtn: {
        padding: 5,
    },

    btnOpenLink: {
        backgroundColor: COLORS.blue,
        height: 42,
        borderRadius: 21,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        elevation: 2,
    },
    btnOpenLinkText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
    },
    btnReject: {
        backgroundColor: COLORS.red,
        height: 40,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 5,
    },
    btnRejectText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
    },
    emptyText: {
        textAlign: "center",
        color: "#999",
        fontSize: 15,
        marginTop: 50,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "85%",
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 20,
        elevation: 10,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
        color: "#000",
    },
    modalDetailBox: {
        width: "100%",
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    modalInput: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#999",
        borderRadius: 10,
        padding: 12,
        height: 100,
        textAlignVertical: "top",
        marginBottom: 20,
        backgroundColor: "#FFF",
        fontSize: 14,
    },
    modalBtnRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        gap: 10,
    },
    modalBtnConfirm: {
        flex: 1.2,
        paddingVertical: 12,
        alignItems: "center",
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        elevation: 2,
    },
    modalBtnConfirmText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
    },
    modalBtnCancel: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        backgroundColor: "#FFF",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#CCC",
        elevation: 1,
    },
    modalBtnCancelText: {
        color: COLORS.primary,
        fontWeight: "bold",
        fontSize: 14,
    },
});