// prison-visit-app/app/visitor/settings.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants'; // 👈 ใช้ดึงเวอร์ชันแอปจริง

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();


  const [pushEnabled, setPushEnabled] = useState(true);
  
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  useEffect(() => {
      const loadSettings = async () => {
          const savedPush = await AsyncStorage.getItem('visitor_push_noti');
          if (savedPush !== null) setPushEnabled(JSON.parse(savedPush));
      };
      loadSettings();
  }, []);

  const togglePush = async (value) => {
      setPushEnabled(value);
      await AsyncStorage.setItem('visitor_push_noti', JSON.stringify(value));
  };

  const handlePressComingSoon = (menuName) => {
      Alert.alert("กำลังพัฒนา", `ระบบ "${menuName}" จะเปิดให้ใช้งานเร็วๆ นี้ครับ`);
  };

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBg} />

      <View style={[s.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity style={s.backButton} onPress={() => router.replace("/visitor")}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: theme.headerText }]}>การตั้งค่า</Text>
          <Text style={[s.headerSub, { color: "#F3E8EA" }]}>จัดการการตั้งค่าบัญชีของคุณ</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.sectionHeader, { color: theme.sectionHeader }]}>การตั้งค่าบัญชีผู้ใช้</Text>
        <View style={[s.card, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={s.row} onPress={() => router.push("/visitor/profile")}>
            <View>
              <Text style={[s.rowTitle, { color: theme.text }]}>ข้อมูลส่วนตัว</Text>
              <Text style={[s.rowSub, { color: theme.subtext }]}>ดู/แก้ไขชื่อและข้อมูลติดต่อของคุณ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
          </TouchableOpacity>
        </View>

        <Text style={[s.sectionHeader, { color: theme.sectionHeader }]}>การตั้งค่าการแจ้งเตือน</Text>
        <View style={[s.card, { backgroundColor: theme.card }]}>
          
          <View style={s.row}>
            <View>
              <Text style={[s.rowTitle, { color: theme.text }]}>Push Notification</Text>
              <Text style={[s.rowSub, { color: theme.subtext }]}>(เปิด/ปิด การแจ้งเตือนในแอป)</Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: "#FFB6C1" }}
              thumbColor={pushEnabled ? "#722F37" : "#f4f3f4"}
              onValueChange={togglePush}
              value={pushEnabled}
            />
          </View>

          <View style={[s.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={s.row} onPress={() => handlePressComingSoon("ประเภทการแจ้งเตือน")}>
            <View>
              <Text style={[s.rowTitle, { color: theme.text }]}>ประเภทการแจ้งเตือน</Text>
              <Text style={[s.rowSub, { color: theme.subtext }]}>เลือกว่าจะรับการแจ้งเตือนเรื่องใดบ้าง</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
          </TouchableOpacity>
        </View>

        <Text style={[s.sectionHeader, { color: theme.sectionHeader }]}>การตั้งค่าการแสดงผล</Text>
        <View style={[s.card, { backgroundColor: theme.card }]}>
          <View style={s.row}>
            <View>
              <Text style={[s.rowTitle, { color: theme.text }]}>โหมดมืด (Dark Mode)</Text>
              <Text style={[s.rowSub, { color: theme.subtext }]}>สลับโหมดการแสดงผลของแอป</Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: "#FFB6C1" }}
              thumbColor={isDark ? "#722F37" : "#f4f3f4"}
              onValueChange={toggleTheme}
              value={isDark}
            />
          </View>
        </View>

        <Text style={[s.sectionHeader, { color: theme.sectionHeader }]}>การตั้งค่าอื่นๆ</Text>
        <View style={[s.card, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={s.row} onPress={() => router.push("/visitor/help")}>
            <View>
              <Text style={[s.rowTitle, { color: theme.text }]}>คำถามที่พบบ่อย (FAQ)</Text>
              <Text style={[s.rowSub, { color: theme.subtext }]}>เข้าถึงคู่มือการใช้งาน</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
          </TouchableOpacity>

          <View style={[s.divider, { backgroundColor: theme.border }]} />

          <View style={s.row}>
            <View>
              <Text style={[s.rowTitle, { color: theme.text }]}>เวอร์ชันแอป</Text>
              <Text style={[s.rowSub, { color: theme.subtext }]}>v.{appVersion}</Text>
            </View>
            <Text style={{ color: theme.subtext, fontSize: 13, fontWeight: "bold" }}>ล่าสุด</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[s.bottom, { backgroundColor: theme.bottomBar }]}>
        {/* Home */}
        <TouchableOpacity style={s.navItem} onPress={() => router.replace("/visitor")} activeOpacity={0.8}>
          <Ionicons name="home" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Settings (ACTIVE) */}
        <TouchableOpacity style={s.navItem} onPress={() => router.replace("/visitor/settings")}>
          <View style={s.activeBg}>
            <Ionicons name="settings-outline" size={26} color={theme.accent} />
          </View>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity style={s.navItem} onPress={() => router.replace("/visitor/profile")}>
          <Ionicons name="person-outline" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Help */}
        <TouchableOpacity style={s.navItem} onPress={() => router.replace("/visitor/help")}>
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  backButton: {
    position: "absolute",
    left: 16,
    bottom: 12,
    padding: 4
  },
  headerCenter: {
    alignItems: "center"
  },
  headerTitle: {
    fontWeight: "800",
    fontSize: 18
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600"
  },
  rowSub: {
    fontSize: 12,
    marginTop: 4
  },
  divider: {
    height: 1,
    marginVertical: 4
  },
  bottom: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingBottom: 30,
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  navItem: {
    flex: 1,
    padding: 8,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  activeBg: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
    elevation: 3,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center"
  },
});