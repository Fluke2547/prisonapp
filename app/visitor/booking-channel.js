//prison-visit-app/app/visitor/booking-channel.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

const C = {
    primary: "#722F37",
    cardHeader: "#5D242B",
    greenText: "#00C853",
    bg: "#EFEFEF",
    white: "#FFF"
};

// 🟢 เพิ่มอาร์เรย์ชื่อเดือนภาษาไทยไว้ใช้กับฟังก์ชันแปลงวันที่
const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function BookingChannelScreen() {
    const router = useRouter();
    
    // 1. รับค่า Params ทั้งหมด (รวมถึงข้อมูลดิบจาก Backend ที่หน้าก่อนหน้าส่งมา)
    const params = useLocalSearchParams();
    
    // ดึงค่าหลักๆ มาใช้แสดงผลในหน้านี้
    const { date, visit_date, inmateId, inmateCode, inmate_photo_url } = params;

    // Helper: รวมชื่อ-นามสกุล (รองรับทั้งแบบส่งแยกและส่งรวม)
    const getInmateName = () => {
        if (params.inmate_firstname) {
            return `${params.prefix_name || ''}${params.inmate_firstname} ${params.inmate_lastname || ''}`;
        }
        return params.inmateName || "ไม่ระบุชื่อ";
    };

    // 🟢 2. เพิ่มฟังก์ชันแปลงวันที่ ค.ศ. (YYYY-MM-DD) เป็น พ.ศ. (แบบ 13 มีนาคม 2569)
    const formatDateToThai = (dateString) => {
        if (!dateString) return "-"; // ถ้าไม่มีวันที่ส่งมาให้แสดงขีด
        try {
            const [year, month, day] = dateString.split('-');
            const monthName = THAI_MONTHS[parseInt(month, 10) - 1];
            const thaiYear = parseInt(year, 10) + 543;
            return `${parseInt(day, 10)} ${monthName} ${thaiYear}`;
        } catch (error) {
            return dateString; // ถ้าแปลงไม่ได้ (ฟอร์แมตผิด) ให้แสดงแบบเดิมไปก่อน
        }
    };

    const handleSelect = (channel) => {
        // 2. ส่งต่อข้อมูลไปยังหน้าเลือกเวลา (booking-time.js)
        // ใช้ ...params เพื่อส่งทุก field ที่รับมา ส่งต่อไปด้วยเลย (เช่น inmate_id, prefix_name ฯลฯ)
        router.push({
            pathname: "/visitor/booking-time",
            params: { 
                ...params, // ✅ ส่งต่อ data ทั้งก้อน
                channel: channel, // เพิ่ม channel ที่เลือก
                date: date || visit_date // กันพลาดเรื่องชื่อตัวแปรวันที่
            }
        });
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={{padding: 5}}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={{alignItems:'center'}}>
                    <Text style={s.headerTitle}>เลือกวันจองคิวเยี่ยม</Text>
                    <Text style={s.headerSub}>เลือกช่องทางที่ต้องการเยี่ยมญาติผู้ต้องขัง</Text>
                </View>
                <View style={{width: 34}}/>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                
                {/* Inmate Summary Card */}
                <View style={s.summaryCard}>
                    <View style={s.avatar}>
                        {inmate_photo_url ? (
                            <Image source={{ uri: inmate_photo_url }} style={{ width: 70, height: 70, borderRadius: 35 }} />
                        ) : (
                            <Ionicons name="person" size={40} color="#CCC" />
                        )}
                    </View>
                    
                    <Text style={s.name}>{getInmateName()}</Text>
                    
                    <Text style={s.detail}>รหัสผู้ต้องขัง : {inmateCode || params.inmate_id || "-"}</Text>
                    <Text style={s.detail}>สถานะ : อยู่ระหว่างคุมขัง</Text>
                    
                    {/* 🟢 3. เรียกใช้ฟังก์ชัน formatDateToThai ตรงนี้ */}
                    <Text style={[s.detail, { marginTop: 5, color: C.primary, fontWeight: 'bold' }]}>
                        วันที่เข้าเยี่ยม : {formatDateToThai(date || visit_date)}
                    </Text>
                </View>

                <Text style={s.sectionTitle}>กรุณาเลือกช่องทางสำหรับการเข้าเยี่ยมออนไลน์</Text>
                <View style={s.divider} />

                <ChannelBtn 
                    icon={<FontAwesome5 name="line" size={32} color="#FFF" />} 
                    color="#06C755" 
                    title="LINE" 
                    desc="จะใช้ LINE เป็นตัวเชื่อมในเข้าเยี่ยมผ่านการวิดีโอคอล"
                    onPress={() => handleSelect('Line')} 
                />
                
                <ChannelBtn 
                    icon={<FontAwesome5 name="video" size={24} color="#FFF" />} 
                    color="#2D8CFF" 
                    title="ZOOM" 
                    desc="เจ้าหน้าที่จะส่งลิ้งค์ให้ท่านเมื่อการจองผ่านการอนุมัตินี้"
                    onPress={() => handleSelect('Zoom')} 
                />
                
                {/* Video Call */}
                <ChannelBtn 
                    icon={<Ionicons name="videocam" size={32} color="#FFF" />} 
                    color="#5D242B" 
                    title="VIDEO CALL" 
                    desc="จะใช้ Video Call ของแอปพลิเคชันนี้ในเข้าเยี่ยมผ่านการวิดีโอคอล"
                    onPress={() => handleSelect('WEBRTC')}
                />

            </ScrollView>
        </View>
    );
}

// Component ย่อยสำหรับปุ่ม
const ChannelBtn = ({ icon, color, title, desc, onPress }) => (
    <TouchableOpacity style={s.btn} onPress={onPress} activeOpacity={0.8}>
        <View style={[s.iconBox, {backgroundColor: color}]}>
            {icon}
        </View>
        <View style={s.textContainer}>
            <Text style={s.btnTitle}>{title}</Text>
            <View style={s.line} />
            <Text style={s.btnDesc}>{desc}</Text>
        </View>
    </TouchableOpacity>
);

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
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },
    headerSub: {
        color: "#E0E0E0",
        fontSize: 12,
    },

    // Summary Section
    summaryCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 20,
        alignItems: "center",
        marginBottom: 20,
        elevation: 2,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#EEE",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
        overflow: 'hidden'
    },
    name: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 5,
        color: "#333", // แก้ไขตรงนี้เล็กน้อย เผื่อ C.text ไม่ถูกนิยามในไฟล์นี้
        textAlign: 'center'
    },
    detail: {
        fontSize: 12,
        color: "#666",
        marginBottom: 2,
    },

    // Divider & Title
    sectionTitle: {
        textAlign: "center",
        fontWeight: "bold",
        color: C.cardHeader,
        marginBottom: 5,
        fontSize: 14
    },
    divider: {
        height: 2,
        backgroundColor: C.cardHeader,
        width: 60,
        alignSelf: "center",
        marginBottom: 20,
    },

    // Button Style
    btn: {
        backgroundColor: "#FFF",
        flexDirection: "row",
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: "center",
        elevation: 2,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
        alignItems: 'center'
    },
    btnTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 5,
        color: "#333" // แก้ไขตรงนี้เล็กน้อย
    },
    line: {
        height: 1,
        backgroundColor: "#DDD",
        width: "90%",
        marginBottom: 5,
    },
    btnDesc: {
        fontSize: 11,
        textAlign: "center",
        color: "#777",
        lineHeight: 16
    },
});