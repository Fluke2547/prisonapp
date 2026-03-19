// prison-visit-app/app/visitor/booking-time.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, StatusBar } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getDailySlots, getBookingPreview, createBooking } from "../../service/booking.service";

const C = {
    primary: "#722F37",
    green: "#00C853",
    text: "#333",
    bg: "#F5F5F5",
    white: "#FFFFFF",
    disabledText: "#AAA"
};

// 🟢 อาร์เรย์ชื่อเดือนภาษาไทย
const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function BookingTimeScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // 📌 ข้อมูลที่รับมาจากหน้า เลือกช่องทางและวันที่
    const [inmateData, setInmateData] = useState({
        visit_date: params.visit_date || params.date || "-",
        inmate_id: params.inmateId || "-",
        inmate_firstname: params.inmateName || "-",
        channel: params.channel || "LINE",
        gender: params.gender || "Male"
    });

    const [deviceGroups, setDeviceGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [bookingToken, setBookingToken] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 🟢 ฟังก์ชันแปลงวันที่ ค.ศ. เป็น พ.ศ.
    const formatDateToThai = (dateString) => {
        if (!dateString || dateString === "-") return "-";
        try {
            const [year, month, day] = dateString.split('-');
            const monthName = THAI_MONTHS[parseInt(month, 10) - 1];
            const thaiYear = parseInt(year, 10) + 543;
            return `${parseInt(day, 10)} ${monthName} ${thaiYear}`;
        } catch (error) {
            return dateString;
        }
    };

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                setLoading(true);
                const res = await getDailySlots(
                    inmateData.visit_date,
                    inmateData.channel,
                    inmateData.inmate_id 
                );
                const groups = res.data || [];
                setDeviceGroups(groups);
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        if (inmateData.visit_date) fetchSlots();
    }, [inmateData.visit_date, inmateData.channel, inmateData.inmate_id]); 

    const onPreConfirm = async () => {
        if (!selectedSlot) return;
        setIsSubmitting(true);
        try {
            const res = await getBookingPreview(inmateData.inmate_id, selectedSlot.slot_id);
            if (res.bookingToken) {
                setBookingToken(res.bookingToken);
                setShowConfirmModal(true);
            } else {
                Alert.alert("แจ้งเตือน", res.message || "ไม่สามารถจองเวลานี้ได้");
            }
        } catch (error) {
            Alert.alert("ผิดพลาด", error.response?.data?.message || "การตรวจสอบล้มเหลว");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onFinalConfirm = async () => {
        setIsSubmitting(true);
        try {
            await createBooking(bookingToken);
            setShowConfirmModal(false);
            Alert.alert("สำเร็จ", "ยืนยันการจองคิวเรียบร้อยแล้ว", [
                { text: "ตกลง", onPress: () => router.replace("/visitor/status") }
            ]);
        } catch (error) {
            Alert.alert("ผิดพลาด", error.response?.data?.message || "การจองล้มเหลว");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFullName = () => {
        return inmateData.inmate_firstname;
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={26} color="#FFF" /></TouchableOpacity>
                <View style={s.headerCenterContainer}>
                    <Text style={s.headerTitle}>เลือกเวลาจองคิวเยี่ยม</Text>
                    <Text style={s.headerSub}>รอบเวลาเฉพาะนักโทษเพศ {inmateData.gender === 'Female' ? 'หญิง' : 'ชาย'}</Text>
                </View>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View style={s.inmateCard}>
                    <View style={s.centeredContent}>
                        <Text style={s.inmateLabel}>ข้อมูลการจองคิวเยี่ยม</Text>
                        <View style={s.divider} />
                        <View style={s.avatarContainer}><Ionicons name="person-circle" size={80} color={inmateData.gender === 'Female' ? "#F48FB1" : "#90CAF9"} /></View>
                        <Text style={s.inmateName}>{getFullName()}</Text>
                        {/* 🔴 เอาบรรทัดแสดงช่องทาง และ ประเภท ตรงนี้ออกไปแล้วครับ */}
                    </View>
                </View>

                {/* 🟢 แสดงวันที่เป็น พ.ศ. */}
                <View style={s.dateCard}>
                    <Text style={s.dateText}>วันที่เลือกจอง : <Text style={{ color: C.green }}>{formatDateToThai(inmateData.visit_date)}</Text></Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 30 }} />
                ) : deviceGroups.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>ไม่มีรอบเวลาว่างสำหรับนักโทษเพศนี้</Text>
                ) : (
                    deviceGroups.map((group, groupIndex) => (
                        <View key={groupIndex} style={s.groupContainer}>
                            <Text style={s.deviceTitle}>{group.deviceName || `เครื่องที่ ${groupIndex + 1}`}</Text>
                            <View style={s.slotGrid}>
                                {group.slots.map((slot, index) => {
                                    const isAvailable = slot.status === 'AVAILABLE';
                                    const isSelected = selectedSlot?.slot_id === slot.slot_id;
                                    return (
                                        <TouchableOpacity
                                            key={slot.slot_id || `slot-${index}`}
                                            style={[s.slotBtn, isSelected && s.slotBtnSelected, !isAvailable && s.slotBtnDisabled]}
                                            disabled={!isAvailable}
                                            onPress={() => setSelectedSlot(slot)}
                                        >
                                            <Text style={[s.slotText, isSelected && { color: "#FFF" }, !isAvailable && { color: C.disabledText }]}>{slot.time || "-"}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <View style={s.footer}>
                <TouchableOpacity style={[s.confirmBtn, (!selectedSlot || isSubmitting) && { backgroundColor: '#CCC' }]} disabled={!selectedSlot || isSubmitting} onPress={onPreConfirm}>
                    {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.confirmBtnText}>ยืนยันการเลือกเวลา</Text>}
                </TouchableOpacity>
            </View>

            <Modal visible={showConfirmModal} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.checkIcon}><Ionicons name="checkmark" size={50} color="#FFF" /></View>
                        <Text style={s.modalTime}>{selectedSlot?.time}</Text>
                        <Text style={s.modalStatus}>ยืนยันการจองเวลานี้</Text>
                        <View style={s.modalDivider} />
                        <View style={s.modalInfoBody}>
                            <View style={s.infoRow}><Text style={s.label}>ชื่อผู้ต้องขัง:</Text><Text style={s.value}>{getFullName()}</Text></View>
                            <View style={s.infoRow}><Text style={s.label}>ช่องทาง:</Text><Text style={s.value}>{inmateData.channel}</Text></View>
                            {/* 🟢 แสดงวันที่ใน Modal เป็น พ.ศ. ด้วย */}
                            <View style={s.infoRow}><Text style={s.label}>วันที่:</Text><Text style={s.value}>{formatDateToThai(inmateData.visit_date)}</Text></View>
                        </View>
                        <TouchableOpacity style={s.modalBtn} onPress={onFinalConfirm} disabled={isSubmitting}>
                            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.modalBtnText}>ยืนยันการจองคิว</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowConfirmModal(false)}><Text style={s.modalCancelText}>ยกเลิก</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { backgroundColor: C.primary, paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
    backBtn: { padding: 5 },
    headerCenterContainer: { flex: 1, alignItems: "center" },
    headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
    headerSub: { color: "#E0E0E0", fontSize: 12 },
    inmateCard: { backgroundColor: "#FFF", borderRadius: 12, padding: 20, marginBottom: 15, elevation: 2 },
    centeredContent: { alignItems: "center" },
    inmateLabel: { fontWeight: "bold", fontSize: 16, color: C.text },
    divider: { height: 1, backgroundColor: "#EEE", width: "80%", marginVertical: 10 },
    avatarContainer: { marginBottom: 10 },
    inmateName: { fontSize: 18, fontWeight: "bold", marginBottom: 5, color: "#000" },
    inmateDetail: { fontSize: 14, color: "#555", marginBottom: 3 },
    dateCard: { backgroundColor: "#FFF", borderRadius: 12, padding: 15, marginBottom: 20, elevation: 1, alignItems: "center" },
    dateText: { fontSize: 15, color: "#333", fontWeight: "bold" },
    groupContainer: { backgroundColor: "#FFF", borderRadius: 12, padding: 15, marginBottom: 15 },
    deviceTitle: { textAlign: "center", fontWeight: "bold", fontSize: 16, marginBottom: 15, color: C.text },
    slotGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 },
    slotBtn: { width: "30%", backgroundColor: "#FFF", borderWidth: 1, borderColor: C.green, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
    slotBtnSelected: { backgroundColor: C.green, borderColor: C.green },
    slotBtnDisabled: { borderColor: "#E0E0E0", backgroundColor: "#F9F9F9" },
    slotText: { color: C.green, fontWeight: "bold", fontSize: 13 },
    footer: { padding: 20, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: "#EEE" },
    confirmBtn: { backgroundColor: C.primary, padding: 15, borderRadius: 10, alignItems: "center" },
    confirmBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
    modalContent: { width: "85%", backgroundColor: "#FFF", borderRadius: 20, padding: 25, alignItems: "center" },
    checkIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.primary, justifyContent: "center", alignItems: "center", marginTop: -50, marginBottom: 15, borderWidth: 5, borderColor: "#FFF" },
    modalTime: { fontSize: 22, fontWeight: "bold", color: C.green, marginBottom: 5 },
    modalStatus: { fontSize: 14, color: C.green, marginBottom: 15 },
    modalDivider: { height: 1, backgroundColor: "#EEE", width: "100%", marginBottom: 15 },
    modalInfoBody: { width: "100%", paddingHorizontal: 10 },
    infoRow: { flexDirection: "row", marginBottom: 8, justifyContent: "space-between" },
    label: { fontWeight: "bold", color: "#333", fontSize: 14, flex: 1 },
    value: { flex: 2, textAlign: "right", color: "#555", fontSize: 14 },
    modalBtn: { backgroundColor: C.primary, width: "100%", padding: 12, borderRadius: 10, marginTop: 20, alignItems: "center" },
    modalBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
    modalCancelBtn: { marginTop: 15, padding: 10 },
    modalCancelText: { color: "#888", fontSize: 15, fontWeight: "bold" },
});