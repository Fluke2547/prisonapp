// prison-visit-app/app/admin/settings.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants'; // 👈 ใช้ดึงเวอร์ชันแอปจริง

export default function AdminSettingsScreen() {
    const router = useRouter();
    
    const [pushEnabled, setPushEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    
    // 🟢 ดึงเวอร์ชันแอปจาก app.json
    const appVersion = Constants.expoConfig?.version || "1.0.0";

    // 🟢 โหลดค่าที่เคยตั้งไว้ตอนเปิดหน้าจอ
    useEffect(() => {
        const loadSettings = async () => {
            const savedPush = await AsyncStorage.getItem('setting_push');
            const savedDark = await AsyncStorage.getItem('setting_dark');
            if (savedPush !== null) setPushEnabled(JSON.parse(savedPush));
            if (savedDark !== null) setDarkModeEnabled(JSON.parse(savedDark));
        };
        loadSettings();
    }, []);

    // 🟢 ฟังก์ชันบันทึกค่าเมื่อกดสวิตช์
    const togglePush = async (value) => {
        setPushEnabled(value);
        await AsyncStorage.setItem('setting_push', JSON.stringify(value));
    };

    const toggleDark = async (value) => {
        setDarkModeEnabled(value);
        await AsyncStorage.setItem('setting_dark', JSON.stringify(value));
    };

    const SettingItem = ({ title, subtitle, onPress, rightElement, showDivider = true }) => (
        <View>
            <TouchableOpacity 
                style={s.settingRow} 
                onPress={onPress} 
                disabled={!onPress} 
                activeOpacity={0.7}
            >
                <View style={s.rowLeft}>
                    <Text style={s.itemTitle}>{title}</Text>
                    {subtitle && <Text style={s.itemSubtitle}>{subtitle}</Text>}
                </View>
                <View style={s.rowRight}>
                    {rightElement ? rightElement : <Ionicons name="chevron-forward" size={20} color="#999" />}
                </View>
            </TouchableOpacity>
            {showDivider && <View style={s.divider} />}
        </View>
    );

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor="#722F37" />
            
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>การตั้งค่า</Text>
                    <Text style={s.headerSubTitle}>จัดการการตั้งค่าบัญชีของคุณ</Text>
                </View>
                <View style={{ width: 40 }} /> 
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
                
                <Text style={s.sectionTitle}>การตั้งค่าบัญชีผู้ใช้</Text>
                <View style={s.card}>
                    {/* 🟢 กดแล้ววิ่งไปหน้า Profile */}
                    <SettingItem 
                        title="ข้อมูลส่วนตัว" 
                        subtitle="ดู/แก้ไขชื่อและข้อมูลติดต่อของคุณ" 
                        onPress={() => router.push("/admin/profile")} 
                        showDivider={false}
                    />
                </View>

                <Text style={s.sectionTitle}>การตั้งค่าการแจ้งเตือน</Text>
                <View style={s.card}>
                    <SettingItem 
                        title="Push Notification" 
                        subtitle="(เปิด/ปิด การแจ้งเตือนในแอป)" 
                        rightElement={
                            <Switch 
                                trackColor={{ false: "#D1D1D6", true: "#722F37" }}
                                thumbColor={"#FFF"}
                                onValueChange={togglePush}
                                value={pushEnabled}
                            />
                        }
                    />
                </View>

                <Text style={s.sectionTitle}>การตั้งค่าการแสดงผล</Text>
                <View style={s.card}>
                    <SettingItem 
                        title="โหมดมืด (Dark Mode)" 
                        subtitle="สลับโหมดการแสดงผลของแอป" 
                        showDivider={false}
                        rightElement={
                            <Switch 
                                trackColor={{ false: "#D1D1D6", true: "#722F37" }}
                                thumbColor={"#FFF"}
                                onValueChange={toggleDark}
                                value={darkModeEnabled}
                            />
                        }
                    />
                </View>

                <Text style={s.sectionTitle}>การตั้งค่าอื่นๆ</Text>
                <View style={s.card}>
                    {/* 🟢 กดแล้ววิ่งไปหน้า FAQ */}
                    <SettingItem 
                        title="คำถามที่พบบ่อย (FAQ)" 
                        subtitle="เข้าถึงคู่มือการใช้งาน" 
                        onPress={() => router.push("/admin/faq")}
                    />
                    <SettingItem 
                        title="เวอร์ชันแอป" 
                        subtitle={`v.${appVersion}`} // 🟢 โชว์เวอร์ชันจริง
                        showDivider={false}
                        rightElement={<Text style={{ color: '#999', fontSize: 14 }}>ล่าสุด</Text>}
                    />
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    // --- โครงสร้างหลัก (Layout) ---
    container: {
        flex: 1,
        backgroundColor: "#F9F9F9",
    },

    // --- Header Section ---
    header: {
        backgroundColor: "#722F37",
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    backBtn: {
        padding: 5,
        width: 40,
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
    },
    headerTitle: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },
    headerSubTitle: {
        color: "#E0E0E0",
        fontSize: 12,
        marginTop: 4,
    },

    // --- Content & Section ---
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#722F37",
        marginTop: 15,
        marginBottom: 10,
        marginLeft: 4,
    },

    // --- Setting Card & Rows ---
    card: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#EEEEEE",
        elevation: 1,
    },
    settingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: "#FFF",
    },
    rowLeft: {
        flex: 1,
        paddingRight: 15,
    },
    itemTitle: {
        fontSize: 15,
        color: "#000",
        fontWeight: "bold",
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 12,
        color: "#777",
    },
    rowRight: {
        justifyContent: "center",
        alignItems: "flex-end",
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginHorizontal: 16,
    },
});