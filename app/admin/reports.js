import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAdminDashboardSummary, exportDashboardReport } from "../../service/admin.service";

const C = {
  primary: "#722F37",
  bg: "#F5F5F5",
  white: "#FFF",
  text: "#333",
  subText: "#666",
  border: "#DDD",
  blue: "#4285F4",
  green: "#00C853",
  red: "#E53935",
  orange: "#FF9800"
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AdminReportsScreen() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false); // 🟢 State สำหรับตอนกำลังโหลด PDF

  const [statsData, setStatsData] = useState({
    total: 0, completed: 0, missed: 0, pending: 0, label: "กำลังโหลดข้อมูล..."
  });

  const [queueList, setQueueList] = useState([]);
  const [currentRange, setCurrentRange] = useState({ start: '', end: '' }); // 🟢 เก็บช่วงวันที่ไว้ใช้ตอนออกรายงาน

  useEffect(() => {
    fetchReports(timeFilter);
  }, [timeFilter]);

  const formatDateThai = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear() + 543;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const fetchReports = async (range) => {
    setLoading(true);
    try {
      const today = getTodayString();
      const res = await getAdminDashboardSummary(today, range);

      const summary = res.summary || {};
      const dateRange = res.dateRange || {};

      setCurrentRange({ start: dateRange.start, end: dateRange.end }); // 🟢 เก็บวันที่

      let dateLabel = "กำลังโหลด...";
      if (dateRange.start && dateRange.end) {
        dateLabel = dateRange.start === dateRange.end
          ? `ประจำวันที่ ${formatDateThai(dateRange.start)}`
          : `ตั้งแต่ ${formatDateThai(dateRange.start)} ถึง ${formatDateThai(dateRange.end)}`;
      }

      setStatsData({
        total: summary.totalBookings || 0,
        completed: summary.completedVisits || 0,
        missed: (summary.cancelledVisits || 0) + (summary.rejectedVisits || 0),
        pending: summary.pendingVisits || 0,
        label: dateLabel
      });
      setQueueList(res.queueList || []);
    } catch (error) {
      console.warn("Fetch Report Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 ฟังก์ชันหลักในการออกรายงาน PDF บนมือถือ (ใช้ Service เหมือน Web)
  const handleExportPDF = async () => {
    if (!currentRange.start || !currentRange.end) {
      Alert.alert("แจ้งเตือน", "ไม่พบข้อมูลวันที่สำหรับออกรายงานขอรับ");
      return;
    }

    setExporting(true);
    try {
      const filename = `Report_${currentRange.start}_to_${currentRange.end}.pdf`;
      const fileUri = FileSystem.cacheDirectory + filename;

      console.log("กำลังโหลด PDF ผ่าน Service...");

      const blobData = await exportDashboardReport(currentRange.start, currentRange.end);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];

        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'บันทึกหรือแชร์รายงาน PDF'
          });
        } else {
          Alert.alert("สำเร็จ", "ดาวน์โหลดไฟล์เรียบร้อยแล้วที่: " + fileUri);
        }
      };
      reader.onerror = () => {
        throw new Error("เกิดข้อผิดพลาดในการอ่านข้อมูลไฟล์ขอรับ");
      };

      reader.readAsDataURL(blobData);

    } catch (error) {
      console.error("Export Error Detail:", error);
      Alert.alert("ผิดพลาด", error.message || "ไม่สามารถออกรายงานได้ในขณะนี้");
    } finally {
      setExporting(false);
    }
  };

  const FilterTab = ({ id, label }) => {
    const isActive = timeFilter === id;
    return (
      <TouchableOpacity
        style={[s.tab, isActive && s.tabActive]}
        onPress={() => setTimeFilter(id)}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Text style={[s.tabText, isActive && s.tabTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={s.statCard}>
      <View style={[s.iconBox, { backgroundColor: color + '1A' }]}>
        <MaterialCommunityIcons name={icon} size={32} color={color} />
      </View>
      <View style={s.statInfo}>
        <Text style={s.statValue}>{value}</Text>
        <Text style={s.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const total = statsData.total > 0 ? statsData.total : 1;
  const successPct = Math.round((statsData.completed / total) * 100);
  const failPct = Math.round((statsData.missed / total) * 100);

  const renderStatusBadge = (status) => {
    let bgColor = "#FFF3E0"; let textColor = C.orange; let text = "รอดำเนินการ";
    if (status === "APPROVED" || status === "COMPLETED") {
      bgColor = "#E8F5E9"; textColor = C.green; text = "สำเร็จ/พร้อมเยี่ยม";
    } else if (status === "REJECTED" || status === "CANCELLED") {
      bgColor = "#FFEBEE"; textColor = C.red; text = "ยกเลิก/ปฏิเสธ";
    }
    return (
      <View style={[s.statusBadge, { backgroundColor: bgColor }]}>
        <Text style={{ color: textColor, fontSize: 11, fontWeight: 'bold' }}>{text}</Text>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtnPad}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>รายงานและสถิติ</Text>
          <Text style={s.headerSub}>สำหรับผู้บังคับบัญชา</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <View style={s.tabContainer}>
        <FilterTab id="daily" label="รายวัน" />
        <FilterTab id="weekly" label="รายสัปดาห์" />
        <FilterTab id="monthly" label="รายเดือน" />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.periodBox}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="calendar" size={20} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={s.periodText}>{statsData.label}</Text>
          </View>

          {/* 🟢 ปุ่มออกรายงาน PDF บนมือถือ */}
          <TouchableOpacity
            style={s.exportBtn}
            onPress={handleExportPDF}
            disabled={exporting || loading}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="document-text" size={18} color="#FFF" />
                <Text style={s.exportBtnText}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ padding: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ marginTop: 10, color: C.subText }}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : (
          <>
            <View style={s.statsGrid}>
              <StatCard title="จำนวนคิวทั้งหมด" value={statsData.total} icon="clipboard-text-multiple-outline" color={C.blue} />
              <StatCard title="เยี่ยมสำเร็จ" value={statsData.completed} icon="check-decagram-outline" color={C.green} />
              <StatCard title="ยกเลิก / ไม่สำเร็จ" value={statsData.missed} icon="close-octagon-outline" color={C.red} />
              <StatCard title="รอดำเนินการ" value={statsData.pending} icon="clock-time-three-outline" color={C.orange} />
            </View>

            <View style={s.chartCard}>
              <Text style={s.chartTitle}>การเข้าเยี่ยมที่สำเร็จ</Text>
              {statsData.total === 0 ? (
                <Text style={{ textAlign: 'center', color: '#999', marginVertical: 10 }}>ไม่มีข้อมูลสำหรับแสดงผล</Text>
              ) : (
                <>
                  <View style={s.barContainer}>
                    <View style={[s.barFill, { backgroundColor: C.green, width: `${successPct}%` }]} />
                    <View style={[s.barFill, { backgroundColor: C.red, width: `${failPct}%` }]} />
                  </View>
                  <View style={s.legendRow}>
                    <View style={s.legendItem}>
                      <View style={[s.dot, { backgroundColor: C.green }]} />
                      <Text style={s.legendText}>สำเร็จ ({successPct}%)</Text>
                    </View>
                    <View style={s.legendItem}>
                      <View style={[s.dot, { backgroundColor: C.red }]} />
                      <Text style={s.legendText}>ยกเลิก ({failPct}%)</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            <Text style={s.listHeaderTitle}>รายละเอียดการจองคิว ({queueList.length})</Text>
            {queueList.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#999', marginTop: 10 }}>ไม่พบรายการจองในรอบนี้</Text>
            ) : (
              queueList.map((item, index) => (
                <View key={item.booking_id || index} style={s.queueCard}>
                  <View style={s.queueTimeBox}>
                    <Text style={s.queueDate}>{formatDateThai(item.visit_date)}</Text>
                    <Text style={s.queueTime}>{item.starts_at?.slice(0, 5)}</Text>
                    <Text style={s.queueTimeTo}>ถึง {item.ends_at?.slice(0, 5)}</Text>
                  </View>
                  <View style={s.queueDetailBox}>
                    <Text style={s.queueInmate} numberOfLines={1}>นักโทษ: {item.inmate_name}</Text>
                    <Text style={s.queueVisitor} numberOfLines={1}>ญาติ: {item.visitor_name}</Text>
                    <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                      {renderStatusBadge(item.status)}
                    </View>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    padding: 16,
  },

  // --- Header Section ---
  header: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingTop: 50,
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
    color: "#FFD5D5",
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

  // --- Tab Navigation ---
  tabContainer: {
    flexDirection: "row",
    backgroundColor: C.white,
    padding: 10,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: C.primary + "1A",
  },
  tabText: {
    fontSize: 14,
    color: C.subText,
    fontWeight: "bold",
  },
  tabTextActive: {
    color: C.primary,
    fontWeight: "bold",
  },

  // --- Period & Export Section ---
  periodBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "bold",
    color: C.text,
    flexShrink: 1,
  },
  exportBtn: {
    backgroundColor: C.red,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  exportBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },

  // --- Statistics Grid ---
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  statInfo: {
    alignItems: "flex-start",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: C.text,
  },
  statTitle: {
    fontSize: 11,
    color: C.subText,
    fontWeight: "bold",
    marginTop: 2,
  },

  // --- Chart Section ---
  chartCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    marginBottom: 25,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: C.text,
    marginBottom: 15,
    textAlign: "center",
  },
  barContainer: {
    height: 18,
    flexDirection: "row",
    backgroundColor: "#EEE",
    borderRadius: 9,
    overflow: "hidden",
    marginBottom: 15,
  },
  barFill: {
    height: "100%",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: C.subText,
    fontWeight: "bold",
  },

  // --- Queue List Section ---
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: C.text,
    marginBottom: 15,
  },
  queueCard: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 1,
  },
  queueTimeBox: {
    borderRightWidth: 1,
    borderColor: "#EEE",
    paddingRight: 15,
    alignItems: "center",
    width: 90,
  },
  queueDate: {
    fontSize: 9,
    color: "#888",
    marginBottom: 2,
  },
  queueTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: C.primary,
  },
  queueTimeTo: {
    fontSize: 10,
    color: "#888",
  },
  queueDetailBox: {
    flex: 1,
    paddingLeft: 15,
  },
  queueInmate: {
    fontSize: 14,
    fontWeight: "bold",
    color: C.text,
  },
  queueVisitor: {
    fontSize: 12,
    color: C.subText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
});