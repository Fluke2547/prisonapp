// prison-visit-app/app/Commander/dashboard.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
// 🟢 ใช้ legacy ตามที่ Expo SDK 54 แนะนำเพื่อให้ Warning หายไป
import * as FileSystem from 'expo-file-system/legacy'; 
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAdminDashboardSummary, exportDashboardReport, getAdminInmates } from "../../service/admin.service";

const COLORS = {
  primary: "#722F37",
  darkRed: "#5D242B",
  bg: "#F5F5F5",
  white: "#FFF",
  text: "#333",
  subText: "#666",
  border: "#DDD",
  blue: "#4285F4",
  green: "#00C853",
  red: "#E53935",
  orange: "#FF9800",
  male: "#0D6EFD",   
  female: "#D63384"  
};

const getThaiTodayString = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const thaiDate = new Date(utc + 25200000);
    const year = thaiDate.getFullYear();
    const month = String(thaiDate.getMonth() + 1).padStart(2, '0');
    const day = String(thaiDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function CommanderDashboard() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false); 
  const [commanderName, setCommanderName] = useState("ผู้บัญชาการ");

  // ข้อมูลสถิติและรายชื่อ
  const [statsData, setStatsData] = useState({ total: 0, completed: 0, missed: 0, pending: 0, label: "กำลังโหลด..." });
  const [totalInmateStats, setTotalInmateStats] = useState({ total: 0, male: 0, female: 0, malePct: 0, femalePct: 0 });
  const [allInmateList, setAllInmateList] = useState([]); // 🟢 เก็บรายชื่อนักโทษทั้งหมด
  const [platformStats, setPlatformStats] = useState({ zoom: 0, line: 0, webrtc: 0, zoomPct: 0, linePct: 0, webrtcPct: 0 });
  const [queueList, setQueueList] = useState([]);
  const [currentRange, setCurrentRange] = useState({ start: getThaiTodayString(), end: getThaiTodayString() }); 

  useEffect(() => {
    const init = async () => {
        const name = await AsyncStorage.getItem("userName");
        if(name) setCommanderName(name);
        fetchTotalInmateData();
    };
    init();
    fetchReports(timeFilter);
  }, [timeFilter]);

  // 🟢 ดึงยอดและ "รายชื่อ" ผู้ต้องขังทั้งหมด
  const fetchTotalInmateData = async () => {
    try {
        const res = await getAdminInmates(""); 
        const list = res.data || [];
        setAllInmateList(list); // เซ็ตรายชื่อทั้งหมด

        let m = 0; let f = 0;
        list.forEach(i => {
            const pref = (i.prefix || i.prefixes_nameth || "").toLowerCase();
            const gen = (i.gender || "").toLowerCase();
            if (gen === 'female' || gen === 'f' || pref.includes('นาง') || pref.includes('น.ส.')) f++;
            else m++;
        });
        const totalCount = list.length || 0;
        const totalDiv = totalCount || 1;
        setTotalInmateStats({ 
            total: totalCount, male: m, female: f, 
            malePct: (m / totalDiv) * 100, femalePct: (f / totalDiv) * 100 
        });
    } catch (e) { console.warn("Inmate Fetch Error:", e); }
  };

  const formatDateThai = (dateStr) => {
    if (!dateStr) return "";
    try {
        const [y, m, d] = dateStr.split("-");
        const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`;
    } catch (e) { return dateStr; }
  };

  const fetchReports = async (filter) => {
    setLoading(true);
    try {
      const todayStr = getThaiTodayString(); 
      const res = await getAdminDashboardSummary(todayStr, filter);
      if (res) {
          const { summary, dateRange, platformStats: pStats } = res;
          setCurrentRange({ start: dateRange.start || todayStr, end: dateRange.end || todayStr }); 
          setStatsData({
            total: summary.totalBookings || 0,
            completed: summary.completedVisits || 0,
            missed: summary.cancelledVisits || 0,
            pending: summary.pendingVisits || 0,
            label: dateRange.start === dateRange.end ? `ประจำวันที่ ${formatDateThai(dateRange.start)}` : `ตั้งแต่วันที่ ${formatDateThai(dateRange.start)} ถึง ${formatDateThai(dateRange.end)}`
          });
          const totalP = ((pStats?.line || 0) + (pStats?.zoom || 0) + (pStats?.webrtc || 0)) || 1;
          setPlatformStats({ 
              zoom: pStats?.zoom || 0, line: pStats?.line || 0, webrtc: pStats?.webrtc || 0,
              zoomPct: ((pStats?.zoom || 0) / totalP) * 100, 
              linePct: ((pStats?.line || 0) / totalP) * 100, 
              webrtcPct: ((pStats?.webrtc || 0) / totalP) * 100 
          });
          setQueueList(res.queueList || []);
      }
    } catch (error) { console.warn(error); } finally { setLoading(false); setRefreshing(false); }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blobData = await exportDashboardReport(currentRange.start, currentRange.end);
      const filename = `Report_${currentRange.start}_to_${currentRange.end}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
            const base64data = reader.result.split(',')[1];
            await FileSystem.writeAsStringAsync(fileUri, base64data, { encoding: 'base64' });
            if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fileUri);
        } catch (err) { Alert.alert("ผิดพลาด", "ไม่สามารถบันทึกไฟล์ได้"); }
      };
      reader.readAsDataURL(blobData);
    } catch (error) { Alert.alert("ผิดพลาด", "เซิร์ฟเวอร์ขัดข้อง"); } finally { setExporting(false); }
  };

  const handleLogout = () => {
    Alert.alert("ยืนยัน", "ออกจากระบบใช่หรือไม่?", [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ออกจากระบบ", style: "destructive", onPress: async () => { await AsyncStorage.clear(); router.replace("/admin/login"); }}
    ]);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={s.header}>
        <View style={s.headerTopRow}>
            <MaterialCommunityIcons name="shield-crown" size={32} color="#FFF" />
            <View style={s.headerCenter}><Text style={s.headerTitle}>หน้าศูนย์บัญชาการ (ผบ.)</Text><Text style={s.headerSub}>รายงานและสถิติภาพรวม</Text></View>
            <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}><MaterialCommunityIcons name="logout" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        <View style={s.profileBox}><Text style={s.profileText}>ชื่อ : {commanderName}</Text><Text style={s.profileText}>ตำแหน่ง : ผู้บัญชาการเรือนจำ</Text></View>
        <View style={s.tabContainer}>
            {['daily', 'weekly', 'monthly'].map(f => (
                <TouchableOpacity key={f} style={[s.tab, timeFilter === f && s.tabActive]} onPress={() => setTimeFilter(f)}>
                    <Text style={[s.tabText, timeFilter === f && s.tabTextActive]}>{f === 'daily' ? 'รายวัน' : f === 'weekly' ? 'รายสัปดาห์' : f === 'monthly' ? 'รายเดือน' : ''}</Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(timeFilter); fetchTotalInmateData(); }} />}>
        
        {/* 📉 สถิตินักโทษรวม */}
        <View style={s.totalInmateCard}>
            <View style={s.inmateHeader}><MaterialCommunityIcons name="account-group" size={24} color={COLORS.primary} /><Text style={s.inmateTitle}>จำนวนผู้ต้องขังทั้งหมดในความดูแล</Text></View>
            <Text style={s.inmateValue}>{totalInmateStats.total} <Text style={{fontSize: 16, color: '#666'}}>คน</Text></Text>
            <View style={s.genderBarContainer}>
                <View style={[s.genderBar, { width: `${totalInmateStats.malePct}%`, backgroundColor: COLORS.male }]} />
                <View style={[s.genderBar, { width: `${totalInmateStats.femalePct}%`, backgroundColor: COLORS.female }]} />
            </View>
            <View style={s.genderLegend}>
                <View style={s.legendItem}><View style={[s.dot, {backgroundColor: COLORS.male}]} /><Text style={s.legendText}>ชาย: {totalInmateStats.male}</Text></View>
                <View style={s.legendItem}><View style={[s.dot, {backgroundColor: COLORS.female}]} /><Text style={s.legendText}>หญิง: {totalInmateStats.female}</Text></View>
            </View>
        </View>

        <View style={s.periodBox}>
          <View style={{flex:1, flexDirection:'row', alignItems:'center'}}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={s.periodText}>{statsData.label}</Text>
          </View>
          <TouchableOpacity style={s.exportBtn} onPress={handleExportPDF} disabled={exporting}>
            {exporting ? <ActivityIndicator size="small" color="#FFF" /> : <><Ionicons name="document-text" size={18} color="#FFF" /><Text style={s.exportBtnText}>PDF</Text></>}
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} /> : (
          <>
            <View style={s.statsGrid}>
                <View style={s.statCard}><MaterialCommunityIcons name="clipboard-text" size={28} color={COLORS.blue} /><Text style={s.statValue}>{statsData.total}</Text><Text style={s.statTitle}>คิวทั้งหมด</Text></View>
                <View style={s.statCard}><MaterialCommunityIcons name="check-circle" size={28} color={COLORS.green} /><Text style={s.statValue}>{statsData.completed}</Text><Text style={s.statTitle}>สำเร็จ</Text></View>
                <View style={s.statCard}><MaterialCommunityIcons name="close-circle" size={28} color={COLORS.red} /><Text style={s.statValue}>{statsData.missed}</Text><Text style={s.statTitle}>ยกเลิก</Text></View>
                <View style={s.statCard}><MaterialCommunityIcons name="clock" size={28} color={COLORS.orange} /><Text style={s.statValue}>{statsData.pending}</Text><Text style={s.statTitle}>รอ</Text></View>
            </View>

            <View style={s.chartCard}>
                <Text style={s.chartTitle}>สัดส่วนช่องทางการเยี่ยม</Text>
                <View style={s.barChartContainer}>
                    {[ {l:'WebRTC', v:platformStats.webrtc, p:platformStats.webrtcPct, c:COLORS.primary}, 
                       {l:'Zoom', v:platformStats.zoom, p:platformStats.zoomPct, c:COLORS.blue},
                       {l:'LINE', v:platformStats.line, p:platformStats.linePct, c:COLORS.green} ].map((item, i) => (
                        <View key={i} style={s.barRow}>
                            <Text style={s.barLabel}>{item.l}</Text>
                            <View style={s.barTrack}><View style={[s.barFill, { width: `${item.p}%`, backgroundColor: item.c }]} /></View>
                            <Text style={s.barValue}>{item.v}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* 📜 ส่วนที่ 1: รายละเอียดคิวจองเยี่ยม */}
            <Text style={s.listHeaderTitle}>รายละเอียดการจองคิว ({queueList.length})</Text>
            {queueList.length === 0 ? <Text style={s.emptyText}>ไม่พบรายการจองในรอบนี้</Text> : 
              queueList.map((item, index) => (
                <View key={index} style={s.queueCard}>
                  <View style={s.queueTimeBox}><Text style={s.queueTime}>{item.starts_at?.slice(0, 5)}</Text></View>
                  <View style={s.queueDetailBox}>
                    <Text style={s.queueInmate} numberOfLines={1}>ผู้ต้องขัง: {item.inmate_name}</Text>
                    <Text style={s.queueVisitor} numberOfLines={1}>ญาติ: {item.visitor_name}</Text>
                    <Text style={[s.statusText, { color: item.status === 'REJECTED' || item.status === 'CANCELLED' ? COLORS.red : COLORS.green }]}>{item.status}</Text>
                  </View>
                </View>
              ))
            }

            {/* 🟢 ส่วนที่ 2: รายชื่อนักโทษทั้งหมดในความดูแล */}
            <Text style={[s.listHeaderTitle, { marginTop: 30 }]}>รายชื่อผู้ต้องขังทั้งหมด ({allInmateList.length})</Text>
            {allInmateList.length === 0 ? <Text style={s.emptyText}>ไม่พบรายชื่อผู้ต้องขัง</Text> : 
              allInmateList.map((item, index) => (
                <View key={index} style={s.inmateListCard}>
                  <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
                  <View style={{ marginLeft: 15 }}>
                    <Text style={s.inmateListName}>{item.prefix || ''}{item.firstname} {item.lastname}</Text>
                    <Text style={s.inmateListSub}>เลขประจำตัว: {item.inmate_code || 'ไม่มีข้อมูล'}</Text>
                  </View>
                </View>
              ))
            }
            <View style={{ height: 50 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16 },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerCenter: { flex: 1, marginLeft: 15 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: "#FFD5D5", fontSize: 12 },
  logoutBtn: { padding: 5 },
  profileBox: { backgroundColor: COLORS.darkRed, padding: 12, borderRadius: 10, marginBottom: 15 },
  profileText: { color: '#FFF', fontSize: 13, opacity: 0.9 },
  tabContainer: { flexDirection: "row", backgroundColor: COLORS.white, padding: 4, borderRadius: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.subText, fontWeight: "bold" },
  tabTextActive: { color: COLORS.white },
  totalInmateCard: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, marginBottom: 15, elevation: 3 },
  inmateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  inmateTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.subText, marginLeft: 10 },
  inmateValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  genderBarContainer: { height: 12, borderRadius: 6, backgroundColor: '#EEE', flexDirection: 'row', overflow: 'hidden', marginBottom: 15 },
  genderBar: { height: '100%' },
  genderLegend: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, fontWeight: 'bold', color: COLORS.subText },
  periodBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  periodText: { fontSize: 13, fontWeight: "bold", color: COLORS.text, flex: 1 },
  exportBtn: { backgroundColor: COLORS.red, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 5 },
  exportBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: { width: "23%", backgroundColor: COLORS.white, borderRadius: 12, padding: 10, marginBottom: 15, elevation: 2, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: "bold", color: COLORS.text, marginTop: 5 },
  statTitle: { fontSize: 9, color: COLORS.subText, fontWeight: "bold" },
  chartCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, elevation: 2, marginBottom: 15 },
  chartTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.text, marginBottom: 15, textAlign: "center" },
  barChartContainer: { marginVertical: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabel: { width: 60, fontSize: 12, fontWeight: 'bold', color: '#555' },
  barTrack: { flex: 1, height: 16, backgroundColor: '#F0F0F0', borderRadius: 8, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: '100%' },
  barValue: { width: 25, fontSize: 12, color: '#333', fontWeight: 'bold', textAlign: 'right' },
  listHeaderTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text, marginBottom: 15 },
  queueCard: { flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 12, elevation: 1 },
  queueTimeBox: { borderRightWidth: 1, borderColor: "#EEE", paddingRight: 15, alignItems: "center", width: 60, justifyContent: "center" },
  queueTime: { fontSize: 16, fontWeight: "bold", color: COLORS.primary },
  queueDetailBox: { flex: 1, paddingLeft: 15 },
  queueInmate: { fontSize: 14, fontWeight: "bold", color: COLORS.text },
  queueVisitor: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  statusText: { fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10 },

  // 🟢 Inmate List Card Styles
  inmateListCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 10, elevation: 1 },
  inmateListName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  inmateListSub: { fontSize: 12, color: COLORS.subText, marginTop: 2 }
});