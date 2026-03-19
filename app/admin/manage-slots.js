// prison-visit-app/app/admin/manage-slots.js
import React, { useState, useEffect } from "react";
import { 
    View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, 
    StatusBar, ActivityIndicator, Modal, FlatList, ScrollView, Platform 
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient'; 
import DateTimePicker from '@react-native-community/datetimepicker'; 

import { 
    getAdminDevices, 
    generateAdminVisitSlots, 
    getAdminVisitSlots, 
    deleteAdminVisitSlot 
} from "../../service/admin.service";

const C = {
    primary: "#722F37",
    bg: "#F8F9FA",
    white: "#FFF",
    text: "#212529",
    subText: "#6C757D",
    border: "#E9ECEF",
    green: "#28A745",
    orange: "#FD7E14",
    red: "#DC3545",
    blue: "#0D6EFD",
    grey: "#CED4DA"
};

export default function ManageSlotsScreen() {
    const router = useRouter();
    const [currentView, setCurrentView] = useState('list'); 

    // States ข้อมูล
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // States สำหรับ Modals
    const [deviceModalVisible, setDeviceModalVisible] = useState(false);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [previewData, setPreviewData] = useState([]);

    // States สำหรับ Date Picker
    const [showFormDatePicker, setShowFormDatePicker] = useState(false);
    const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);

    // Form Data สำหรับการสร้าง (Generate)
    const [form, setForm] = useState({
        deviceId: "",
        deviceName: "กดเพื่อเลือกอุปกรณ์",
        date: new Date(),
        startTime: "09:00",
        endTime: "15:00",
        durationMinutes: "20",
        breakMinutes: "10",
        capacity: "1",
        allowedGender: "Male", // 🟢 เอา ALL ออก เปลี่ยนค่าเริ่มต้นเป็นผู้ชาย
    });

    // Filter Data
    const [filterDate, setFilterDate] = useState(new Date());
    const [isFilterDateActive, setIsFilterDateActive] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterDevice, setFilterDevice] = useState("");

    useEffect(() => {
        fetchDevices();
        fetchSlots();
    }, [filterStatus, filterDevice]);

    const fetchDevices = async () => {
        try {
            const res = await getAdminDevices();
            setDevices(res.data || []);
        } catch (error) { console.error(error); }
        finally { setLoadingDevices(false); }
    };

    // 🟢 ฟังก์ชันแก้วันที่คลาดเคลื่อน (Timezone Fix) 
    // แปลงวันที่ตาม Local Time เพื่อไม่ให้วันเด้งถอยหลัง
    const getLocalISODate = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchSlots = async (searchDate = isFilterDateActive ? filterDate : null) => {
        setLoadingSlots(true);
        try {
            const params = {};
            if (searchDate) {
                const dateStr = getLocalISODate(searchDate); // 🟢 ใช้วิธีใหม่แก้วันที่ถอยหลัง
                params.start_date = dateStr;
                params.end_date = dateStr;
            }
            if (filterDevice) params.device_id = filterDevice;
            const res = await getAdminVisitSlots(params);
            let data = res.data || [];
            if (filterStatus && filterStatus !== 'ALL') {
                data = data.filter(item => {
                    if (filterStatus === 'FULL') return item.status === 'FULL' || item.available_seats === 0;
                    return item.status === filterStatus;
                });
            }
            setSlots(data);
        } catch (error) { console.error(error); }
        finally { setLoadingSlots(false); }
    };

    const onFormDateChange = (event, selectedDate) => {
        setShowFormDatePicker(false);
        if (selectedDate) setForm({ ...form, date: selectedDate });
    };

    const onFilterDateChange = (event, selectedDate) => {
        setShowFilterDatePicker(false);
        if (selectedDate) {
            setFilterDate(selectedDate);
            setIsFilterDateActive(true);
            fetchSlots(selectedDate);
        }
    };

    const handleGenerateSlots = async (isPreview = true) => {
        if (!form.deviceId) return Alert.alert("แจ้งเตือน", "กรุณาเลือกอุปกรณ์");
        setGenerating(true);
        try {
            const payload = {
                is_preview: isPreview,
                schedules: [{
                    date: getLocalISODate(form.date), // 🟢 ใช้วิธีใหม่แก้วันที่ถอยหลังตอนสร้างรอบ
                    start_time: form.startTime,
                    end_time: form.endTime,
                    duration_minutes: parseInt(form.durationMinutes),
                    break_minutes: parseInt(form.breakMinutes),
                    capacity: parseInt(form.capacity),
                    device_id: form.deviceId,
                    allowed_gender: form.allowedGender
                }]
            };
            const res = await generateAdminVisitSlots(payload);
            if (isPreview) {
                setPreviewData(res.preview_data || []);
                setPreviewModalVisible(true);
            } else {
                setPreviewModalVisible(false);
                Alert.alert("สำเร็จ!", "สร้างรอบการจองเรียบร้อย", [{ text: "ตกลง", onPress: () => { setCurrentView('list'); fetchSlots(); } }]);
            }
        } catch (error) { Alert.alert("ผิดพลาด", "ไม่สามารถสร้างรอบการจองได้"); }
        finally { setGenerating(false); }
    };

    const handleDeleteSlot = (id) => {
        Alert.alert("ยืนยันการลบ", "ต้องการลบรอบเวลานี้ใช่หรือไม่?", [
            { text: "ยกเลิก", style: "cancel" },
            { text: "ลบทิ้ง", style: "destructive", onPress: async () => {
                try { await deleteAdminVisitSlot(id); fetchSlots(); } catch (e) { Alert.alert("ผิดพลาด", "ลบไม่ได้"); }
            }}
        ]);
    };

    // 🟢 แปลงวันที่ให้เป็นรูปแบบไทยสวยงาม (DD/MM/YYYY) โดยให้ปีเป็น พ.ศ. (+543)
    const formatDateThai = (d) => {
        if (!d) return "-";
        const dateObj = new Date(d);
        const year = dateObj.getFullYear() + 543;
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    // ==========================================
    // Render: รายการรอบเวลา (List)
    // ==========================================
    const renderList = () => (
        <FlatList
            data={slots}
            keyExtractor={(item, index) => (item.id || index).toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListHeaderComponent={
                <View style={s.listHeader}>
                    <TouchableOpacity style={s.mainCreateBtn} onPress={() => setCurrentView('generate')}>
                        <LinearGradient colors={[C.primary, "#92444c"]} start={{x:0, y:0}} end={{x:1, y:0}} style={s.gradientBtn}>
                            <Ionicons name="add-circle" size={24} color="#FFF" />
                            <Text style={s.mainCreateBtnText}>สร้างรอบการจองใหม่</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={s.searchContainer}>
                        <TouchableOpacity style={s.calendarSearchBox} onPress={() => setShowFilterDatePicker(true)}>
                            <Ionicons name="calendar" size={22} color={C.primary} />
                            <Text style={s.calendarSearchText}>
                                {isFilterDateActive ? `วันที่: ${formatDateThai(filterDate)}` : "เลือกวันที่เพื่อค้นหา..."}
                            </Text>
                            {isFilterDateActive && (
                                <TouchableOpacity onPress={() => { setIsFilterDateActive(false); fetchSlots(null); }}>
                                    <Ionicons name="close-circle" size={20} color="#999" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={s.filterIconButton} onPress={() => setFilterModalVisible(true)}>
                            <Ionicons name="options" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={s.resultCountText}>พบทั้งหมด {slots.length} รอบเวลา</Text>
                </View>
            }
            renderItem={({ item }) => {
                const isFull = item.status === 'FULL' || item.available_seats === 0;
                return (
                    <View style={s.slotCard}>
                        <View style={[s.statusStrip, { backgroundColor: isFull ? C.red : C.green }]} />
                        <View style={s.cardTimeSection}>
                            <Text style={s.cardTimeText}>{item.starts_at?.slice(0, 5)}</Text>
                            <Text style={s.cardDateText}>{formatDateThai(item.visit_date)}</Text>
                        </View>
                        <View style={s.cardInfoSection}>
                            <Text style={s.cardDeviceTitle} numberOfLines={1}>{item.device_name}</Text>
                            <Text style={s.cardSubInfo}>เพศ: {item.allowed_gender === 'Female' ? 'หญิง' : 'ชาย'}</Text>
                            <Text style={s.cardSubInfo}>ว่าง: <Text style={{color: isFull ? C.red : C.green, fontWeight: 'bold'}}>{item.available_seats}</Text> / {item.capacity} ที่</Text>
                        </View>
                        <TouchableOpacity style={s.cardDeleteBtn} onPress={() => handleDeleteSlot(item.id)}>
                            <Ionicons name="trash-outline" size={22} color={C.red} />
                        </TouchableOpacity>
                    </View>
                );
            }}
            ListEmptyComponent={loadingSlots ? <ActivityIndicator size="large" color={C.primary} style={{marginTop: 50}} /> : <Text style={s.emptyText}>ไม่พบข้อมูลรอบการจอง</Text>}
        />
    );

    // ==========================================
    // Render: ฟอร์มสร้างรอบ (Generate)
    // ==========================================
    const renderGenerate = () => (
        <ScrollView contentContainerStyle={s.genContainer} showsVerticalScrollIndicator={false}>
            <View style={s.genCard}>
                <Text style={s.sectionTitle}>1. ข้อมูลพื้นฐาน</Text>
                
                <Text style={s.label}>อุปกรณ์ / ช่องทาง (Device) *</Text>
                <TouchableOpacity style={s.modernInput} onPress={() => setDeviceModalVisible(true)}>
                    <Text style={[s.inputText, !form.deviceId && {color: '#AAA'}]}>{form.deviceName}</Text>
                    <Ionicons name="chevron-forward" size={20} color={C.primary} />
                </TouchableOpacity>

                <Text style={s.label}>วันที่ต้องการสร้างรอบ (Date) *</Text>
                <TouchableOpacity style={s.modernInput} onPress={() => setShowFormDatePicker(true)}>
                    <Text style={s.inputText}>{formatDateThai(form.date)}</Text>
                    <Ionicons name="calendar" size={22} color={C.primary} />
                </TouchableOpacity>

                <Text style={s.sectionTitle}>2. ตั้งค่าเวลาและจำนวน</Text>
                <View style={s.row}>
                    <View style={{flex: 1, marginRight: 10}}>
                        <Text style={s.label}>เวลาเริ่ม (เช่น 09:00)</Text>
                        <TextInput style={s.modernInput} value={form.startTime} onChangeText={t => setForm({...form, startTime: t})} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={s.label}>เวลาจบ (เช่น 15:30)</Text>
                        <TextInput style={s.modernInput} value={form.endTime} onChangeText={t => setForm({...form, endTime: t})} />
                    </View>
                </View>

                <View style={s.row}>
                    <View style={{flex: 1, marginRight: 10}}>
                        <Text style={s.label}>เวลาต่อรอบ (นาที)</Text>
                        <TextInput style={s.modernInput} keyboardType="numeric" value={form.durationMinutes} onChangeText={t => setForm({...form, durationMinutes: t})} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={s.label}>เวลาพัก (นาที)</Text>
                        <TextInput style={s.modernInput} keyboardType="numeric" value={form.breakMinutes} onChangeText={t => setForm({...form, breakMinutes: t})} />
                    </View>
                </View>

                <View style={s.row}>
                    <View style={{flex: 1, marginRight: 10}}>
                        <Text style={s.label}>ความจุต่อรอบ</Text>
                        <TextInput style={s.modernInput} keyboardType="numeric" value={form.capacity} onChangeText={t => setForm({...form, capacity: t})} />
                    </View>
                    <View style={{flex: 1}} />
                </View>

                {/* 🟢 ส่วนเลือกเพศแบบปุ่มกด (เอา "ทั้งหมด" ออก เหลือแค่ ชาย กับ หญิง) */}
                <Text style={s.label}>เพศนักโทษที่อนุญาต</Text>
                <View style={s.genderChoiceRow}>
                    {[
                        { id: 'Male', label: 'ชาย', icon: 'man' },
                        { id: 'Female', label: 'หญิง', icon: 'woman' }
                    ].map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={[s.genderChoiceBtn, form.allowedGender === item.id && s.genderChoiceActive]}
                            onPress={() => setForm({ ...form, allowedGender: item.id })}
                        >
                            <Ionicons name={item.icon} size={18} color={form.allowedGender === item.id ? "#FFF" : C.primary} />
                            <Text style={[s.genderChoiceText, form.allowedGender === item.id && { color: "#FFF" }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={s.finalGenBtn} onPress={() => handleGenerateSlots(true)}>
                    {generating ? <ActivityIndicator color="#FFF" /> : (
                        <>
                            <Ionicons name="flash" size={20} color="#FFF" style={{marginRight: 8}} />
                            <Text style={s.finalGenBtnText}>ดูตัวอย่างและสร้างรอบเวลา</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />
            <View style={s.header}>
                <TouchableOpacity onPress={() => currentView === 'generate' ? setCurrentView('list') : router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <View style={s.headerTitleWrap}>
                    <Text style={s.headerTitle}>{currentView === 'generate' ? "สร้างรอบการจอง" : "จัดการรอบการจอง"}</Text>
                    <Text style={s.headerSub}>{currentView === 'generate' ? "กำหนดวันและเวลาเพื่อเปิดจอง" : "ตรวจสอบคิวว่างทั้งหมด"}</Text>
                </View>
            </View>

            {currentView === 'list' ? renderList() : renderGenerate()}

            {showFormDatePicker && <DateTimePicker value={form.date} mode="date" display="default" onChange={onFormDateChange} />}
            {showFilterDatePicker && <DateTimePicker value={filterDate} mode="date" display="default" onChange={onFilterDateChange} />}

            {/* Device Modal */}
            <Modal visible={deviceModalVisible} transparent animationType="slide">
                <View style={s.modalOverlay}><View style={s.modalContainer}>
                    <View style={s.modalHeader}><Text style={s.modalTitle}>เลือกอุปกรณ์ / ช่องทาง</Text><TouchableOpacity onPress={() => setDeviceModalVisible(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity></View>
                    <ScrollView>{devices.map((device) => (
                        <TouchableOpacity key={device.id} style={s.deviceItem} onPress={() => { setForm({ ...form, deviceId: device.id, deviceName: device.device_name }); setDeviceModalVisible(false); }}>
                            <Ionicons name={device.platforms === 'LINE' ? 'chatbubble-ellipses' : 'videocam'} size={24} color={C.primary} style={{marginRight: 15}} />
                            <View><Text style={s.deviceNameText}>{device.device_name}</Text><Text style={s.deviceSubText}>แพลตฟอร์ม: {device.platforms}</Text></View>
                        </TouchableOpacity>
                    ))}</ScrollView>
                </View></View>
            </Modal>
            
            {/* Preview Modal */}
            <Modal visible={previewModalVisible} transparent animationType="fade">
                <View style={s.previewOverlay}><View style={s.previewContainer}>
                    <Text style={s.previewTitle}>ตรวจสอบความถูกต้อง ({previewData.length} รอบ)</Text>
                    <ScrollView style={{maxHeight: 400}}>{previewData.map((p, i) => (
                        <View key={i} style={s.previewRow}>
                            <Text style={s.previewTime}>{p.start_time?.slice(0, 5)} - {p.end_time?.slice(0, 5)}</Text>
                            <Text style={s.previewDate}>{formatDateThai(p.date)}</Text>
                        </View>
                    ))}</ScrollView>
                    <TouchableOpacity style={s.confirmFinalBtn} onPress={() => handleGenerateSlots(false)} disabled={generating}>
                        {generating ? <ActivityIndicator color="#FFF" /> : <Text style={s.confirmFinalText}>ยืนยันการบันทึกข้อมูล</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={{marginTop: 15}} onPress={() => setPreviewModalVisible(false)}><Text style={{textAlign: 'center', color: '#888'}}>ยกเลิก</Text></TouchableOpacity>
                </View></View>
            </Modal>

            {/* Filter Modal */}
            <Modal visible={filterModalVisible} transparent animationType="fade">
                <View style={s.previewOverlay}><View style={s.previewContainer}>
                    <Text style={s.previewTitle}>ตัวกรองรายการ</Text>
                    <Text style={s.label}>สถานะรอบเวลา</Text>
                    <View style={s.row}>{['ALL', 'OPEN', 'FULL'].map(st => (
                        <TouchableOpacity key={st} style={[s.filterChip, filterStatus === st && s.filterChipActive]} onPress={() => setFilterStatus(st)}><Text style={[s.filterChipText, filterStatus === st && {color: '#FFF'}]}>{st}</Text></TouchableOpacity>
                    ))}</View>
                    <TouchableOpacity style={[s.confirmFinalBtn, {marginTop: 20}]} onPress={() => setFilterModalVisible(false)}><Text style={s.confirmFinalText}>ตกลง</Text></TouchableOpacity>
                </View></View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { backgroundColor: C.primary, paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
    backBtn: { marginRight: 15 },
    headerTitleWrap: { flex: 1 },
    headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
    headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },

    listHeader: { padding: 20 },
    mainCreateBtn: { marginBottom: 20, borderRadius: 15, overflow: 'hidden', elevation: 3 },
    gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
    mainCreateBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
    
    searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    calendarSearchBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 15, paddingHorizontal: 15, height: 50, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, elevation: 1 },
    calendarSearchText: { flex: 1, marginLeft: 10, fontSize: 14, color: C.text },
    filterIconButton: { backgroundColor: C.primary, width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    resultCountText: { marginTop: 15, fontSize: 12, color: C.subText, textAlign: 'center' },

    slotCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', padding: 15, elevation: 2, overflow: 'hidden' },
    statusStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
    cardTimeSection: { width: 80, borderRightWidth: 1, borderRightColor: C.border, paddingRight: 10 },
    cardTimeText: { fontSize: 18, fontWeight: 'bold', color: C.primary },
    cardDateText: { fontSize: 11, color: C.subText, marginTop: 2, fontWeight: '500' },
    cardInfoSection: { flex: 1, paddingLeft: 15 },
    cardDeviceTitle: { fontSize: 14, fontWeight: 'bold', color: C.text },
    cardSubInfo: { fontSize: 12, color: C.subText, marginTop: 4 },
    cardDeleteBtn: { padding: 5 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },

    genContainer: { padding: 20 },
    genCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 3, borderWidth: 1, borderColor: C.border },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: C.primary, marginBottom: 15, marginTop: 10, borderLeftWidth: 4, borderLeftColor: C.primary, paddingLeft: 10 },
    label: { fontSize: 13, color: C.subText, marginBottom: 8, fontWeight: '600' },
    modernInput: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: C.border, borderRadius: 12, height: 50, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    inputText: { fontSize: 15, color: C.text },
    row: { flexDirection: 'row' },
    
    genderChoiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    genderChoiceBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 12, marginHorizontal: 4 },
    genderChoiceActive: { backgroundColor: C.primary, borderColor: C.primary },
    genderChoiceText: { marginLeft: 8, fontSize: 13, color: C.primary, fontWeight: 'bold' },

    finalGenBtn: { backgroundColor: C.primary, borderRadius: 15, height: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 3 },
    finalGenBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: "bold" },
    deviceItem: { flexDirection: "row", alignItems: "center", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.border },
    deviceNameText: { fontSize: 16, fontWeight: "bold" },
    deviceSubText: { fontSize: 12, color: C.subText },
    previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    previewContainer: { backgroundColor: '#FFF', width: '90%', borderRadius: 25, padding: 25, elevation: 10 },
    previewTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: C.primary },
    previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    previewTime: { fontWeight: 'bold', color: C.text },
    previewDate: { color: C.subText, fontSize: 12, fontWeight: '500' },
    confirmFinalBtn: { backgroundColor: C.green, borderRadius: 15, paddingVertical: 15, alignItems: 'center', marginTop: 25 },
    confirmFinalText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    filterChip: { flex: 1, backgroundColor: '#EEE', paddingVertical: 10, alignItems: 'center', borderRadius: 10, marginHorizontal: 5 },
    filterChipActive: { backgroundColor: C.primary },
    filterChipText: { fontSize: 12, fontWeight: 'bold', color: '#666' }
});