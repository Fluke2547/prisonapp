// prison-visit-app/app/admin/users.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// 🟢 Import Service ทั้งหมด
import {
    getAdminUsers, addAdminUser, updateAdminUser, deleteAdminUser, getAdminRelatives, updateRelativeStatus, updateRelativeInfo // 🟢 เพิ่ม API ที่เพิ่งสร้างใหม่
} from "../../service/admin.service";

const C = {
    primary: "#722F37",
    bg: "#F5F5F5",
    white: "#FFF",
    text: "#333",
    subText: "#666",
    border: "#DDD",
    blue: "#4285F4",
    green: "#00C853",
    orange: "#FF9800",
    purple: "#9C27B0",
    red: "#E53935"
};

// ฟอร์มตั้งต้นของเจ้าหน้าที่
const emptyOfficerForm = {
    username: "",
    fullname: "",
    password: "",
    role: "VISITATION"
};

// 🟢 ฟอร์มตั้งต้นของญาติ
const emptyRelativeForm = {
    prefixes_nameth: "นาย",
    firstname: "",
    lastname: "",
    phone: "",
    id_card: ""
};

export default function AdminManageUsersScreen() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('officers');
    const [currentView, setCurrentView] = useState('list');

    const [officers, setOfficers] = useState([]);
    const [relatives, setRelatives] = useState([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // State สำหรับฟอร์มเจ้าหน้าที่
    const [officerForm, setOfficerForm] = useState(emptyOfficerForm);
    const [showPassword, setShowPassword] = useState(false);

    // 🟢 State สำหรับฟอร์มญาติ
    const [relativeForm, setRelativeForm] = useState(emptyRelativeForm);

    // ใช้ร่วมกันทั้ง 2 ฝั่ง
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        if (currentView === 'list') {
            if (activeTab === 'officers') fetchOfficers();
            else fetchRelatives();
        }
    }, [activeTab, currentView]);

    // ==========================================
    // 🟡 ฟังก์ชันฝั่งเจ้าหน้าที่
    // ==========================================
    const fetchOfficers = async () => {
        setLoading(true);
        try {
            const res = await getAdminUsers();
            setOfficers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (error) {
            console.error("Fetch Officers Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOfficer = async () => {
        if (!officerForm.username || !officerForm.fullname || !officerForm.role) {
            Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน"); return;
        }
        if (!editId && !officerForm.password) {
            Alert.alert("แจ้งเตือน", "กรุณาตั้งรหัสผ่าน"); return;
        }
        setSaving(true);
        try {
            const payload = { username: officerForm.username, fullname: officerForm.fullname, role: officerForm.role };
            if (officerForm.password) payload.password = officerForm.password;

            if (editId) {
                await updateAdminUser(editId, payload);
                Alert.alert("สำเร็จ", "แก้ไขข้อมูลเจ้าหน้าที่เรียบร้อย");
            } else {
                await addAdminUser(payload);
                Alert.alert("สำเร็จ", "เพิ่มเจ้าหน้าที่ใหม่เรียบร้อย");
            }
            setOfficerForm(emptyOfficerForm);
            setEditId(null);
            setCurrentView('list');
        } catch (error) {
            Alert.alert("ผิดพลาด", error.response?.data?.message || "บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteOfficer = (id, roleName) => {
        if (roleName === "SUPER_ADMIN") {
            Alert.alert("ไม่อนุญาต", "ไม่สามารถลบผู้ดูแลระบบสูงสุดได้"); return;
        }
        Alert.alert("ยืนยันการลบ", "คุณต้องการลบเจ้าหน้าที่นี้ใช่หรือไม่?", [
            { text: "ยกเลิก", style: "cancel" },
            {
                text: "ลบข้อมูล", style: "destructive", onPress: async () => {
                    try { setLoading(true); await deleteAdminUser(id); fetchOfficers(); }
                    catch (error) { Alert.alert("ผิดพลาด", "ไม่สามารถลบได้"); }
                    finally { setLoading(false); }
                }
            }
        ]);
    };

    // ==========================================
    // 🟢 ฟังก์ชันฝั่งญาติ (Relatives)
    // ==========================================
    const fetchRelatives = async () => {
        setLoading(true);
        try {
            const res = await getAdminRelatives();
            setRelatives(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (error) {
            console.error("Fetch Relatives Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRelativeStatus = (userId, currentStatus) => {
        const isCurrentlyActive = String(currentStatus) === "1";
        const actionText = isCurrentlyActive ? "ระงับการใช้งาน" : "เปิดใช้งาน";
        const newStatus = isCurrentlyActive ? "0" : "1";

        Alert.alert(`ยืนยัน${actionText}`, `คุณต้องการ${actionText}บัญชีญาตินี้ใช่หรือไม่?`, [
            { text: "ยกเลิก", style: "cancel" },
            {
                text: actionText, style: isCurrentlyActive ? "destructive" : "default", onPress: async () => {
                    try {
                        setLoading(true);
                        await updateRelativeStatus(userId, newStatus);
                        Alert.alert("สำเร็จ", `${actionText}บัญชีเรียบร้อยแล้ว`);
                        fetchRelatives();
                    } catch (error) {
                        Alert.alert("ผิดพลาด", error.response?.data?.message || `ไม่สามารถ${actionText}ได้`);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    // 🟢 เปิดฟอร์มแก้ข้อมูลญาติ
    const openEditRelative = (item) => {
        setRelativeForm({
            prefixes_nameth: item.prefixes_nameth || "นาย",
            firstname: item.firstname || "",
            lastname: item.lastname || "",
            phone: item.phone || "",
            id_card: item.id_card || ""
        });
        setEditId(item.userId);
        setCurrentView('form');
    };

    // 🟢 บันทึกข้อมูลญาติ
    const handleSaveRelative = async () => {
        if (!relativeForm.firstname || !relativeForm.lastname) {
            Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อและนามสกุลให้ครบถ้วน"); return;
        }
        setSaving(true);
        try {
            await updateRelativeInfo(editId, relativeForm);
            Alert.alert("สำเร็จ", "แก้ไขข้อมูลญาติเรียบร้อยแล้ว");
            setRelativeForm(emptyRelativeForm);
            setEditId(null);
            setCurrentView('list');
        } catch (error) {
            Alert.alert("ผิดพลาด", error.response?.data?.message || "บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // UI Helpers
    // ==========================================
    const getRoleDisplay = (role) => {
        const r = String(role).toUpperCase();
        switch (r) {
            case 'SUPER_ADMIN': return { name: "ผู้ดูแลสูงสุด", color: "#D32F2F", bg: "#FFEBEE" };
            case 'ADMIN': return { name: "ผู้ดูแลระบบ", color: C.blue, bg: "#E3F2FD" };
            case 'REGISTRAR': return { name: "ฝ่ายทะเบียน", color: C.orange, bg: "#FFF3E0" };
            case 'VISITATION': return { name: "จุดรับเยี่ยม", color: C.green, bg: "#E8F5E9" };
            case 'COMMANDER': return { name: "ผู้บังคับบัญชา", color: C.purple, bg: "#F3E5F5" };
            default: return { name: role || "ไม่ระบุ", color: "#999", bg: "#EEE" };
        }
    };

    // ==========================================
    // Render 1: ตารางข้อมูล (List)
    // ==========================================
    const renderList = () => {
        const currentData = activeTab === 'officers' ? officers : relatives;
        const filteredData = currentData.filter(item => {
            if (activeTab === 'officers') {
                return (item.fullname || '').includes(searchQuery) || (item.username || '').includes(searchQuery);
            } else {
                const name = `${item.firstname || ''} ${item.lastname || ''}`;
                return name.includes(searchQuery) || (item.id_card || '').includes(searchQuery);
            }
        });

        return (
            <View style={{ flex: 1 }}>
                <View style={s.plainHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtnPad}>
                        <Ionicons name="arrow-back" size={26} color="#FFF" />
                    </TouchableOpacity>
                    <View style={s.headerCenter}>
                        <Text style={s.headerTitle}>จัดการผู้ใช้งาน</Text>
                        <Text style={s.headerSub}>เจ้าหน้าที่ และ สมาชิกญาติ</Text>
                    </View>
                    {activeTab === 'officers' ? (
                        <TouchableOpacity onPress={() => { setOfficerForm(emptyOfficerForm); setEditId(null); setCurrentView('form'); }} style={s.addBtn}>
                            <Ionicons name="add" size={24} color={C.primary} />
                        </TouchableOpacity>
                    ) : <View style={{ width: 34 }} />}
                </View>

                <View style={s.tabContainer}>
                    <TouchableOpacity style={[s.tabBtn, activeTab === 'officers' && s.tabBtnActive]} onPress={() => setActiveTab('officers')}>
                        <Text style={[s.tabText, activeTab === 'officers' && s.tabTextActive]}>เจ้าหน้าที่</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.tabBtn, activeTab === 'relatives' && s.tabBtnActive]} onPress={() => setActiveTab('relatives')}>
                        <Text style={[s.tabText, activeTab === 'relatives' && s.tabTextActive]}>สมาชิกญาติ</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.searchBoxContainer}>
                    <Ionicons name="search" size={20} color="#999" style={s.searchIcon} />
                    <TextInput style={s.searchInput} placeholder={activeTab === 'officers' ? "ค้นหาชื่อ หรือ Username" : "ค้นหาชื่อ หรือ เลขบัตร ปชช."} value={searchQuery} onChangeText={setSearchQuery} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    {loading ? (
                        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 50 }} />
                    ) : filteredData.length === 0 ? (
                        <Text style={s.emptyText}>ไม่พบข้อมูลในระบบ</Text>
                    ) : (
                        filteredData.map((item, index) => {
                            if (activeTab === 'officers') {
                                const roleInfo = getRoleDisplay(item.role);
                                return (
                                    <View key={item.id || index} style={s.userCard}>
                                        <View style={[s.avatar, { backgroundColor: roleInfo.bg }]}><Ionicons name="shield-checkmark" size={24} color={roleInfo.color} /></View>
                                        <View style={s.userInfo}>
                                            <Text style={s.userName}>{item.fullname}</Text>
                                            <Text style={s.userId}>User: {item.username || '-'}</Text>
                                            <View style={[s.roleBadge, { backgroundColor: roleInfo.color }]}><Text style={s.roleBadgeText}>{roleInfo.name}</Text></View>
                                        </View>
                                        <View style={s.actionCol}>
                                            <TouchableOpacity onPress={() => {
                                                setOfficerForm({ username: item.username, fullname: item.fullname, password: "", role: item.role || "VISITATION" });
                                                setEditId(item.id);
                                                setCurrentView('form');
                                            }} style={s.iconBtn}>
                                                <MaterialCommunityIcons name="pencil-outline" size={22} color="#666" />
                                            </TouchableOpacity>
                                            {item.role !== "SUPER_ADMIN" && (
                                                <TouchableOpacity onPress={() => handleDeleteOfficer(item.id, item.role)} style={s.iconBtn}>
                                                    <MaterialCommunityIcons name="trash-can-outline" size={22} color={C.primary} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            }

                            // 🟢 การ์ดญาติ (เพิ่มปุ่มแก้ไข ✏️)
                            if (activeTab === 'relatives') {
                                const isActive = String(item.is_active) === "1";
                                return (
                                    <View key={item.userId || index} style={s.userCard}>
                                        <View style={[s.avatar, { backgroundColor: isActive ? '#E8F5E9' : '#FFEBEE' }]}>
                                            <Ionicons name="person" size={24} color={isActive ? C.green : C.red} />
                                        </View>
                                        <View style={s.userInfo}>
                                            <Text style={s.userName}>{item.prefixes_nameth || ''}{item.firstname} {item.lastname}</Text>
                                            <Text style={s.userId}>บัตร ปชช: {item.id_card || '-'}</Text>
                                            <Text style={s.userId}>โทร: {item.phone || '-'}</Text>
                                            <View style={[s.statusBadge, { backgroundColor: isActive ? '#E8F5E9' : '#FFEBEE' }]}>
                                                <View style={[s.dot, { backgroundColor: isActive ? C.green : C.red }]} />
                                                <Text style={[s.statusBadgeText, { color: isActive ? C.green : C.red }]}>{isActive ? 'ใช้งานปกติ' : 'ถูกระงับ'}</Text>
                                            </View>
                                        </View>
                                        <View style={[s.actionCol, { justifyContent: 'space-between' }]}>
                                            <TouchableOpacity onPress={() => openEditRelative(item)} style={[s.iconBtn, { alignSelf: 'flex-end', marginBottom: 10 }]}>
                                                <MaterialCommunityIcons name="pencil-outline" size={22} color="#666" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleToggleRelativeStatus(item.userId, item.is_active)} style={[s.suspendBtn, { borderColor: isActive ? C.red : C.green }]}>
                                                <Ionicons name={isActive ? "ban" : "checkmark-circle"} size={16} color={isActive ? C.red : C.green} />
                                                <Text style={[s.suspendBtnText, { color: isActive ? C.red : C.green }]}>{isActive ? 'ระงับบัญชี' : 'เปิดใช้งาน'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            }
                        })
                    )}
                </ScrollView>
            </View>
        );
    };

    // ==========================================
    // Render 2: หน้าฟอร์ม Add/Edit (แยก 2 ฝั่ง)
    // ==========================================
    const renderForm = () => {
        const isOfficer = activeTab === 'officers';

        // Header Title 
        let formTitle = "ข้อมูล";
        if (isOfficer) formTitle = editId ? "แก้ไขข้อมูลเจ้าหน้าที่" : "เพิ่มเจ้าหน้าที่ใหม่";
        else formTitle = "แก้ไขข้อมูลญาติ";

        return (
            <View style={{ flex: 1 }}>
                <View style={s.plainHeader}>
                    <TouchableOpacity onPress={() => setCurrentView('list')} style={s.backBtnPad}>
                        <Ionicons name="arrow-back" size={26} color="#FFF" />
                    </TouchableOpacity>
                    <View style={s.headerCenter}>
                        <Text style={s.headerTitle}>{formTitle}</Text>
                        <Text style={s.headerSub}>กรอกข้อมูลให้ครบถ้วนเพื่อบันทึก</Text>
                    </View>
                    <View style={{ width: 38 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

                    {/* 🛡️ ฟอร์มเจ้าหน้าที่ */}
                    {isOfficer && (
                        <View style={s.card}>
                            <Text style={s.label}>สิทธิ์การเข้าใช้งาน (Role) *</Text>
                            <View style={s.roleSelectorBox}>
                                {[{ id: 'SUPER_ADMIN', name: 'ผู้ดูแลระบบ', color: C.blue }, { id: 'REGISTRAR', name: 'ฝ่ายทะเบียน', color: C.orange }, { id: 'VISITATION', name: 'จุดรับเยี่ยม', color: C.green }, { id: 'COMMANDER', name: 'ผู้บังคับบัญชา', color: C.purple }].map((r) => {
                                    const isSelected = officerForm.role === r.id;
                                    return (
                                        <TouchableOpacity key={r.id} style={[s.roleOption, isSelected && { borderColor: r.color, backgroundColor: r.color + '1A' }]} onPress={() => setOfficerForm({ ...officerForm, role: r.id })}>
                                            <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={18} color={isSelected ? r.color : "#999"} />
                                            <Text style={[s.roleOptionText, isSelected && { color: r.color, fontWeight: 'bold' }]}>{r.name}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                            <View style={s.inputGroup}>
                                <Text style={s.label}>ชื่อผู้ใช้งาน (Username) *</Text>
                                <TextInput style={[s.input, editId && { backgroundColor: '#EEE', color: '#888' }]} placeholder="เช่น admin123" value={officerForm.username} onChangeText={(t) => setOfficerForm({ ...officerForm, username: t })} autoCapitalize="none" editable={!editId} />
                            </View>
                            <View style={s.inputGroup}>
                                <Text style={s.label}>ชื่อ-นามสกุล (Fullname) *</Text>
                                <TextInput style={s.input} placeholder="เช่น สมชาย ใจดี" value={officerForm.fullname} onChangeText={(t) => setOfficerForm({ ...officerForm, fullname: t })} />
                            </View>
                            <View style={s.inputGroup}>
                                <Text style={s.label}>{editId ? "รหัสผ่านใหม่ (ปล่อยว่างหากไม่ต้องการเปลี่ยน)" : "ตั้งรหัสผ่าน *"}</Text>
                                <View style={s.passwordWrap}>
                                    <TextInput style={s.inputInside} placeholder="ระบุรหัสผ่าน" value={officerForm.password} onChangeText={(t) => setOfficerForm({ ...officerForm, password: t })} secureTextEntry={!showPassword} autoCapitalize="none" />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}><Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#888" /></TouchableOpacity>
                                </View>
                            </View>
                            <View style={s.btnRow}>
                                <TouchableOpacity style={[s.btnSubmit, saving && { opacity: 0.7 }]} onPress={handleSaveOfficer} disabled={saving}>
                                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnSubmitText}>บันทึกข้อมูล</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={s.btnCancel} onPress={() => setCurrentView('list')} disabled={saving}><Text style={s.btnCancelText}>ยกเลิก</Text></TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* 🧑 ฟอร์มญาติ */}
                    {!isOfficer && (
                        <View style={s.card}>
                            <Text style={s.label}>คำนำหน้าชื่อ</Text>
                            <View style={s.roleSelectorBox}>
                                {['นาย', 'นาง', 'นางสาว'].map((prefix) => {
                                    const isSelected = relativeForm.prefixes_nameth === prefix;
                                    return (
                                        <TouchableOpacity key={prefix} style={[s.roleOption, { width: '31%' }, isSelected && { borderColor: C.primary, backgroundColor: '#FADEE1' }]} onPress={() => setRelativeForm({ ...relativeForm, prefixes_nameth: prefix })}>
                                            <Text style={[s.roleOptionText, { marginLeft: 0, textAlign: 'center', width: '100%' }, isSelected && { color: C.primary, fontWeight: 'bold' }]}>{prefix}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>

                            <View style={s.inputGroup}>
                                <Text style={s.label}>ชื่อจริง (Firstname) *</Text>
                                <TextInput style={s.input} placeholder="เช่น สมหมาย" value={relativeForm.firstname} onChangeText={(t) => setRelativeForm({ ...relativeForm, firstname: t })} />
                            </View>

                            <View style={s.inputGroup}>
                                <Text style={s.label}>นามสกุล (Lastname) *</Text>
                                <TextInput style={s.input} placeholder="เช่น รักดี" value={relativeForm.lastname} onChangeText={(t) => setRelativeForm({ ...relativeForm, lastname: t })} />
                            </View>

                            <View style={s.inputGroup}>
                                <Text style={s.label}>เลขบัตรประชาชน (ID Card)</Text>
                                <TextInput style={s.input} placeholder="13 หลัก" value={relativeForm.id_card} onChangeText={(t) => setRelativeForm({ ...relativeForm, id_card: t })} keyboardType="number-pad" maxLength={13} />
                            </View>

                            <View style={s.inputGroup}>
                                <Text style={s.label}>เบอร์โทรศัพท์ (Phone)</Text>
                                <TextInput style={s.input} placeholder="เช่น 0812345678" value={relativeForm.phone} onChangeText={(t) => setRelativeForm({ ...relativeForm, phone: t })} keyboardType="phone-pad" maxLength={10} />
                            </View>

                            <View style={s.btnRow}>
                                <TouchableOpacity style={[s.btnSubmit, saving && { opacity: 0.7 }]} onPress={handleSaveRelative} disabled={saving}>
                                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnSubmitText}>บันทึกข้อมูล</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={s.btnCancel} onPress={() => setCurrentView('list')} disabled={saving}><Text style={s.btnCancelText}>ยกเลิก</Text></TouchableOpacity>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />
            {currentView === 'list' ? renderList() : renderForm()}
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    plainHeader: { backgroundColor: C.primary, paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 20, flexDirection: "row", alignItems: "center" },
    headerTitle: { color: C.white, fontSize: 18, fontWeight: "bold" },
    headerSub: { color: "#E0E0E0", fontSize: 12, marginTop: 2 },
    headerCenter: { flex: 1, alignItems: "center" },
    backBtnPad: { padding: 5 },
    addBtn: { backgroundColor: "#FFF", width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },

    // Tabs
    tabContainer: { flexDirection: 'row', backgroundColor: C.white, elevation: 2 },
    tabBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabBtnActive: { borderBottomColor: C.primary },
    tabText: { fontSize: 15, color: '#888', fontWeight: 'bold' },
    tabTextActive: { color: C.primary },

    searchBoxContainer: { flexDirection: "row", backgroundColor: C.white, margin: 16, borderRadius: 10, paddingHorizontal: 15, alignItems: "center", height: 45, borderWidth: 1, borderColor: "#DDD" },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14, color: C.text },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },

    userCard: { flexDirection: "row", backgroundColor: C.white, borderRadius: 12, padding: 15, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: "#EEE", alignItems: "center" },
    avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
    userInfo: { flex: 1, marginLeft: 15 },
    userName: { fontSize: 16, fontWeight: "bold", color: C.text, marginBottom: 4 },
    userId: { fontSize: 13, color: C.subText, marginBottom: 4 },

    roleBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
    roleBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "bold" },

    statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
    statusBadgeText: { fontSize: 11, fontWeight: "bold" },

    actionCol: { flexDirection: "column", gap: 8, alignItems: 'flex-end' },
    iconBtn: { padding: 8, backgroundColor: "#F9F9F9", borderRadius: 8, borderWidth: 1, borderColor: "#EEE", alignItems: 'center' },

    suspendBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, backgroundColor: '#FAFAFA' },
    suspendBtnText: { fontSize: 12, fontWeight: 'bold' },

    card: { backgroundColor: C.white, borderRadius: 16, padding: 20, elevation: 2, borderWidth: 1, borderColor: "#EEE" },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, color: "#555", marginBottom: 8, fontWeight: "bold" },
    input: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 15, height: 48, fontSize: 15, color: C.text, backgroundColor: "#FAFAFA" },
    passwordWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border, borderRadius: 10, height: 48, backgroundColor: "#FAFAFA" },
    inputInside: { flex: 1, paddingHorizontal: 15, fontSize: 15, color: C.text },
    eyeBtn: { padding: 10 },
    roleSelectorBox: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
    roleOption: { width: "48%", flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#DDD", padding: 10, borderRadius: 8, marginBottom: 10, backgroundColor: "#FFF" },
    roleOptionText: { marginLeft: 8, fontSize: 13, color: "#666" },
    btnRow: { flexDirection: "row", gap: 10, marginTop: 10 },
    btnSubmit: { flex: 1, backgroundColor: C.primary, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
    btnSubmitText: { color: C.white, fontWeight: "bold", fontSize: 15 },
    btnCancel: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: "#CCC", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
    btnCancelText: { color: "#555", fontWeight: "bold", fontSize: 15 }
});