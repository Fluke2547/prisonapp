// prison-visit-app/app/visitor/select-inmate-for-booking.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, StatusBar } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { getInmatesForDate } from "../../service/booking.service"; 

const C = {
    primary: "#722F37",
    cardHeader: "#5D242B",
    bg: "#F8F9FA",
    card: "#FFFFFF",
    text: "#212529",
    subText: "#6C757D",
    greenText: "#28A745",
    redBtn: "#DC3545",
    border: "#E9ECEF",
    male: "#0D6EFD",
    female: "#D63384" 
};

export default function SelectInmateForBooking() {
    const router = useRouter();
    const { date, rescheduleFor } = useLocalSearchParams(); 

    const [inmates, setInmates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [selectedInmateId, setSelectedInmateId] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const res = await getInmatesForDate(date);
                setInmates(res.data || []);
            } catch (error) {
                console.error(error);
                Alert.alert("ผิดพลาด", "ไม่สามารถดึงข้อมูลผู้ต้องขังได้");
            } finally {
                setLoading(false);
            }
        };
        if (date) loadData();
    }, [date]);

    const checkIsFemale = (item) => {
        const rawGender = String(item.gender || "").toLowerCase();
        const fullName = String(item.fullname || "");
        if (rawGender === 'female' || rawGender === 'f' || rawGender === 'หญิง') return true;
        if (fullName.includes('นาง') || fullName.includes('ด.ญ.')) return true;
        return false;
    };

    const handleConfirm = () => {
        if (!selectedInmateId) {
            Alert.alert("แจ้งเตือน", "กรุณาเลือกผู้ต้องขัง");
            return;
        }
        
        const selected = inmates.find(i => i.inmate_id === selectedInmateId);
        const isFemale = checkIsFemale(selected);
        const derivedGender = isFemale ? 'Female' : 'Male';
        
        router.push({
            pathname: "/visitor/booking-channel",
            params: {
                date,
                inmateId: selected.inmate_id,
                inmateName: selected.fullname,
                inmateCode: selected.inmate_number || selected.inmate_code, 
                gender: derivedGender,
                rescheduleFor 
            }
        });
    };

    const formatDateThai = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        return `วันที่ ${d.getDate()} ${months[d.getMonth()]}`;
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />
            
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={s.headerTitleWrap}>
                    <Text style={s.headerTitle}>เลือกผู้ที่จะเข้าเยี่ยม</Text>
                    <Text style={s.headerSub}>กรุณาเลือกรายชื่อผู้ต้องขังที่ท่านต้องการเยี่ยม</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={s.dateBanner}>
                    <MaterialCommunityIcons name="calendar-check" size={20} color={C.greenText} />
                    <Text style={s.dateText}>
                        {formatDateThai(date)} : <Text style={{ color: C.greenText }}>เปิดให้จองคิว</Text>
                    </Text>
                </View>

                <View style={s.searchWrapper}>
                    <Ionicons name="search" size={20} color="#999" style={s.searchIconLeft} />
                    <TextInput 
                        style={s.searchInput}
                        placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                <Text style={s.sectionLabel}>รายชื่อในความดูแลของคุณ</Text>

                {loading ? (
                    <View style={{marginTop: 50}}><ActivityIndicator size="large" color={C.primary} /></View>
                ) : (
                    inmates.filter(i => (i.fullname || "").includes(searchText)).map((item) => {
                        const isSelected = selectedInmateId === item.inmate_id;
                        const remainingQuota = item.Quota?.remaining ?? "0"; 
                        const isFull = item.Quota?.is_full;
                        const isFemale = checkIsFemale(item); // 🟢 เรียกใช้ฟังก์ชันอัจฉริยะ

                        return (
                            <TouchableOpacity 
                                key={item.inmate_id} 
                                style={[s.card, isSelected && s.cardSelected, isFull && s.cardDisabled]} 
                                onPress={() => !isFull && setSelectedInmateId(item.inmate_id)}
                                activeOpacity={0.8}
                                disabled={isFull}
                            >
                                <View style={[s.cardMiniHeader, { backgroundColor: isFemale ? C.female : C.male }]}>
                                    <Text style={s.cardMiniHeaderText}>
                                        <Ionicons name={isFemale ? "woman" : "man"} size={12} color="#FFF" /> 
                                        {isFemale ? " แดนหญิง" : " แดนชาย"}
                                    </Text>
                                    <Text style={s.cardMiniHeaderText}>สิทธิ์คงเหลือ: {remainingQuota} ครั้ง</Text>
                                </View>

                                <View style={s.cardBody}>
                                    <View style={s.avatarBox}>
                                        <View style={[s.avatarCircle, { borderColor: isFemale ? C.female : C.male }]}>
                                            <Ionicons name="person" size={40} color={isFemale ? C.female : C.male} />
                                        </View>
                                    </View>
                                    
                                    <View style={s.infoBox}>
                                        <Text style={s.nameText}>{item.fullname}</Text>
                                        <Text style={s.codeText}>รหัส : {item.inmate_number || item.inmate_code}</Text>
                                        <View style={s.statusRow}>
                                            <View style={[s.dot, { backgroundColor: isFull ? C.redBtn : C.greenText }]} />
                                            <Text style={[s.statusText, { color: isFull ? C.redBtn : C.greenText }]}>
                                                {isFull ? "โควต้าเดือนนี้เต็มแล้ว" : "สามารถจองเยี่ยมได้"}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={s.checkWrap}>
                                        <View style={[s.radioOuter, isSelected && { borderColor: C.primary }]}>
                                            {isSelected && <View style={s.radioInner} />}
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            <View style={s.footer}>
                <TouchableOpacity 
                    style={[s.confirmBtn, !selectedInmateId && s.btnDisabled]} 
                    onPress={handleConfirm}
                    disabled={!selectedInmateId}
                >
                    <LinearGradient 
                        colors={!selectedInmateId ? ['#CCC', '#BBB'] : [C.primary, '#92444c']} 
                        style={s.gradientBtn}
                    >
                        <Text style={s.confirmBtnText}>ดำเนินการต่อ</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" style={{marginLeft: 8}} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { 
        backgroundColor: C.primary, 
        paddingTop: 60, 
        paddingBottom: 25, 
        paddingHorizontal: 20, 
        flexDirection: "row", 
        alignItems: "center",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5
    },
    backBtn: { padding: 5 },
    headerTitleWrap: { flex: 1, alignItems: 'center' },
    headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
    headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },

    dateBanner: {
        backgroundColor: "#FFF",
        margin: 16,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        borderWidth: 1,
        borderColor: C.border
    },
    dateText: { fontSize: 15, fontWeight: "bold", color: "#333", marginLeft: 8 },

    searchWrapper: {
        marginHorizontal: 16,
        marginBottom: 20,
        position: 'relative',
        justifyContent: 'center'
    },
    searchInput: {
        backgroundColor: "#FFF",
        borderRadius: 15,
        paddingVertical: 12,
        paddingLeft: 45,
        paddingRight: 20,
        elevation: 2,
        borderWidth: 1,
        borderColor: C.border,
        fontSize: 14
    },
    searchIconLeft: { position: 'absolute', left: 15, zIndex: 1 },

    sectionLabel: { marginHorizontal: 20, marginBottom: 12, fontWeight: "bold", fontSize: 16, color: C.primary },

    card: {
        backgroundColor: "#FFF",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: "hidden",
        elevation: 3,
        borderWidth: 2,
        borderColor: "transparent"
    },
    cardSelected: { borderColor: C.primary },
    cardDisabled: { opacity: 0.6, backgroundColor: '#F0F0F0' },
    
    cardMiniHeader: {
        paddingHorizontal: 15,
        paddingVertical: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cardMiniHeaderText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    cardBody: { flexDirection: "row", padding: 15, alignItems: "center" },
    avatarCircle: {
        width: 65,
        height: 65,
        borderRadius: 35,
        borderWidth: 2,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    infoBox: { flex: 1 },
    nameText: { fontSize: 17, fontWeight: "bold", color: "#222", marginBottom: 4 },
    codeText: { fontSize: 13, color: C.subText, marginBottom: 6 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 12, fontWeight: '600' },

    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#DDD",
        justifyContent: "center",
        alignItems: "center"
    },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary },

    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#EEE'
    },
    confirmBtn: { borderRadius: 15, overflow: 'hidden', elevation: 3 },
    gradientBtn: { 
        paddingVertical: 15, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    confirmBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 18 },
    btnDisabled: { elevation: 0 }
});