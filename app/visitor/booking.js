// prison-visit-app/app/visitor/booking.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { getMonthlySlots } from "../../service/booking.service";

// --- ตั้งค่าภาษาไทย ---
LocaleConfig.locales['th'] = {
    monthNames: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
    monthNamesShort: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
    dayNames: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
    dayNamesShort: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
    today: 'วันนี้'
};
LocaleConfig.defaultLocale = 'th';

const C = {
    primary: "#722F37",
    bg: "#F5F5F5",
    card: "#fff",
    text: "#333",
    // สีสถานะ
    available: "#E8F5E9", // พื้นเขียวอ่อน
    availableText: "#2E7D32", // ตัวเขียวเข้ม
    weekend: "#FFEBEE",    // พื้นแดงอ่อน
    weekendText: "#C62828", // ตัวแดงเข้ม
    full: "#FFF3E0",       // พื้นส้มอ่อน
    fullText: "#EF6C00",   // ตัวส้มเข้ม
    disabled: "#F2F2F2",   // พื้นเทา
    disabledText: "#BDBDBD", // ตัวเทา
    selected: "#FFC107",   // เหลือง
    selectedText: "#000"
};

export default function BookingDateScreen() {
    const router = useRouter();
    const { inmateId, inmateName, gender, rescheduleFor, inmateCode } = useLocalSearchParams();

    const todayObj = new Date();
    const tomorrowObj = new Date(todayObj);
    tomorrowObj.setDate(todayObj.getDate() + 1);

    const maxDateObj = new Date(todayObj.getFullYear(), todayObj.getMonth() + 2, 0);

    const tomorrowStr = tomorrowObj.toISOString().split('T')[0];
    const maxDateStr = maxDateObj.toISOString().split('T')[0];

    const [currentMonth, setCurrentMonth] = useState(tomorrowStr);
    const [selectedDate, setSelectedDate] = useState(null);
    const [monthlyStatus, setMonthlyStatus] = useState({});
    const [loading, setLoading] = useState(false);

    // 🟢 เพิ่มฟังก์ชันแปลงวันที่ ค.ศ. เป็น พ.ศ. (แบบ 13 มีนาคม 2569)
    const formatDateToThai = (dateString) => {
        if (!dateString) return "";
        const [year, month, day] = dateString.split('-');
        
        // ดึงชื่อเดือนแบบเต็มจาก LocaleConfig ที่ตั้งไว้ข้างบน
        const monthName = LocaleConfig.locales['th'].monthNames[parseInt(month, 10) - 1];
        
        // แปลง ค.ศ. เป็น พ.ศ.
        const thaiYear = parseInt(year, 10) + 543;
        
        return `${parseInt(day, 10)} ${monthName} ${thaiYear}`;
    };

    const fetchMonthlyData = async (dateString, isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);

            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');

            const res = await getMonthlySlots(year, month);

            const rawData = res.data || res;
            let processedData = {};
            if (Array.isArray(rawData)) {
                rawData.forEach(item => {
                    const d = item.date || item.visit_date;
                    if (d) processedData[d] = item;
                });
            } else if (typeof rawData === 'object' && rawData !== null) {
                processedData = rawData;
            }
            setMonthlyStatus(prev => ({ ...prev, ...processedData }));

        } catch (error) {
            if (error.response && error.response.status === 404) {
                if (!isBackground) console.log(`⚠️ แจ้งเตือน: ยังไม่มีการสร้างคิวสำหรับเดือน ${dateString}`);
                return;
            }
            console.error("Calendar Error:", error.message);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };


    useEffect(() => {
        fetchMonthlyData(currentMonth, false);
        const intervalId = setInterval(() => {
            fetchMonthlyData(currentMonth, true);
        }, 5000);


        return () => clearInterval(intervalId);
    }, [currentMonth]);

    const handleDayPress = (dateString, isDisabled) => {
        if (isDisabled) return;
        setSelectedDate(dateString);
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>เลือกวันจองคิวเยี่ยม</Text>
                    <Text style={s.headerSub}>เลือกวันที่ต้องการเยี่ยมญาติผู้ต้องขัง</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

                {/* Calendar Card */}
                <View style={s.card}>
                    <Calendar
                        key={currentMonth}
                        current={currentMonth}
                        minDate={tomorrowStr}
                        maxDate={maxDateStr}

                        onMonthChange={(month) => {
                            setCurrentMonth(month.dateString);
                            fetchMonthlyData(month.dateString);
                        }}

                        hideExtraDays={true}
                        enableSwipeMonths={true}

                        theme={{
                            calendarBackground: '#fff',
                            textSectionTitleColor: '#000',
                            monthTextColor: '#000',
                            textMonthFontWeight: 'bold',
                            textMonthFontSize: 18,
                            arrowColor: C.primary,
                        }}

                        dayComponent={({ date }) => {
                            const dateStr = date.dateString;

                            // คำนวณวัน
                            const dObj = new Date(dateStr);
                            const dayOfWeek = dObj.getDay(); // 0=อาทิตย์, 6=เสาร์

                            // สถานะจาก API
                            const apiItem = monthlyStatus[dateStr];
                            const status = apiItem?.status;

                            // เงื่อนไข
                            const isSelected = selectedDate === dateStr;
                            const isPastOrToday = dateStr < tomorrowStr; // น้อยกว่าพรุ่งนี้ = อดีต/วันนี้
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            const isFuture = dateStr > maxDateStr; // อนาคตที่เกิน 1 เดือน

                            // --- Logic สี ---
                            let bgColor = "#FFF";
                            let textColor = "#333";
                            let isDisabled = false;

                            if (isPastOrToday || isFuture) {
                                // 1. อดีต/วันนี้ หรือ อนาคตที่เกิน 1 เดือน -> สีเทา (ห้ามกด)
                                bgColor = C.disabled;
                                textColor = C.disabledText;
                                isDisabled = true;
                            }
                            else if (isWeekend) {
                                // 2. เสาร์-อาทิตย์ -> สีแดง (ห้ามกด)
                                bgColor = C.weekend;
                                textColor = C.weekendText;
                                isDisabled = true;
                            }
                            else if (status === 'FULL') {
                                // 3. เต็ม -> สีส้ม
                                bgColor = C.full;
                                textColor = C.fullText;
                                isDisabled = true;
                            }
                            else if (status === 'HOLIDAY' || status === 'CLOSED') {
                                // 4. หยุดพิเศษ หรือ ปิดทำการ -> สีแดง
                                bgColor = C.weekend;
                                textColor = C.weekendText;
                                isDisabled = true;
                            }
                            else if (status === 'AVAILABLE') {
                                // 5. ต้องมีสถานะ AVAILABLE ส่งมาจาก Backend เท่านั้น ถึงจะให้เป็นสีเขียว ✅
                                bgColor = C.available;
                                textColor = C.availableText;
                                isDisabled = false;
                            }
                            else {
                                // 🔴 6. วันธรรมดาที่ "แอดมินยังไม่สร้างคิว" (ไม่มี status ส่งมา) -> ให้เป็นสีแดง! 🔴
                                bgColor = C.weekend; // ใช้โค้ดสีแดงตัวเดียวกับเสาร์-อาทิตย์
                                textColor = C.weekendText;
                                isDisabled = true;   // ล็อกห้ามกดเด็ดขาด
                            }

                            // 7. ถ้ากดเลือก -> สีเหลือง (ทับทุกอย่าง)
                            if (isSelected && !isDisabled) { // เช็คกันเหนียวว่าต้องเป็นวันที่กดได้เท่านั้น
                                bgColor = C.selected;
                                textColor = C.selectedText;
                                isDisabled = false;
                            }

                            return (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={[s.dayContainer, { backgroundColor: bgColor }]}
                                    onPress={() => handleDayPress(dateStr, isDisabled)}
                                    disabled={isDisabled}
                                >
                                    <Text style={[s.dayText, { color: textColor, fontWeight: isSelected ? 'bold' : 'normal' }]}>
                                        {date.day}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>

                {/* Selected Date Show */}
                <View style={s.card}>
                    <Text style={s.label}>วันที่เลือก :</Text>
                    <View style={s.selectedBox}>
                        {/* 🟢 เรียกใช้ฟังก์ชัน formatDateToThai ตรงนี้ */}
                        <Text style={s.selectedText}>
                            {selectedDate ? formatDateToThai(selectedDate) : "กรุณาเลือกวันที่ (จองล่วงหน้า 1 วัน)"}
                        </Text>
                    </View>
                </View>

                {/* Legend */}
                <View style={[s.card, { marginTop: 16, paddingVertical: 16 }]}>
                    <Text style={s.legendTitle}>สถานะวันเยี่ยม</Text>

                    <View style={s.legendRow}>
                        <View style={[s.dot, { backgroundColor: "#4CAF50" }]} />
                        <Text style={s.legendText}>ว่าง (จองได้)</Text>
                    </View>
                    <View style={s.legendRow}>
                        <View style={[s.dot, { backgroundColor: "#FF9800" }]} />
                        <Text style={s.legendText}>คิวเต็ม</Text>
                    </View>
                    <View style={s.legendRow}>
                        <View style={[s.dot, { backgroundColor: "#F44336" }]} />
                        <Text style={s.legendText}>เสาร์-อาทิตย์ / วันหยุด</Text>
                    </View>
                    <View style={s.legendRow}>
                        <View style={[s.dot, { backgroundColor: "#BDBDBD" }]} />
                        <Text style={s.legendText}>ปิดจอง / เกินกำหนดเวลา</Text>
                    </View>
                </View>

                {/* Button */}
                <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
                    <TouchableOpacity
                        style={[s.btn, !selectedDate && { backgroundColor: C.disabledText }]}
                        disabled={!selectedDate}
                        onPress={() => {
                            // 🟢 เวลาส่ง parameter ไปหน้าอื่น ยังคงส่ง format เดิมเป็น ค.ศ. เอาไว้ให้ Backend ทำงานง่ายครับ
                            router.push({
                                pathname: "/visitor/select-inmate-for-booking",
                                params: {
                                    date: selectedDate, // ยังเป็น "YYYY-MM-DD"
                                    inmateId, inmateName, gender, rescheduleFor, inmateCode
                                }
                            });
                        }}
                    >
                        <Text style={s.btnText}>ยืนยันวันที่เยี่ยม</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    header: {
        backgroundColor: C.primary,
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: {
        position: "absolute",
        left: 16,
        bottom: 15,
        padding: 4,
    },
    headerCenter: {
        alignItems: "center",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    headerSub: {
        color: "#F3E8EA",
        fontSize: 12,
        marginTop: 2,
    },
    card: {
        backgroundColor: C.card,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
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
    legendTitle: {
        fontWeight: "bold",
        marginBottom: 15,
        fontSize: 16,
    },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    legendText: {
        fontSize: 14,
        color: "#555",
    },
    label: {
        fontWeight: "700",
        color: C.text,
        marginBottom: 8,
    },
    selectedBox: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E1E1E1",
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    selectedText: {
        color: C.text,
    },
    btn: {
        backgroundColor: C.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    btnText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});