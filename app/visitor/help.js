//prison-visit-app/app/visitor/help.js
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useTheme";

export default function HelpScreen() {
  const router = useRouter();

  // ดึงค่า theme และ isDark มาใช้
  const { theme, isDark } = useTheme();

  return (
    // 1. กำหนดสีพื้นหลังให้ Container หลัก
    <View style={[s.container, { backgroundColor: theme.bg }]}>

      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity style={s.backButton} onPress={() => router.replace("/visitor")}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: theme.headerText }]}>ศูนย์ช่วยเหลือ</Text>
          <Text style={s.headerSub}>คู่มือการใช้งานและข้อมูลการเยี่ยม</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={s.body}>
        {/* หัวข้อที่ 1 */}
        <Text style={[s.sectionTitle, { color: theme.sectionHeader }]}>ขั้นตอนการจองคิวเยี่ยม</Text>
        <Text style={[s.sectionText, { color: theme.text }]}>
          1. เข้าสู่ระบบด้วยเลขบัตรประชาชนและรหัสผ่าน{"\n"}
          2. ไปที่เมนู "จองคิวเยี่ยม"{"\n"}
          3. เลือกวันเวลา และยืนยันการจอง{"\n"}
          4. แสดง หรือข้อมูลการจองในวันเยี่ยม
        </Text>

        {/* หัวข้อที่ 2 */}
        <Text style={[s.sectionTitle, { color: theme.sectionHeader }]}>กฎระเบียบและข้อปฏิบัติในการเยี่ยม</Text>
        <Text style={[s.sectionText, { color: theme.text }]}>
          1. นำบัตรประจำตัวประชาชนหรือบัตรที่ออก โดยทางราชการ{"\n"}
          2. ผู้ที่เข้าเยี่ยมผู้ต้องขังต้องไม่แสดงกิริยา หรือใช้อาณัติสัญญาใด ๆ แก่ผู้ต้องขัง เพื่อกระทำผิดกฎหมายหรือวินัยผู้ต้องขัง{"\n"}
          3. ผู้มีอาการมึนเมาหรือเมาสุราไม่อนุญาตให้ เข้าเยี่ยมผู้ต้องขัง{"\n"}
          4. การแต่งกายชุดสุภาพ งดเสื้อผ้ารัดรูปหรือโป๊เปลือย{"\n"}
        </Text>

        {/* หัวข้อที่ 3 */}
        <Text style={[s.sectionTitle, { color: theme.sectionHeader }]}>ติดต่อเจ้าหน้าที่</Text>
        <Text style={[s.sectionText, { color: theme.text }]}>
          หมายเลขโทรศัพท์เรือนจำ 076 421 100 {"\n"}
          เวลา: 08.30 - 16.30 น. (จันทร์ - ศุกร์)
        </Text>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[s.bottom, { backgroundColor: theme.bottomBar }]}>
        {/* Home */}
        <TouchableOpacity
          style={s.navItem}
          onPress={() => router.replace("/visitor") /* เปลี่ยนเป็นหน้า Home ของ Visitor */}
        >
          <Ionicons name="home" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          style={s.navItem}
          onPress={() => router.replace("/visitor/settings")}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={s.navItem}
          onPress={() => router.replace("/visitor/profile")}
        >
          <Ionicons name="person-outline" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Help (Active) */}
        <TouchableOpacity
          style={s.navItem}
          onPress={() => router.replace("/visitor/help")}
        >
          <View style={s.activeBg}>
            <Ionicons name="help-circle-outline" size={26} color={theme.accent} />
          </View>
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
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 16,
    bottom: 12,
    padding: 4,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontWeight: "800", fontSize: 18 },
  headerSub: { color: "#F3E8EA", fontSize: 12, marginTop: 2 },

  body: {
    padding: 20,
    paddingBottom: 100, // เผื่อที่ให้ Bottom Nav ไม่บังเนื้อหา
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 16,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
  },

  // Bottom Nav Styles
  bottom: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingBottom: 30,
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute', // ให้เมนูอยู่ล่างสุดเสมอ
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    padding: 8,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBg: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
});