import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getDevices, getDeviceById, addDevice, updateDevice, deleteDevice } from "../../service/admin.service";

const C = {
    primary: "#722F37",
    bg: "#F5F5F5",
    white: "#FFF",
    text: "#333",
    subText: "#666",
    border: "#DDD",
    green: "#00C853",
    red: "#FF0000",
    orange: "#FF9800",
    blue: "#4285F4",
    placeholder: "#999"
};

const emptyForm = {
    device_name: "",
    device_type: "PC",
    status: "ACTIVE",
    platforms: [],
    zoom_account_id: "",
    zoom_client_id: "",
    zoom_client_secret: "",
    line_oa_id: "",
    line_oa_url: ""
};

// Component ชิปสำหรับเลือก Type และ Status
const SelectChips = ({ label, options, selectedValue, onSelect, multi = false }) => (
    <View style={s.inputGroup}>
        <Text style={s.label}>{label}</Text>
        <View style={s.chipContainer}>
            {options.map((opt) => {
                const isSelected = multi
                    ? selectedValue.includes(opt.value)
                    : selectedValue === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        style={[s.chipBtn, isSelected && s.chipBtnSelected]}
                        onPress={() => onSelect(opt.value)}
                    >
                        <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
);

export default function AdminManageDevicesScreen() {
    const router = useRouter();

    const [currentView, setCurrentView] = useState('list');
    const [devices, setDevices] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        if (currentView === 'list') {
            fetchDevices();
        }
    }, [currentView]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const res = await getDevices();
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setDevices(data);
        } catch (error) {
            Alert.alert("ผิดพลาด", "ไม่สามารถดึงข้อมูลอุปกรณ์ได้");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.device_name || form.platforms.length === 0) {
            Alert.alert("แจ้งเตือน", "กรุณากรอกชื่ออุปกรณ์ และเลือกแพลตฟอร์มอย่างน้อย 1 อย่าง");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                device_name: form.device_name,
                device_type: form.device_type,
                status: form.status,
                platforms: form.platforms,
                zoom_account_id: form.zoom_account_id,
                zoom_client_id: form.zoom_client_id,
                zoom_client_secret: form.zoom_client_secret,
                line_oa_id: form.line_oa_id,
                line_oa_url: form.line_oa_url
            };

            if (editId) {
                await updateDevice(editId, payload);
                Alert.alert("สำเร็จ", "แก้ไขข้อมูลอุปกรณ์เรียบร้อยแล้ว");
            } else {
                await addDevice(payload);
                Alert.alert("สำเร็จ", "เพิ่มอุปกรณ์ใหม่เรียบร้อยแล้ว");
            }

            setForm(emptyForm);
            setEditId(null);
            setCurrentView('list');
        } catch (error) {
            const msg = error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
            Alert.alert("ผิดพลาด", msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert("ยืนยันการลบ", "คุณต้องการลบอุปกรณ์นี้ใช่หรือไม่?", [
            { text: "ยกเลิก", style: "cancel" },
            {
                text: "ลบข้อมูล",
                style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await deleteDevice(id);
                        Alert.alert("สำเร็จ", "ลบข้อมูลอุปกรณ์เรียบร้อย");
                        fetchDevices();
                    } catch (error) {
                        const msg = error.response?.data?.message || "ไม่สามารถลบอุปกรณ์ได้";
                        if (error.response?.status === 400 && msg.includes("ประวัติ")) {
                            Alert.alert("ลบไม่ได้!", "ระบบตรวจพบว่าอุปกรณ์นี้มีประวัติการจองผูกอยู่ แนะนำให้เข้าไปแก้ไขสถานะเป็น 'ปิดปรับปรุง' แทนครับ");
                        } else {
                            Alert.alert("ผิดพลาด", msg);
                        }
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const openEdit = async (item) => {
        setLoading(true);
        try {
            const res = await getDeviceById(item.id);
            const fullData = res.data?.data || res.data || item;

            let plats = fullData.platforms || [];
            if (typeof plats === 'string') plats = [plats];

            setForm({
                device_name: fullData.device_name || "",
                device_type: fullData.device_type || "PC",
                status: fullData.status || "ACTIVE",
                platforms: plats,
                zoom_account_id: fullData.zoom_account_id || "",
                zoom_client_id: fullData.zoom_client_id || "",
                zoom_client_secret: fullData.zoom_client_secret || "",
                line_oa_id: fullData.line_oa_id || "",
                line_oa_url: fullData.line_oa_url || ""
            });
            setEditId(item.id);
            setCurrentView('form');
        } catch (error) {
            Alert.alert("ผิดพลาด", "ไม่สามารถดึงข้อมูลอุปกรณ์เพื่อแก้ไขได้");
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setForm(emptyForm);
        setEditId(null);
        setCurrentView('form');
    };

    const togglePlatform = (val) => {
        let current = [...form.platforms];
        if (current.includes(val)) {
            current = current.filter(item => item !== val);
        } else {
            current.push(val);
        }
        setForm({ ...form, platforms: current });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACTIVE': return { color: C.green, text: 'พร้อมใช้งาน' };
            case 'INACTIVE': return { color: C.red, text: 'ไม่พร้อมใช้งาน' };
            case 'MAINTENANCE': return { color: C.orange, text: 'ปิดปรับปรุง' };
            default: return { color: C.subText, text: status };
        }
    };

    // ==========================================
    // 1️. หน้าตาราง (List)
    // ==========================================
    const renderList = () => {
        const filteredData = devices.filter(item =>
            (item.device_name || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <View style={{ flex: 1 }}>
                <View style={s.plainHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtnPad}>
                        <Ionicons name="arrow-back" size={26} color="#FFF" />
                    </TouchableOpacity>
                    <View style={s.headerCenter}>
                        <Text style={s.headerTitle}>จัดการอุปกรณ์</Text>
                        <Text style={s.headerSub}>เพิ่ม ลบ และตั้งค่า Zoom/Line</Text>
                    </View>
                    <TouchableOpacity onPress={openAdd} style={s.addBtn}>
                        <Ionicons name="add" size={24} color={C.primary} />
                    </TouchableOpacity>
                </View>

                <View style={s.searchBoxContainer}>
                    <Ionicons name="search" size={20} color="#999" style={s.searchIcon} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="ค้นหาชื่ออุปกรณ์..."
                        placeholderTextColor={C.placeholder} // 🟢 บังคับสี
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    {loading ? (
                        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 50 }} />
                    ) : filteredData.length === 0 ? (
                        <Text style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>
                            ไม่มีข้อมูลอุปกรณ์ในระบบ
                        </Text>
                    ) : (
                        filteredData.map((item) => {
                            const stat = getStatusStyle(item.status);
                            let platString = "";
                            if (Array.isArray(item.platforms)) platString = item.platforms.join(", ");
                            else if (typeof item.platforms === 'string') platString = item.platforms;

                            return (
                                <View key={item.id} style={s.userCard}>
                                    <View style={[s.avatar, { backgroundColor: '#E3F2FD' }]}>
                                        <Feather name={item.device_type === 'Labtop' ? "laptop" : "monitor"} size={24} color={C.blue} />
                                    </View>
                                    <View style={s.userInfo}>
                                        <Text style={s.userName}>{item.device_name}</Text>
                                        <Text style={s.userId}>รองรับ: {platString || '-'}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stat.color, marginRight: 5 }} />
                                            <Text style={{ fontSize: 12, color: stat.color, fontWeight: 'bold' }}>{stat.text}</Text>
                                        </View>
                                    </View>
                                    <View style={s.actionCol}>
                                        <TouchableOpacity onPress={() => openEdit(item)} style={s.iconBtn}>
                                            <MaterialCommunityIcons name="pencil-outline" size={24} color="#666" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.iconBtn}>
                                            <MaterialCommunityIcons name="trash-can-outline" size={24} color={C.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </View>
        );
    };

    // ==========================================
    // 2️. หน้าฟอร์ม (Add / Edit)
    // ==========================================
    const renderForm = () => (
        <View style={{ flex: 1 }}>
            <View style={s.plainHeader}>
                <TouchableOpacity onPress={() => setCurrentView('list')} style={s.backBtnPad}>
                    <Ionicons name="arrow-back" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>{editId ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์ใหม่"}</Text>
                    <Text style={s.headerSub}>ตั้งค่าข้อมูลและช่องทาง</Text>
                </View>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 150 }} // 🟢 เพิ่ม paddingBottom เป็น 150 ให้ดึงหลบคีย์บอร์ดได้
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={s.card}>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>ชื่ออุปกรณ์ (Device Name) *</Text>
                        <TextInput
                            style={s.input}
                            placeholder="เช่น Zoom 1, Line 2"
                            placeholderTextColor={C.placeholder} // 🟢 บังคับสี
                            value={form.device_name}
                            onChangeText={(t) => setForm({ ...form, device_name: t })}
                        />
                    </View>

                    <SelectChips
                        label="ประเภทอุปกรณ์ (Type)"
                        selectedValue={form.device_type}
                        onSelect={(val) => setForm({ ...form, device_type: val })}
                        options={[
                            { label: 'คอมพิวเตอร์ (PC)', value: 'PC' },
                            { label: 'แล็ปท็อป (Labtop)', value: 'Labtop' }
                        ]}
                    />

                    <SelectChips
                        label="สถานะ (Status)"
                        selectedValue={form.status}
                        onSelect={(val) => setForm({ ...form, status: val })}
                        options={[
                            { label: 'พร้อมใช้งาน', value: 'ACTIVE' },
                            { label: 'ไม่พร้อมใช้งาน', value: 'INACTIVE' },
                            { label: 'ปิดปรับปรุง', value: 'MAINTENANCE' }
                        ]}
                    />

                    <SelectChips
                        label="แพลตฟอร์มที่รองรับ (เลือกได้มากกว่า 1) *"
                        selectedValue={form.platforms}
                        onSelect={togglePlatform}
                        multi={true}
                        options={[
                            { label: 'Zoom Meeting', value: 'ZOOM' },
                            { label: 'LINE Video', value: 'LINE' }
                        ]}
                    />

                    {/* 🟢 บังคับสี placeholderTextColor ทุกช่อง */}
                    {form.platforms.includes('ZOOM') && (
                        <View style={s.platformBox}>
                            <Text style={s.platformTitle}>ตั้งค่า ZOOM</Text>
                            <TextInput style={s.input} placeholder="Zoom Account ID" placeholderTextColor={C.placeholder} value={form.zoom_account_id} onChangeText={(t) => setForm({ ...form, zoom_account_id: t })} />
                            <TextInput style={[s.input, { marginTop: 10 }]} placeholder="Zoom Client ID" placeholderTextColor={C.placeholder} value={form.zoom_client_id} onChangeText={(t) => setForm({ ...form, zoom_client_id: t })} />
                            <TextInput style={[s.input, { marginTop: 10 }]} placeholder="Zoom Client Secret" placeholderTextColor={C.placeholder} value={form.zoom_client_secret} onChangeText={(t) => setForm({ ...form, zoom_client_secret: t })} />
                        </View>
                    )}

                    {form.platforms.includes('LINE') && (
                        <View style={s.platformBox}>
                            <Text style={s.platformTitle}>ตั้งค่า LINE</Text>
                            <TextInput style={s.input} placeholder="Line OA ID (เช่น @1234abc)" placeholderTextColor={C.placeholder} value={form.line_oa_id} onChangeText={(t) => setForm({ ...form, line_oa_id: t })} />
                            <TextInput style={[s.input, { marginTop: 10 }]} placeholder="Line OA URL (เช่น https://line.me/...)" placeholderTextColor={C.placeholder} value={form.line_oa_url} onChangeText={(t) => setForm({ ...form, line_oa_url: t })} />
                        </View>
                    )}

                    <View style={s.btnRow}>
                        <TouchableOpacity style={[s.btnSubmit, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnSubmitText}>บันทึกข้อมูล</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={s.btnCancel} onPress={() => setCurrentView('list')} disabled={saving}>
                            <Text style={s.btnCancelText}>ยกเลิก</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </View>
    );

    return (
        // KeyboardAvoidingView ให้ดึงขึ้นตอนคีย์บอร์ดเด้ง
        <KeyboardAvoidingView
            style={s.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />
            {currentView === 'list' ? renderList() : renderForm()}
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },

    plainHeader: {
        backgroundColor: C.primary,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 20,
        flexDirection: "row",
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
        marginTop: 2,
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
    },
    backBtnPad: {
        padding: 5,
    },
    addBtn: {
        backgroundColor: "#FFF",
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: "center",
        alignItems: "center",
    },

    searchBoxContainer: {
        flexDirection: "row",
        backgroundColor: C.white,
        margin: 16,
        borderRadius: 10,
        paddingHorizontal: 15,
        alignItems: "center",
        height: 45,
        borderWidth: 1,
        borderColor: "#DDD",
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: C.text,
    },

    userCard: {
        flexDirection: "row",
        backgroundColor: C.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 1,
        borderWidth: 1,
        borderColor: "#EEE",
        alignItems: "center",
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
    },
    userInfo: {
        flex: 1,
        marginLeft: 15,
    },
    userName: {
        fontSize: 16,
        fontWeight: "bold",
        color: C.text,
        marginBottom: 4,
    },
    userId: {
        fontSize: 13,
        color: C.subText,
    },
    actionCol: {
        flexDirection: "row",
        gap: 5,
    },
    iconBtn: {
        padding: 8,
        backgroundColor: "#F9F9F9",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#EEE",
    },

    card: {
        backgroundColor: C.white,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#EEE",
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        color: "#555",
        marginBottom: 8,
        fontWeight: "bold",
    },
    input: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 48,
        fontSize: 15,
        color: C.text,
        backgroundColor: "#FAFAFA",
    },

    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chipBtn: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: "#FAFAFA",
    },
    chipBtnSelected: {
        borderColor: C.primary,
        backgroundColor: "#FADEE1",
    },
    chipText: {
        fontSize: 13,
        color: "#666",
    },
    chipTextSelected: {
        color: C.primary,
        fontWeight: "bold",
    },

    platformBox: {
        backgroundColor: "#F9F9F9",
        borderWidth: 1,
        borderColor: "#EEE",
        borderRadius: 10,
        padding: 15,
        marginBottom: 18,
    },
    platformTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: C.primary,
        marginBottom: 10,
    },

    btnRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
    },
    btnSubmit: {
        flex: 1,
        backgroundColor: C.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    btnSubmitText: {
        color: C.white,
        fontWeight: "bold",
        fontSize: 15,
    },
    btnCancel: {
        flex: 1,
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: "#CCC",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    btnCancelText: {
        color: "#555",
        fontWeight: "bold",
        fontSize: 15,
    },
});