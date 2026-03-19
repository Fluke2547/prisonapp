//prison-visit-app/app/admin/manage-register.js
import React, { useState, useEffect } from "react";
// 🟢 1. Import TextInput เพิ่มเติม
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, StatusBar, TouchableWithoutFeedback, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRegisterRequests, approveRegister, rejectRegister } from "../../service/admin.service";

const COLORS = {
    primary: "#722F37",
    green: "#00C853",
    red: "#D32F2F",
    bg: "#F5F5F5",
    card: "#FFFFFF",
};

const AuthImage = ({ filename, token, style, resizeMode }) => {
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [imgBase64, setImgBase64] = useState(null);

    useEffect(() => {
        let isMounted = true;
        if (!filename || !token) {
            setLoading(false);
            return;
        }

        const fetchImage = async () => {
            try {
                const url = `https://prison-visit-booking.duckdns.org/admin/request/image/${filename}`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-API-KEY': process.env.EXPO_PUBLIC_API_KEY
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to load image");
                }

                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (isMounted) {
                        setImgBase64(reader.result);
                        setLoading(false);
                    }
                };
                reader.onerror = () => {
                    if (isMounted) {
                        setHasError(true);
                        setLoading(false);
                    }
                };
                reader.readAsDataURL(blob);

            } catch (error) {
                if (isMounted) {
                    setHasError(true);
                    setLoading(false);
                }
            }
        };

        fetchImage();

        return () => {
            isMounted = false; 
        };
    }, [filename, token]);

    if (!filename) {
        return (
            <View style={[style, s.noImageContainer]}>
                <Ionicons name="image-outline" size={24} color="#999" />
                <Text style={s.noImageText}>ไม่มีรูป</Text>
            </View>
        );
    }

    return (
        <View style={[style, s.authImageWrapper]}>
            {!loading && !hasError && imgBase64 && (
                <Image
                    source={{ uri: imgBase64 }}
                    style={[StyleSheet.absoluteFill, style]}
                    resizeMode={resizeMode || "cover"}
                />
            )}
            
            {loading && (
                <ActivityIndicator size="small" color={COLORS.primary} style={StyleSheet.absoluteFill} />
            )}

            {(!loading && hasError) && (
                <View style={[style, s.noImageContainer]}>
                    <Ionicons name="alert-circle-outline" size={24} color="#D32F2F" />
                    <Text style={[s.noImageText, { color: '#D32F2F' }]}>โหลดรูปไม่สำเร็จ</Text>
                </View>
            )}
        </View>
    );
};

export default function AdminManageRegister() {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState("");

    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedFilename, setSelectedFilename] = useState("");

    // 🟢 2. เพิ่ม State สำหรับจัดการ Modal พิมพ์เหตุผลไม่อนุมัติ
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectingUser, setRejectingUser] = useState({ id: null, name: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const storedToken = await AsyncStorage.getItem("userToken");
            setToken(storedToken);

            const res = await getRegisterRequests();
            const data = res.data || []; 
            setRequests(data);
        } catch (error) {
            console.warn("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, name) => {
        Alert.alert("ยืนยัน", `ต้องการอนุมัติการสมัครของ ${name} ใช่หรือไม่?`, [
            { text: "ยกเลิก", style: "cancel" },
            { 
                text: "อนุมัติ", 
                onPress: async () => {
                    try {
                        await approveRegister(id);
                        Alert.alert("สำเร็จ", "อนุมัติผู้ใช้งานเรียบร้อยแล้ว");
                        loadData(); 
                    } catch (error) {
                        const msg = error.response?.data?.message || "ไม่สามารถอนุมัติได้";
                        Alert.alert("ผิดพลาด", msg);
                    }
                } 
            }
        ]);
    };

    // 🟢 3. เปลี่ยนฟังก์ชันกดปุ่มไม่อนุมัติ ให้มาเปิด Modal แทน Alert
    const openRejectModal = (id, name) => {
        setRejectingUser({ id, name });
        setRejectReason(""); // เคลียร์ข้อความเก่าทุกครั้งที่เปิดใหม่
        setRejectModalVisible(true);
    };

    // 🟢 4. ฟังก์ชันยืนยันการส่งข้อมูลไม่อนุมัติพร้อมเหตุผล
    const submitReject = async () => {
        if (!rejectReason.trim()) {
            Alert.alert("ผิดพลาด", "กรุณาระบุเหตุผลการปฏิเสธคำขอ");
            return;
        }

        try {
            // ส่งเหตุผลแบบไดนามิกจากที่แอดมินพิมพ์ไปให้ Backend
            await rejectRegister(rejectingUser.id, rejectReason.trim());
            Alert.alert("สำเร็จ", "ปฏิเสธคำขอเรียบร้อยแล้ว");
            setRejectModalVisible(false); // ปิดหน้าต่าง
            loadData(); // โหลดข้อมูลใหม่
        } catch (error) {
            const msg = error.response?.data?.message || "ไม่สามารถทำรายการได้";
            Alert.alert("ผิดพลาด", msg);
        }
    };

    const openImage = (filename) => {
        if (!filename) return;
        setSelectedFilename(filename);
        setImageModalVisible(true);
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            {/* --- Header --- */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={s.headerTitleWrap}>
                    <Text style={s.headerTitle}>ตรวจสอบการสมัครสมาชิก</Text>
                    <Text style={s.headerSub}>ตรวจสอบเอกสารและอนุมัติบัญชีญาติ</Text>
                </View>
            </View>

            {/* --- List Content --- */}
            <ScrollView contentContainerStyle={s.scrollContent}>
                {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} /> :
                    requests.length === 0 ? <Text style={s.emptyText}>ไม่มีคำขอสมัครสมาชิกใหม่</Text> :
                        requests.map((item) => (
                            <View key={item.request_id} style={s.card}>
                                <View style={s.detailBox}>
                                    <Text style={s.nameText}>{item.prefixes_nameTh}{item.visitor_firstname} {item.visitor_lastname}</Text>
                                    <Text style={s.infoText}>เลขบัตรประชาชน: {item.visitor_id_card || '-'}</Text>
                                    <Text style={s.infoText}>เบอร์โทรศัพท์: {item.phone || '-'}</Text>
                                    <Text style={s.infoText}>ความสัมพันธ์กับผู้ต้องขัง: {item.type_name_relationship_th || '-'}</Text>
                                    <Text style={[s.infoText, { color: COLORS.primary, fontWeight: 'bold', marginTop: 5 }]}>
                                        ผู้ต้องขังที่ขอเยี่ยม: {item.inmate_firstname || '-'} {item.inmate_lastname || ''}
                                    </Text>
                                </View>

                                {/* --- Image Section --- */}
                                <View style={s.imageRow}>
                                    <View style={s.imageCol}>
                                        <Text style={s.imgLabel}>บัตรประชาชน</Text>
                                        <TouchableOpacity 
                                            style={s.imageContainer} 
                                            onPress={() => openImage(item.id_card_image)} 
                                            disabled={!item.id_card_image}
                                        >
                                            <AuthImage 
                                                filename={item.id_card_image} 
                                                token={token} 
                                                style={s.docImage} 
                                            />
                                            {item.id_card_image && (
                                                <View style={s.zoomOverlay}>
                                                    <Ionicons name="search" size={14} color="#FFF" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    <View style={s.imageCol}>
                                        <Text style={s.imgLabel}>รูปเซลฟี่</Text>
                                        <TouchableOpacity 
                                            style={s.imageContainer} 
                                            onPress={() => openImage(item.selfie_image)} 
                                            disabled={!item.selfie_image}
                                        >
                                            <AuthImage 
                                                filename={item.selfie_image} 
                                                token={token} 
                                                style={s.docImage} 
                                            />
                                            {item.selfie_image && (
                                                <View style={s.zoomOverlay}>
                                                    <Ionicons name="search" size={14} color="#FFF" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* --- Action Buttons --- */}
                                <View style={s.btnRow}>
                                    <TouchableOpacity 
                                        style={s.btnReject} 
                                        /* 🟢 5. เรียกใช้ฟังก์ชันเปิด Modal ตอนกดปุ่มไม่อนุมัติ */
                                        onPress={() => openRejectModal(item.request_id, item.visitor_firstname)}
                                    >
                                        <Ionicons name="close-circle-outline" size={20} color={COLORS.red} style={{marginRight: 5}}/>
                                        <Text style={s.btnRejectText}>ไม่อนุมัติ</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={s.btnApprove} 
                                        onPress={() => handleApprove(item.request_id, item.visitor_firstname)}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{marginRight: 5}}/>
                                        <Text style={s.btnApproveText}>อนุมัติ</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                }
            </ScrollView>

            {/* --- 🟢 Modal (กรอกเหตุผลการปฏิเสธคำขอ) --- */}
            <Modal visible={rejectModalVisible} transparent={true} animationType="slide">
                <View style={s.rejectModalOverlay}>
                    <View style={s.rejectModalBox}>
                        <Text style={s.rejectTitle}>ไม่อนุมัติคำขอ</Text>
                        <Text style={s.rejectSubTitle}>ระบุเหตุผลที่ปฏิเสธบัญชีของ {rejectingUser.name}</Text>
                        
                        <TextInput
                            style={s.rejectInput}
                            placeholder="เช่น ภาพถ่ายบัตรประชาชนไม่ชัดเจน..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                        />

                        <View style={s.rejectActionRow}>
                            <TouchableOpacity 
                                style={s.btnCancelModal} 
                                onPress={() => setRejectModalVisible(false)}
                            >
                                <Text style={s.btnCancelModalText}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={s.btnConfirmModal} 
                                onPress={submitReject}
                            >
                                <Text style={s.btnConfirmModalText}>ยืนยัน</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* --- Modal (Full Screen Image) --- */}
            <Modal visible={imageModalVisible} transparent={true} animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
                <TouchableOpacity style={s.modalImageOverlay} activeOpacity={1} onPress={() => setImageModalVisible(false)}>
                    <TouchableOpacity style={s.closeImageBtn} onPress={() => setImageModalVisible(false)}>
                        <Ionicons name="close" size={30} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableWithoutFeedback>
                        <View style={s.fullScreenImageWrap}>
                            {selectedFilename && token ? (
                                <AuthImage
                                    filename={selectedFilename}
                                    token={token}
                                    style={s.fullScreenImage}
                                    resizeMode="contain"
                                />
                            ) : null}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    /* --- Layout & Container --- */
    container: { 
        flex: 1, 
        backgroundColor: COLORS.bg,
    },
    scrollContent: { 
        padding: 16,
    },

    /* --- Header --- */
    header: { 
        backgroundColor: COLORS.primary, 
        paddingTop: 50, 
        paddingBottom: 20, 
        flexDirection: "row", 
        alignItems: "center",
    },
    backBtn: { 
        padding: 15, 
        zIndex: 10,
    },
    headerTitleWrap: { 
        flex: 1, 
        alignItems: "center", 
        marginRight: 40,
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
    
    /* --- Card & Typography --- */
    card: { 
        backgroundColor: "#FFF", 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 15, 
        elevation: 3, 
        marginHorizontal: 4,
    },
    detailBox: { 
        marginBottom: 15,
    },
    nameText: { 
        fontSize: 18, 
        fontWeight: "bold", 
        color: "#333", 
        marginBottom: 5,
    },
    infoText: { 
        fontSize: 14, 
        color: "#666", 
        marginBottom: 2,
    },
    emptyText: { 
        textAlign: "center", 
        color: "#999", 
        fontSize: 16, 
        marginTop: 50,
    },
    
    /* --- Image Section --- */
    imageRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    imageCol: {
        width: "48%", 
    },
    imgLabel: { 
        fontSize: 13, 
        fontWeight: "bold", 
        color: "#444", 
        marginBottom: 6,
        textAlign: "center"
    },
    imageContainer: { 
        width: "100%", 
        height: 120, 
        backgroundColor: "#EEE", 
        borderRadius: 10, 
        overflow: "hidden", 
        borderWidth: 1,
        borderColor: "#DDD",
    },
    authImageWrapper: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#EEE"
    },
    docImage: { 
        width: "100%", 
        height: "100%",
    },
    noImageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
    },
    noImageText: {
        color: '#999', 
        fontSize: 11, 
        marginTop: 5,
    },
    zoomOverlay: { 
        position: "absolute", 
        bottom: 5, 
        right: 5, 
        backgroundColor: "rgba(0,0,0,0.6)", 
        borderRadius: 15,
        padding: 5,
    },
    
    /* --- Action Buttons --- */
    btnRow: { 
        flexDirection: "row", 
        justifyContent: "space-between", 
    },
    btnReject: { 
        flex: 1, 
        flexDirection: "row", 
        justifyContent: "center", 
        alignItems: "center", 
        paddingVertical: 12, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: COLORS.red, 
        backgroundColor: "#FFF",
        marginRight: 5,
    },
    btnRejectText: { 
        color: COLORS.red, 
        fontWeight: "bold", 
        fontSize: 14,
    },
    btnApprove: { 
        flex: 1.5, 
        flexDirection: "row", 
        justifyContent: "center", 
        alignItems: "center", 
        paddingVertical: 12, 
        borderRadius: 8, 
        backgroundColor: COLORS.green,
        marginLeft: 5,
    },
    btnApproveText: { 
        color: "#FFF", 
        fontWeight: "bold", 
        fontSize: 14,
    },

    /* --- 🟢 6. CSS สำหรับ Modal พิมพ์เหตุผล --- */
    rejectModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    rejectModalBox: {
        width: "100%",
        backgroundColor: "#FFF",
        borderRadius: 15,
        padding: 20,
        elevation: 5,
    },
    rejectTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.red,
        marginBottom: 5,
    },
    rejectSubTitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 15,
    },
    rejectInput: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: "top", // ให้ตัวอักษรเริ่มจากด้านบนสุดสำหรับ Android
        fontSize: 14,
        backgroundColor: "#F9F9F9",
        marginBottom: 20,
    },
    rejectActionRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    btnCancelModal: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    btnCancelModalText: {
        color: "#666",
        fontWeight: "bold",
        fontSize: 14,
    },
    btnConfirmModal: {
        backgroundColor: COLORS.red,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    btnConfirmModalText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
    },

    /* --- Modal (Full Screen Image) Styles --- */
    modalImageOverlay: { 
        flex: 1, 
        backgroundColor: "rgba(0,0,0,0.9)", 
        justifyContent: "center", 
        alignItems: "center",
    },
    closeImageBtn: { 
        position: "absolute", 
        top: 50, 
        right: 20, 
        zIndex: 10, 
        padding: 10, 
        backgroundColor: "rgba(255,255,255,0.2)", 
        borderRadius: 20,
    },
    fullScreenImageWrap: {
        width: "100%", 
        height: "80%",
    },
    fullScreenImage: { 
        width: "100%", 
        height: "100%",
    }
});