// prison-visit-app/app/admin/inmates.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker'; 

import { uploadInmateExcel, getAdminInmates, addAdminInmate, updateAdminInmate, deleteAdminInmate } from "../../service/admin.service";

const C = { primary: "#722F37", bg: "#F5F5F5", white: "#FFF", text: "#333", subText: "#666", border: "#DDD", greenText: "#2E7D32" };

const emptyForm = {
    id_card: "",
    prefix: "นาย",
    firstname: "",
    lastname: "",
    gender: "Male",
    inmate_number: "",
    zoneText: "",
    birthdate: "", 
    allow_visit: 1
};

const InputField = ({ label, value, onChangeText, keyboardType = "default", maxLength }) => (
    <View style={s.inputGroup}>
        <Text style={s.label}>{label}</Text>
        <TextInput style={s.input} value={value} onChangeText={onChangeText} keyboardType={keyboardType} maxLength={maxLength} />
    </View>
);

const SelectChips = ({ label, options, selectedValue, onSelect, customStyle }) => (
    <View style={[s.inputGroup, customStyle]}>
        <Text style={s.label}>{label}</Text>
        <View style={s.chipContainer}>
            {options.map((opt) => {
                const isSelected = selectedValue === opt.value;
                return (
                    <TouchableOpacity key={opt.value} style={[s.chipBtn, isSelected && s.chipBtnSelected]} onPress={() => onSelect(opt.value)}>
                        <Text style={[s.chipText, isSelected && s.chipTextSelected]}>{opt.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
);

export default function ManageInmatesScreen() {
    const router = useRouter();
    const [currentView, setCurrentView] = useState('home');
    const [inmates, setInmates] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loadingList, setLoadingList] = useState(false);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateObj, setDateObj] = useState(new Date());

    useEffect(() => {
        let interval;
        if (currentView === 'list') {
            fetchInmates(searchQuery, true); 
            interval = setInterval(() => {
                fetchInmates(searchQuery, false); 
            }, 5000);
        }
        return () => {
            if (interval) clearInterval(interval); 
        };
    }, [currentView, searchQuery]);

    const fetchInmates = async (query = "", showLoading = true) => {
        if (showLoading) setLoadingList(true);
        try {
            const res = await getAdminInmates(query);
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        

            setInmates(data);
        } catch (error) {
            if (showLoading) Alert.alert("ผิดพลาด", "ไม่สามารถดึงข้อมูลผู้ต้องขังได้");
        } finally {
            if (showLoading) setLoadingList(false);
        }
    };

    const handleSearch = () => fetchInmates(searchQuery);

    const handleUploadExcel = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'], copyToCacheDirectory: true });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setUploading(true);
                try {
                    await uploadInmateExcel(file.uri, file.name, file.mimeType);
                    Alert.alert("สำเร็จ", "อัปโหลดข้อมูลสำเร็จ!");
                    if (currentView === 'list') fetchInmates();
                } catch (error) {
                    Alert.alert("อัปโหลดไม่สำเร็จ", error.response?.data?.message || "เกิดข้อผิดพลาด");
                } finally { setUploading(false); }
            }
        } catch (err) { }
    };

    const onChangeDate = (event, selected) => {
        setShowDatePicker(false);
        if (selected) {
            setDateObj(selected);
            const yyyy = selected.getFullYear();
            const mm = String(selected.getMonth() + 1).padStart(2, '0');
            const dd = String(selected.getDate()).padStart(2, '0');
            setForm({ ...form, birthdate: `${yyyy}-${mm}-${dd}` });
        }
    };

    const handleSave = async () => {
        if (!form.inmate_number || !form.firstname || !form.lastname) {
            Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (รหัส, ชื่อ, นามสกุล)");
            return;
        }

        const payload = {
            id_card: form.id_card,
            prefix: form.prefix,
            firstname: form.firstname,
            lastname: form.lastname,
            gender: form.gender,
            inmate_number: form.inmate_number,
            zoneText: form.zoneText,
            birthdate: form.birthdate 
        };

        try {
            if (editId) {
                payload.allow_visit = Number(form.allow_visit);
                await updateAdminInmate(editId, payload);
                Alert.alert("สำเร็จ", "อัปเดตข้อมูลผู้ต้องขังเรียบร้อย");
            } else {
                await addAdminInmate(payload);
                Alert.alert("สำเร็จ", "เพิ่มข้อมูลเรียบร้อย");
            }

            setForm(emptyForm);
            setEditId(null);
            setCurrentView('list');
            fetchInmates();
        } catch (error) {
            Alert.alert("ผิดพลาด", error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึก");
        }
    };

    const handleDelete = (id) => {
        Alert.alert("ยืนยันการลบ", "คุณต้องการลบข้อมูลใช่หรือไม่?", [
            { text: "ยกเลิก", style: "cancel" },
            {
                text: "ลบ", style: "destructive", onPress: async () => {
                    try {
                        await deleteAdminInmate(id);
                        Alert.alert("สำเร็จ", "ลบข้อมูลเรียบร้อยแล้ว");
                        fetchInmates();
                    } catch (error) { Alert.alert("ผิดพลาด", "ลบไม่ได้"); }
                }
            }
        ]);
    };

    // 🟢 ดักจับวันเกิดทุกรูปแบบที่ Backend อาจจะส่งมา
    const getRawBirthDate = (item) => {
        return item.birthdate || item.birth_date || item.birthDate || item.dob || item.date_of_birth || item.birthday || "";
    };

    const openEdit = (item) => {
        const rawBirth = getRawBirthDate(item); 

        setForm({
            id_card: item.id_card || item.idCard || "",
            prefix: item.prefix || "นาย",
            firstname: item.firstname || "",
            lastname: item.lastname || "",
            gender: item.gender || "Male",
            inmate_number: item.inmate_number || item.prisoner_number || item.inmate_code || "",
            
            // 🟢 ดักจับแดน (เพิ่ม location_name)
            zoneText: item.zoneText || item.zone_text || item.zone || item.location_name || "",
            
            birthdate: rawBirth, 
            allow_visit: item.allow_visit !== undefined ? item.allow_visit : 1
        });
        
        if(rawBirth) {
            setDateObj(new Date(rawBirth)); 
        } else {
            setDateObj(new Date()); 
        }

        setEditId(item.id);
        setCurrentView('edit');
    };

    const renderForm = () => (
        <View style={s.card}>
            <InputField label="รหัสผู้ต้องขัง *" value={form.inmate_number} onChangeText={(t) => setForm({ ...form, inmate_number: t })} />
            <InputField label="เลขบัตร ปชช." value={form.id_card} onChangeText={(t) => setForm({ ...form, id_card: t })} keyboardType="number-pad" maxLength={13} />

            <SelectChips
                label="คำนำหน้า"
                selectedValue={form.prefix}
                onSelect={(val) => setForm({ ...form, prefix: val })}
                options={[
                    { label: 'นาย', value: 'นาย' },
                    { label: 'นาง', value: 'นาง' },
                    { label: 'นางสาว', value: 'นางสาว' },
                ]}
            />

            <SelectChips
                label="เพศ (Gender)"
                selectedValue={form.gender}
                onSelect={(val) => setForm({ ...form, gender: val })}
                options={[
                    { label: 'ชาย (Male)', value: 'Male' },
                    { label: 'หญิง (Female)', value: 'Female' },
                ]}
            />

            <InputField label="ชื่อจริง *" value={form.firstname} onChangeText={(t) => setForm({ ...form, firstname: t })} />
            <InputField label="นามสกุล *" value={form.lastname} onChangeText={(t) => setForm({ ...form, lastname: t })} />
            <InputField label="แดน/เรือนนอน" value={form.zoneText} onChangeText={(t) => setForm({ ...form, zoneText: t })} />

            <View style={s.inputGroup}>
                <Text style={s.label}>วันเกิด (YYYY-MM-DD)</Text>
                <TouchableOpacity style={[s.input, { justifyContent: 'center' }]} onPress={() => setShowDatePicker(true)}>
                    <Text style={{ color: form.birthdate ? '#333' : '#999' }}>
                        {form.birthdate || "แตะเพื่อเลือกวันเกิด"}
                    </Text>
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker 
                    value={dateObj} 
                    mode="date" 
                    display="default" 
                    onChange={onChangeDate} 
                />
            )}

            {editId !== null && (
                <SelectChips
                    label="สิทธิ์การเยี่ยม"
                    customStyle={{ backgroundColor: '#FFEBEE', padding: 10, borderRadius: 10 }}
                    selectedValue={form.allow_visit}
                    onSelect={(val) => setForm({ ...form, allow_visit: val })}
                    options={[
                        { label: '✅ อนุญาต', value: 1 },
                        { label: '❌ งดเยี่ยม', value: 0 },
                    ]}
                />
            )}

            <View style={s.btnRow}>
                <TouchableOpacity style={s.btnSubmit} onPress={handleSave}><Text style={s.btnSubmitText}>บันทึกข้อมูล</Text></TouchableOpacity>
                <TouchableOpacity style={s.btnCancel} onPress={() => { setForm(emptyForm); setEditId(null); if (editId) setCurrentView('list'); }}><Text style={s.btnCancelText}>ยกเลิก</Text></TouchableOpacity>
            </View>
        </View>
    );

    const CustomHeader = ({ title, subTitle, onBack }) => (
        <View style={s.flatHeader}>
            <TouchableOpacity onPress={onBack} style={s.backBtnAbsolute}>
                <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={s.headerTextCenter}>
                <Text style={s.headerTitle}>{title}</Text>
                {subTitle ? <Text style={s.headerSubTitle}>{subTitle}</Text> : null}
            </View>
        </View>
    );

    const renderHome = () => (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            <CustomHeader title="จัดการข้อมูลผู้ต้องขัง" subTitle="เพิ่มและนำเข้าข้อมูล (ฝ่ายทะเบียน)" onBack={() => router.back()} />
            <View style={s.contentPad}>
                <Text style={s.cardTitle}>เพิ่มผู้ต้องขัง (รายบุคคล)</Text>
                {renderForm()}

                <TouchableOpacity style={s.excelBtnCard} onPress={handleUploadExcel} disabled={uploading}>
                    {uploading ? <ActivityIndicator size="large" color={C.greenText} /> : <MaterialCommunityIcons name="microsoft-excel" size={40} color={C.greenText} />}
                    <View style={{ marginLeft: 15, flex: 1 }}><Text style={s.tableBtnTitle}>เพิ่มด้วย Excel</Text></View>
                </TouchableOpacity>

                <TouchableOpacity style={s.tableBtnCard} onPress={() => setCurrentView('list')}>
                    <MaterialCommunityIcons name="file-document-edit" size={40} color={C.primary} />
                    <View style={{ marginLeft: 15, flex: 1 }}><Text style={s.tableBtnTitle}>ตารางข้อมูลผู้ต้องขัง</Text></View>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderList = () => (
        <View style={{ flex: 1 }}>
            <CustomHeader title="ตารางผู้ต้องขัง" subTitle="ค้นหา ลบ และแก้ไขข้อมูล" onBack={() => setCurrentView('home')} />
            <View style={s.searchBoxContainer}>
                <Ionicons name="search" size={20} color="#999" style={{ marginRight: 10 }} />
                <TextInput style={{ flex: 1 }} placeholder="ค้นหา รหัส, ชื่อ..." value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
                {loadingList ? <ActivityIndicator size="large" color={C.primary} /> : inmates.map((item, i) => {
                    const rawBirth = getRawBirthDate(item);

                    return (
                        <View key={item.id ? `${item.id}-${i}` : `inmate-${i}`} style={s.inmateCard}>
                            <View style={s.inmateInfo}>
                                <Text style={s.inmateName}>{item.prefix || ""}{item.firstname} {item.lastname}</Text>
                                <Text style={s.inmateCode}>รหัส: {item.inmate_number || item.prisoner_number || item.inmate_code || "-"}</Text>
                                <Text style={s.inmateCode}>บัตร ปชช: {item.id_card || item.idCard || "-"}</Text>
                                
                                {/* 🟢 ดักจับแดน (เพิ่ม location_name ด้วย) */}
                                <Text style={s.inmateCode}>แดน: {item.zoneText || item.zone_text || item.zone || item.location_name || "-"}</Text>
                                
                                <Text style={s.inmateCode}>วันเกิด: {rawBirth || "-"}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => openEdit(item)}><Ionicons name="create-outline" size={26} color="#F57C00" /></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item.id)}><Ionicons name="trash-outline" size={26} color="#D32F2F" /></TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );

    return (
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />
            {currentView === 'home' && renderHome()}
            {currentView === 'list' && renderList()}
            {currentView === 'edit' && (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
                    <CustomHeader title="แก้ไขข้อมูลผู้ต้องขัง" subTitle="อัปเดตข้อมูลรายบุคคล" onBack={() => setCurrentView('list')} />
                    <View style={s.contentPad}>{renderForm()}</View>
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    // --- โครงสร้างหลัก ---
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // --- Header Section ---
    flatHeader: {
        backgroundColor: C.primary,
        paddingTop: Platform.OS === "ios" ? 60 : 45,
        paddingBottom: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    backBtnAbsolute: {
        position: "absolute",
        left: 16,
        bottom: 20,
        padding: 5,
        zIndex: 10,
    },
    headerTextCenter: {
        alignItems: "center",
        paddingHorizontal: 60,
    },
    headerTitle: {
        color: C.white,
        fontSize: 20,
        fontWeight: "bold",
    },
    headerSubTitle: {
        color: "#E0E0E0",
        fontSize: 13,
        marginTop: 4,
    },

    // --- Content & Card UI ---
    contentPad: {
        padding: 16,
    },
    card: {
        backgroundColor: C.white,
        borderRadius: 16,
        padding: 20,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 15,
    },

    // --- Form Elements ---
    inputGroup: {
        marginBottom: 10,
    },
    label: {
        fontSize: 12,
        color: "#888",
        marginBottom: 5,
        fontWeight: "bold",
    },
    input: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        backgroundColor: "#FAFAFA",
    },

    // --- Chips (Selection) ---
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
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

    // --- Buttons & Actions ---
    btnRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 15,
    },
    btnSubmit: {
        flex: 1,
        backgroundColor: C.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    btnSubmitText: {
        color: C.white,
        fontWeight: "bold",
    },
    btnCancel: {
        flex: 1,
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.border,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    btnCancelText: {
        color: C.primary,
        fontWeight: "bold",
    },

    // --- Specialized Cards & Search ---
    excelBtnCard: {
        flexDirection: "row",
        backgroundColor: "#E8F5E9",
        borderRadius: 16,
        padding: 15,
        marginTop: 15,
        alignItems: "center",
    },
    tableBtnCard: {
        flexDirection: "row",
        backgroundColor: C.white,
        borderRadius: 16,
        padding: 15,
        marginTop: 15,
        alignItems: "center",
    },
    tableBtnTitle: {
        fontSize: 15,
        fontWeight: "bold",
    },
    searchBoxContainer: {
        flexDirection: "row",
        backgroundColor: C.white,
        margin: 16,
        borderRadius: 10,
        padding: 10,
        alignItems: "center",
        elevation: 2,
    },

    // --- List Items (Inmate) ---
    inmateCard: {
        flexDirection: "row",
        backgroundColor: C.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "space-between",
    },
    inmateInfo: {
        flex: 1,
    },
    inmateName: {
        fontSize: 16,
        fontWeight: "bold",
        color: C.text,
    },
    inmateCode: {
        fontSize: 12,
        color: C.subText,
        marginTop: 2,
    },
});