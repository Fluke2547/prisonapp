// prison-visit-app/app/visitor/claim-relationship.js
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { submitClaimRequest } from "../../service/claim.service";

const C = { primary: "#722F37", bg: "#F5F5F5", text: "#333", border: "#DDD", white: "#FFF" };

export default function ClaimRelationshipScreen() {
    const router = useRouter();
    
    // 🟢 เปลี่ยนจาก inmateId เป็น firstname และ lastname
    const [firstname, setFirstname] = useState(""); 
    const [lastname, setLastname] = useState(""); 
    
    const [relation, setRelation] = useState(""); 
    const [idCardImage, setIdCardImage] = useState(null);
    const [selfieImage, setSelfieImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pickImage = async (setImage) => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("แจ้งเตือน", "แอปต้องการสิทธิ์ในการเข้าถึงรูปภาพของคุณ");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        // 🟢 เช็คว่ากรอก ชื่อ นามสกุล ครบไหม
        if (!firstname.trim() || !lastname.trim() || !relation.trim() || !idCardImage || !selfieImage) {
            return Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลและอัปโหลดรูปภาพเอกสารให้ครบถ้วน");
        }

        try {
            setIsSubmitting(true);

            // 🟢 ส่ง firstname และ lastname ไปให้ Service (แทน id)
            await submitClaimRequest(firstname.trim(), lastname.trim(), relation.trim(), idCardImage, selfieImage);

            Alert.alert("สำเร็จ", "ส่งคำขอผูกความสัมพันธ์เรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ", [
                {
                    text: "ตกลง",
                    onPress: () => router.replace("/visitor/claim-pending"),
                },
            ]);
        } catch (error) {
            console.error("Submit Claim Error:", error.response?.data || error.message);
            Alert.alert("ผิดพลาด", error.response?.data?.message || "ไม่สามารถส่งคำขอได้ กรุณาลองใหม่");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace("/");
    };

    return (
        <SafeAreaView style={s.container}>
            <ScrollView contentContainerStyle={s.content}>
                <View style={s.iconHeader}>
                    <MaterialCommunityIcons name="account-search" size={80} color={C.primary} />
                </View>
                <Text style={s.title}>กรุณายืนยันตัวตนและระบุผู้ต้องขัง</Text>
                <Text style={s.subTitle}>เพื่อสิทธิในการจองคิวเยี่ยม ท่านต้องระบุชื่อผู้ต้องขังและยืนยันตัวตนก่อน</Text>

                <View style={s.formCard}>
                    
                    {/* 🟢 ช่องกรอกชื่อผู้ต้องขัง */}
                    <Text style={s.label}>ชื่อจริงผู้ต้องขัง</Text>
                    <TextInput
                        style={s.input}
                        placeholder="เช่น สมชาย"
                        value={firstname}
                        onChangeText={setFirstname}
                        editable={!isSubmitting}
                    />

                    {/* 🟢 ช่องกรอกนามสกุลผู้ต้องขัง */}
                    <Text style={s.label}>นามสกุลผู้ต้องขัง</Text>
                    <TextInput
                        style={s.input}
                        placeholder="เช่น ใจดี"
                        value={lastname}
                        onChangeText={setLastname}
                        editable={!isSubmitting}
                    />

                    <Text style={s.label}>ความสัมพันธ์กับผู้ต้องขัง</Text>
                    <TextInput
                        style={s.input}
                        placeholder="เช่น บิดา, มารดา, บุตร, ภรรยา"
                        value={relation}
                        onChangeText={setRelation}
                        editable={!isSubmitting}
                    />

                    <View style={s.uploadSection}>
                        <Text style={s.sectionTitle}>เอกสารยืนยันตัวตน</Text>

                        {/* อัปโหลดบัตรประชาชน */}
                        <Text style={s.label}>1. รูปถ่ายหน้าบัตรประชาชน</Text>
                        {idCardImage ? (
                            <View style={s.imagePreviewContainer}>
                                <Image source={{ uri: idCardImage }} style={s.imagePreview} />
                                {!isSubmitting && (
                                    <TouchableOpacity style={s.removeImageBtn} onPress={() => setIdCardImage(null)}>
                                        <MaterialCommunityIcons name="close" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <TouchableOpacity style={s.uploadBox} onPress={() => pickImage(setIdCardImage)} disabled={isSubmitting}>
                                <MaterialCommunityIcons name="card-account-details-outline" size={40} color={C.primary} style={s.uploadIcon} />
                                <Text style={s.uploadText}>แตะเพื่ออัปโหลดรูปภาพ</Text>
                                <Text style={s.uploadSubText}>ถ่ายให้เห็นข้อมูลบนบัตรชัดเจน</Text>
                            </TouchableOpacity>
                        )}

                        {/* อัปโหลดเซลฟี่ */}
                        <Text style={s.label}>2. รูปถ่ายเซลฟี่คู่กับบัตรประชาชน</Text>
                        {selfieImage ? (
                            <View style={s.imagePreviewContainer}>
                                <Image source={{ uri: selfieImage }} style={s.imagePreview} />
                                {!isSubmitting && (
                                    <TouchableOpacity style={s.removeImageBtn} onPress={() => setSelfieImage(null)}>
                                        <MaterialCommunityIcons name="close" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <TouchableOpacity style={s.uploadBox} onPress={() => pickImage(setSelfieImage)} disabled={isSubmitting}>
                                <MaterialCommunityIcons name="camera-front-variant" size={40} color={C.primary} style={s.uploadIcon} />
                                <Text style={s.uploadText}>แตะเพื่ออัปโหลดรูปภาพ</Text>
                                <Text style={s.uploadSubText}>เห็นใบหน้าและบัตรประชาชนชัดเจน</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[s.submitBtn, isSubmitting && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={C.white} size="small" />
                        ) : (
                            <Text style={s.submitBtnText}>ส่งคำขอตรวจสอบ</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} disabled={isSubmitting}>
                    <Text style={s.logoutBtnText}>ออกจากระบบ</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { padding: 24, alignItems: "center", paddingTop: 40 },
    iconHeader: { marginBottom: 20 },
    title: { fontSize: 20, fontWeight: "bold", color: C.text, textAlign: "center", marginBottom: 10 },
    subTitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 30, paddingHorizontal: 10 },
    sectionTitle: { fontSize: 16, fontWeight: "bold", color: C.primary, marginBottom: 15, marginTop: 5, textAlign: "center" },
    formCard: { width: "100%", backgroundColor: C.white, borderRadius: 16, padding: 20, elevation: 3, marginBottom: 30 },
    label: { fontSize: 14, fontWeight: "bold", color: C.text, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 15, height: 48, marginBottom: 10, backgroundColor: "#FAFAFA" },
    uploadSection: { marginTop: 10, marginBottom: 10 },
    uploadBox: { borderWidth: 1.5, borderColor: C.primary, borderStyle: "dashed", borderRadius: 12, backgroundColor: "#F9F9F9", padding: 20, alignItems: "center", justifyContent: "center", height: 140, marginBottom: 20 },
    uploadIcon: { marginBottom: 10 },
    uploadText: { fontSize: 14, fontWeight: "bold", color: C.primary, textAlign: "center" },
    uploadSubText: { fontSize: 12, color: "#888", textAlign: "center", marginTop: 4 },
    imagePreviewContainer: { width: "100%", height: 140, borderRadius: 12, overflow: "hidden", marginBottom: 20, borderWidth: 1, borderColor: "#EEE", position: "relative" },
    imagePreview: { width: "100%", height: "100%", resizeMode: "cover" },
    removeImageBtn: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.6)", width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", elevation: 3 },
    submitBtn: { backgroundColor: C.primary, paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 5 },
    submitBtnText: { color: C.white, fontWeight: "bold", fontSize: 16 },
    logoutBtn: { padding: 15, marginBottom: 30 },
    logoutBtnText: { color: "#999", fontWeight: "bold", fontSize: 14, textDecorationLine: "underline" },
});