//prison-visit-app/app/admin/adminbookings.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const COLORS = {
  primary: "#722F37",
  bg: "#F5F5F5",
  card: "#FFFFFF",
  text: "#000",
  greenDot: "#00C853",
};

export default function AdminBookingsDashboard() {
  const router = useRouter();

  const InfoItem = ({ text }) => (
    <View style={styles.infoRow}>
      <View style={styles.dot} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>จัดการการจองคิวเยี่ยม</Text>
          <Text style={styles.headerSubtitle}>
            แสดงข้อมูลของคิวเยี่ยมและการอนุมัติคิวเยี่ยมของญาติ
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>รายละเอียดการจัดการจองคิวเยี่ยม</Text>
          <View style={styles.divider} />

          <InfoItem text="หากมีผู้ใช้งานทำการจองคิวเข้าเยี่ยมผู้ต้องขังระบบแจ้งเตือนเพื่อให้ท่านตรวจสอบว่าคิวนั้นผ่านการอนุมัติหรือไม่" />
          {/* 🟢 อัปเดตคำอธิบายให้เข้ากับการมีปุ่มเดียว */}
          <InfoItem text="ปุ่มด้านล่างคือปุ่มที่กดแล้วจะนำไปยังหน้าสำหรับการจัดการข้อมูลและอนุมัติคิวจองเยี่ยมผู้ต้องขัง" />

          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>สำนักงาน</Text>
            <Text style={styles.addressText}>
              เรือนจำอำเภอตะกั่วป่า ถนนราษฎร์บำรุง ตำบลบางนายสี อำเภอตะกั่วป่า จังหวัดพังงา
            </Text>
          </View>
        </View>

        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.cardTitle}>โปรดเลือกขั้นตอนเพื่อดำเนินการต่อ</Text>
          <View style={styles.divider} />
          
          {/* 🟢 เปลี่ยนเป็นปุ่มเดียวแบบเต็มความกว้าง */}
          <View style={styles.menuRow}>
            <TouchableOpacity
              style={styles.singleMenuButton}
              onPress={() => router.push('/admin/manage-booking')}
            >
              <MaterialCommunityIcons name="calendar-edit" size={60} color="#333" />
              <Text style={styles.menuText}>
                จัดการข้อมูลคิว
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 16,
    bottom: 25,
    padding: 4,
    zIndex: 10,
  },
  headerCenter: {
    alignItems: "center",
    maxWidth: '80%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#E0E0E0",
    marginTop: 4,
    textAlign: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.greenDot,
    marginTop: 5,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
  },
  addressBox: {
    marginTop: 20,
    paddingTop: 10,
  },
  addressLabel: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "center", // จัดให้อยู่ตรงกลาง
    marginTop: 10,
  },
  // 🟢 สไตล์สำหรับปุ่มเดียว
  singleMenuButton: {
    width: "100%", // ให้กว้างเต็มกล่อง
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingVertical: 35,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  menuText: {
    marginTop: 15,
    fontSize: 18, // ปรับให้ใหญ่ขึ้นนิดนึง
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },
});