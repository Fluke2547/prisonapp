// prison-visit-app/app/visitor/reschedule.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, StatusBar, Alert, ActivityIndicator } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { getOldBookingForReschedule, getMonthlySlots, getDailySlots, getReschedulePreview, confirmReschedule } from "../../service/booking.service";

LocaleConfig.locales['th'] = {
    monthNames: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
    monthNamesShort: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
    dayNames: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
    dayNamesShort: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
    today: 'วันนี้'
};
LocaleConfig.defaultLocale = 'th';

const C = {
    primary: "#722F37", green: "#00C853", red: "#E53935", text: "#333", bg: "#F9F9F9", white: "#FFFFFF", line: "#00C300", zoom: "#2D8CFF", videoCall: "#5D242B",
    available: "#E8F5E9", availableText: "#2E7D32", weekend: "#FFEBEE", weekendText: "#C62828", full: "#FFF3E0", fullText: "#EF6C00", disabled: "#F2F2F2", disabledText: "#BDBDBD", selected: "#722F37", selectedText: "#FFF"
};

export default function RescheduleScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const oldBookingId = params.editId;

    const [loadingInit, setLoadingInit] = useState(true);
    const [oldData, setOldData] = useState(null);
    const [step, setStep] = useState(1);
    const [newChannel, setNewChannel] = useState(null);
    const [newDate, setNewDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [monthlyStatus, setMonthlyStatus] = useState({});
    const [dailySlots, setDailySlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [rescheduleToken, setRescheduleToken] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getLocalYYYYMMDD = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayObj = new Date();
    const tomorrowObj = new Date(); tomorrowObj.setDate(todayObj.getDate() + 1);
    const maxDateObj = new Date(todayObj.getFullYear(), todayObj.getMonth() + 2, 0); // 🟢 หาวันสุดท้ายของเดือนถัดไป

    const tomorrowStr = getLocalYYYYMMDD(tomorrowObj);
    const maxDateStr = getLocalYYYYMMDD(maxDateObj);
    
    const [currentMonth, setCurrentMonth] = useState(tomorrowStr);

    const getThaiDateFormatted = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
    };

    useEffect(() => {
        const initData = async () => {
            if (!oldBookingId) {
                Alert.alert("ข้อผิดพลาด", "ไม่พบรหัสการจองเดิม");
                return;
            }

            try {
                const oldRes = await getOldBookingForReschedule(oldBookingId);
                setOldData(oldRes.data);
            } catch (error) {
                setOldData({
                    inmate_number: params.inmate_id || "-",
                    inmate_firstname: params.inmate_name || "-",
                    inmate_lastname: "",
                    old_visit_date: params.old_date || "-",
                    old_time: params.old_time || "-"
                });
            } finally {
                await fetchMonthlyData(tomorrowStr);
                setLoadingInit(false);
            }
        };
        initData();
    }, [oldBookingId]);

    const fetchMonthlyData = async (dateString, isBackground = false) => {
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');

            const res = await getMonthlySlots(year, month);

            const rawData = res.data || res;
            let processedData = {};
            if (Array.isArray(rawData)) {
                rawData.forEach(item => { if (item.date || item.visit_date) processedData[item.date || item.visit_date] = item; });
            } else if (typeof rawData === 'object' && rawData !== null) processedData = rawData;

            setMonthlyStatus(prev => ({ ...prev, ...processedData }));

        } catch (error) {
            if (error.response && error.response.status === 404) {
            } else {
                if (!isBackground) console.log(`⚠️ แจ้งเตือนปฏิทิน: ${error.response?.data?.message || error.message}`);
            }
        }
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (step === 2) {
                fetchMonthlyData(currentMonth, true);
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [currentMonth, step]);

    useEffect(() => {
        if (step === 3 && newDate && newChannel) {
            const fetchSlots = async () => {
                setLoadingSlots(true);
                setSelectedSlot(null);
                try {
                    const res = await getDailySlots(newDate, newChannel, oldBookingId);
                    setDailySlots(res.data || []);
                } catch (error) { console.error("Slots Error:", error); } finally { setLoadingSlots(false); }
            };
            fetchSlots();
        }
    }, [step, newDate, newChannel]);

    const onPreConfirm = async (slot) => {
        setSelectedSlot(slot);
        setIsSubmitting(true);
        try {
            const res = await getReschedulePreview(oldBookingId, slot.slot_id);
            if (res.reschedule_token) {
                setRescheduleToken(res.reschedule_token);
                setShowConfirmModal(true);
            } else {
                Alert.alert("แจ้งเตือน", res.message || "ไม่สามารถจองเวลานี้ได้");
            }
        } catch (error) {
            Alert.alert("ผิดพลาด", error.response?.data?.message || "ระบบขัดข้อง");
        } finally {
            setIsSubmitting(false);
        }
    };
ว
    const onFinalConfirm = async () => {
        setIsSubmitting(true);
        try {
            await confirmReschedule(rescheduleToken);
            setShowConfirmModal(false);
            Alert.alert("สำเร็จ", "ยืนยันการเลื่อนคิวเยี่ยมเรียบร้อยแล้ว", [
                { text: "ตกลง", onPress: () => router.replace("/visitor/status") }
            ]);
        } catch (error) {
            Alert.alert("ผิดพลาด", error.response?.data?.message || "การเลื่อนคิวล้มเหลว");
        } finally {
            setIsSubmitting(false);
        }
    };

    const InfoRow = ({ label, value }) => (
        <View style={s.statusRow}>
            <Ionicons name="checkmark-circle" size={20} color={C.green} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={{ fontSize: 14, flex: 1, lineHeight: 22 }}>
                <Text style={{ fontWeight: 'bold', color: '#000' }}>{label} : </Text>
                <Text style={{ color: '#555' }}>{value}</Text>
            </Text>
        </View>
    );

    const OldDataCard = () => (
        <View style={s.card}>
            <Text style={s.cardTitle}>รายละเอียดคิวเดิมที่ต้องการเลื่อน</Text>
            {loadingInit ? (
                <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} />
            ) : (
                <>
                    <InfoRow label="รหัสประจำตัวผู้ต้องขัง" value={oldData?.inmate_number || "-"} />
                    <InfoRow label="ชื่อของผู้ต้องขัง" value={`${oldData?.inmate_firstname || ""} ${oldData?.inmate_lastname || ""}`.trim()} />
                    <InfoRow label="วัน/เดือน/ปี" value={oldData?.old_visit_date || "-"} />
                    <InfoRow label="เวลาที่ทำการจอง" value={oldData?.old_time || "-"} />
                    <InfoRow label="ช่องทางที่เข้าเยี่ยม" value={params.old_channel || "-"} />
                </>
            )}
        </View>
    );

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />
            <View style={s.header}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>เลื่อนวันและเวลาจองคิว</Text>
                    <Text style={s.headerSub}>ขั้นตอนที่ {step} / 3</Text>
                </View>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

                {/* ขั้นตอนที่ 1 */}
                {step === 1 && (
                    <View>
                        <OldDataCard />
                        <Text style={s.sectionTitle}>กรุณาเลือกช่องทางสำหรับการเข้าเยี่ยมออนไลน์</Text>
                        <View style={s.titleUnderline} />
                        <TouchableOpacity style={s.channelCard} onPress={() => { setNewChannel("LINE"); setStep(2); }}>
                            <View style={[s.channelIconBox, { backgroundColor: C.line }]}><FontAwesome5 name="line" size={35} color="#FFF" /></View>
                            <View style={s.channelInfo}><Text style={s.channelTitle}>LINE</Text><View style={s.divider} /><Text style={s.channelSub}>ผ่านแอปพลิเคชัน LINE</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.channelCard} onPress={() => { setNewChannel("ZOOM"); setStep(2); }}>
                            <View style={[s.channelIconBox, { backgroundColor: C.zoom }]}><Ionicons name="videocam" size={35} color="#FFF" /></View>
                            <View style={s.channelInfo}><Text style={s.channelTitle}>ZOOM</Text><View style={s.divider} /><Text style={s.channelSub}>ผ่านแอปพลิเคชัน ZOOM</Text></View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ขั้นตอนที่ 2 */}
                {step === 2 && (
                    <View>
                        <OldDataCard />
                        <View style={s.card}>
                            <Text style={s.cardTitle}>กรุณาเลือก วัน/เดือน/ปี ใหม่</Text>
                            <View style={{ marginBottom: 15 }}>
                                <Calendar
                                    key={currentMonth} current={currentMonth} minDate={tomorrowStr} maxDate={maxDateStr}
                                    onMonthChange={(month) => { setCurrentMonth(month.dateString); fetchMonthlyData(month.dateString); }}
                                    hideExtraDays={true} enableSwipeMonths={true}
                                    theme={{ arrowColor: C.primary, textMonthFontWeight: 'bold', textMonthFontSize: 16 }}
                                    dayComponent={({ date }) => {
                                        const dateStr = date.dateString;
                                        const status = monthlyStatus[dateStr]?.status;
                                        const isSelected = newDate === dateStr;
                                        
                                        const dObj = new Date(dateStr);
                                        const dayOfWeek = dObj.getDay();
                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                                        const isPast = dateStr < tomorrowStr;
                                        const isFuture = dateStr > maxDateStr;

                                        let bgColor = "#FFF";
                                        let textColor = "#333";
                                        let isDisabled = false;

                                        if (isPast || isFuture) {
                                            bgColor = C.disabled; textColor = C.disabledText; isDisabled = true;
                                        } else if (isWeekend) {
                                            bgColor = C.weekend; textColor = C.weekendText; isDisabled = true;
                                        } else if (status === 'FULL') {
                                            bgColor = C.full; textColor = C.fullText; isDisabled = true;
                                        } else if (status === 'HOLIDAY' || status === 'CLOSED') {
                                            bgColor = C.weekend; textColor = C.weekendText; isDisabled = true;
                                        } else if (status === 'AVAILABLE') {
                                            bgColor = C.available; textColor = C.availableText; isDisabled = false;
                                        } else {
                                            bgColor = C.weekend; textColor = C.weekendText; isDisabled = true;
                                        }
                                        if (isSelected && !isDisabled) {
                                            bgColor = C.selected; textColor = C.selectedText; isDisabled = false;
                                        }

                                        return (
                                            <TouchableOpacity 
                                                style={[s.dayContainer, { backgroundColor: bgColor }]} 
                                                disabled={isDisabled} 
                                                onPress={() => { if (!isDisabled) setNewDate(dateStr); }}
                                            >
                                                <Text style={[s.dayText, { color: textColor, fontWeight: isSelected ? 'bold' : 'normal' }]}>{date.day}</Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                            <View style={s.actionRow}>
                                <TouchableOpacity style={[s.btnPrimary, !newDate && { backgroundColor: C.disabledText }]} disabled={!newDate} onPress={() => setStep(3)}><Text style={s.btnPrimaryText}>ยืนยันการเลื่อนวัน</Text></TouchableOpacity>
                                <TouchableOpacity style={s.btnCancel} onPress={() => setStep(1)}><Text style={s.btnCancelText}>ย้อนกลับ</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* ขั้นตอนที่ 3 */}
                {step === 3 && (
                    <View>
                        <OldDataCard />
                        <View style={s.card}>
                            <Text style={s.cardTitle}>รอบเวลาที่ว่าง {newChannel} (วันที่ {getThaiDateFormatted(newDate)})</Text>

                            {loadingSlots ? (
                                <ActivityIndicator size="large" color={C.primary} style={{ marginVertical: 20 }} />
                            ) : dailySlots.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#888', marginVertical: 20 }}>ไม่มีรอบเวลาว่างในวันที่เลือก</Text>
                            ) : (
                                dailySlots.map((group, groupIdx) => (
                                    <View key={groupIdx} style={{ marginBottom: 15 }}>
                                        <Text style={s.deviceTitle}>{group.deviceName}</Text>
                                        <View style={s.timeGrid}>
                                            {group.slots.map((slot, idx) => {
                                                const isAvailable = slot.status === 'AVAILABLE';
                                                return (
                                                    <TouchableOpacity
                                                        key={idx}
                                                        style={[s.timeSlot, !isAvailable && { borderColor: '#E0E0E0', backgroundColor: '#F9F9F9' }]}
                                                        disabled={!isAvailable || isSubmitting}
                                                        onPress={() => onPreConfirm(slot)}
                                                    >
                                                        {isSubmitting && selectedSlot?.slot_id === slot.slot_id ? (
                                                            <ActivityIndicator color={C.green} size="small" />
                                                        ) : (
                                                            <Text style={[s.timeText, !isAvailable && { color: C.disabledText }]}>{slot.time}</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                )
                                            })}
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* ยืนยันขั้นสุดท้าย */}
            <Modal visible={showConfirmModal} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={s.modalCard}>
                        <Text style={s.cardTitle}>ยืนยันข้อมูลการเลื่อนคิว</Text>
                        <View style={{ marginBottom: 20 }}>
                            <InfoRow label="รหัสผู้ต้องขัง" value={oldData?.inmate_number || "-"} />
                            <InfoRow label="ชื่อผู้ต้องขัง" value={`${oldData?.inmate_firstname || ""} ${oldData?.inmate_lastname || ""}`.trim()} />
                            <InfoRow label="วันที่เลื่อนใหม่" value={getThaiDateFormatted(newDate)} />
                            <InfoRow label="เวลาใหม่" value={selectedSlot?.time} />
                            <InfoRow label="ช่องทางใหม่" value={newChannel} />
                        </View>
                        <View style={s.actionRow}>
                            <TouchableOpacity style={[s.btnPrimary, isSubmitting && { opacity: 0.7 }]} disabled={isSubmitting} onPress={onFinalConfirm}>
                                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnPrimaryText}>ยืนยันการเลื่อน</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={s.btnCancel} disabled={isSubmitting} onPress={() => setShowConfirmModal(false)}>
                                <Text style={s.btnCancelText}>ยกเลิก</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    content: {
        padding: 16,
    },

    header: {
        backgroundColor: C.primary,
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    backBtn: {
        padding: 5,
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
    },
    headerTitle: {
        color: C.white,
        fontSize: 18,
        fontWeight: "bold",
    },
    headerSub: {
        color: "#E0E0E0",
        fontSize: 12,
        marginTop: 4,
    },

    card: {
        backgroundColor: C.white,
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#EEE",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 15,
        color: C.text,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    sectionTitle: {
        textAlign: "center",
        fontSize: 15,
        fontWeight: "bold",
        color: C.primary,
        marginTop: 10,
    },
    titleUnderline: {
        width: 40,
        height: 2,
        backgroundColor: C.primary,
        alignSelf: "center",
        marginTop: 5,
        marginBottom: 15,
    },

    channelCard: {
        flexDirection: "row",
        backgroundColor: C.white,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#EEE",
        alignItems: "center",
    },
    channelIconBox: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    channelInfo: {
        flex: 1,
        marginLeft: 15,
    },
    channelTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000",
        textAlign: "center",
    },
    divider: {
        height: 1,
        backgroundColor: "#EEE",
        marginVertical: 6,
    },
    channelSub: {
        fontSize: 11,
        color: "#666",
        textAlign: "center",
    },

    deviceTitle: {
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 15,
    },
    timeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
    },
    timeSlot: {
        width: "30%",
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.green,
        alignItems: "center",
        marginBottom: 10,
    },
    timeText: {
        color: C.green,
        fontWeight: "bold",
        fontSize: 12,
    },

    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
    },
    btnPrimary: {
        backgroundColor: "#6D4A3E",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        flex: 1,
        marginRight: 10,
    },
    btnPrimaryText: {
        color: C.white,
        fontWeight: "bold",
        fontSize: 15,
    },
    btnCancel: {
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: "#CCC",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        flex: 1,
    },
    btnCancelText: {
        color: "#6D4A3E",
        fontWeight: "bold",
        fontSize: 15,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalCard: {
        width: "85%",
        backgroundColor: C.white,
        borderRadius: 16,
        padding: 25,
        elevation: 5,
    },
    dayContainer: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
    },
    dayText: {
        fontSize: 14,
    },
});