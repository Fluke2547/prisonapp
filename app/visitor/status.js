// prison-visit-app/app/visitor/status.js
import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Alert, Linking, Modal } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import { getMyBookings, getMyHistoryBookings, cancelMyBooking } from "../../service/booking.service";

const C = {
  primary: "#722F37",
  bg: "#F5F5F5",
  white: "#fff",
  text: "#333",
  greenCheck: "#722F37",
  border: "#DDD",
  grayText: "#999",
  webrtcBtn: "#B71C1C",
  webrtcBg: "#FFEBEE"
};

export default function StatusScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("status");
  const [selectedHistory, setSelectedHistory] = useState(null);

  // 🟢 ปรับฟังก์ชันดึงข้อมูลให้แยก API ตาม Tab ที่เลือก
  const fetchBookings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      let res;
      if (activeTab === "status") {
        res = await getMyBookings();        // ดึงคิวปัจจุบัน
      } else {
        res = await getMyHistoryBookings(); // ดึงประวัติ
      }

      const list = Array.isArray(res) ? res : (res.data || []);

      list.sort((a, b) => {
        const idA = a.booking_id || a.id || 0;
        const idB = b.booking_id || b.id || 0;
        return idB - idA;
      });
      setBookings(list);
    } catch (error) {
      console.warn("Fetch Error:", error);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // 🟢 สั่งให้โหลดข้อมูลใหม่ทันที เมื่อมีการ "สลับแท็บ" หรือ "เปิดหน้านี้"
  useFocusEffect(
    useCallback(() => {
      fetchBookings(true);
      const intervalId = setInterval(() => {
        fetchBookings(false);
      }, 5000);
      return () => clearInterval(intervalId);
    }, [activeTab]) // <-- เพิ่ม dependency ตรงนี้ครับ!
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings(false);
  };

  const copyLink = async (text) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Alert.alert("สำเร็จ", "คัดลอกเรียบร้อยแล้ว");
  };

  const openMeetingLink = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("ผิดพลาด", "ไม่สามารถเปิดลิงก์นี้ได้");
    }
  };

  const openWebRTC = (inmateName, inmateCode) => {
    router.push({
      pathname: "/visitor/video-call",
      params: { inmateName: inmateName, inmateCode: inmateCode }
    });
  };

  const checkIsExpired = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    try {
      let targetDate = new Date();
      if (dateStr.match(/[ก-๙]/)) {
        const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        const parts = dateStr.split(" ");
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const monthIndex = thaiMonths.indexOf(parts[1]);
          const year = parseInt(parts[2]) - 543;
          targetDate = new Date(year, monthIndex, day);
        }
      } else { targetDate = new Date(dateStr); }

      const startTime = timeStr.split(" - ")[0];
      const [hours, minutes] = startTime.split(":").map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
      return new Date() > targetDate;
    } catch (e) { return false; }
  };

  const filteredBookings = bookings.filter((item) => {
    const rawStatus = String(item.booking_info?.status || item.status || item.booking_status || "").toUpperCase();
    const dateStr = item.booking_info?.date || item.date || item.visit_date;
    const timeStr = item.booking_info?.time || item.time || item.time_slot;
    const isExpired = checkIsExpired(dateStr, timeStr);

    if (activeTab === "status") {
      if (isExpired) return false;
      return ["PENDING", "APPROVED", "CONFIRMED", "อนุมัติแล้ว", "ผ่านการอนุมัติ"].includes(rawStatus);
    } else {
      if (isExpired) return true;
      return ["COMPLETED", "CANCELLED", "REJECTED", "ยกเลิก", "เยี่ยมเสร็จสิ้น", "ถูกปฏิเสธ", "ยกเลิกแล้ว"].includes(rawStatus);
    }
  });

  const getStatusDisplay = (item) => {
    const rawStatus = String(item.booking_info?.status || item.status || item.booking_status || "").toUpperCase();
    const dateStr = item.booking_info?.date || item.date || item.visit_date;
    const timeStr = item.booking_info?.time || item.time || item.time_slot;
    const isExpired = checkIsExpired(dateStr, timeStr);

    if (activeTab === "history" && isExpired && ["APPROVED", "PENDING", "CONFIRMED"].includes(rawStatus)) {
      return "หมดเวลาเยี่ยม";
    }

    switch (rawStatus) {
      case 'PENDING':
      case 'APPROVED':
      case 'CONFIRMED':
        return "อนุมัติแล้ว";
      case 'COMPLETED':
        return "เยี่ยมเสร็จสิ้น";
      case 'CANCELLED':
        return "ยกเลิกแล้ว";
      case 'REJECTED':
        return "ถูกปฏิเสธ";
      default:
        if (rawStatus === "อนุมัติ" || rawStatus === "รอการอนุมัติ") return "อนุมัติ";
        return rawStatus;
    }
  };

  const getHeaderColor = (item) => {
    const statusText = getStatusDisplay(item);
    if (["หมดเวลาเยี่ยม", "ยกเลิกแล้ว", "ถูกปฏิเสธ"].includes(statusText)) return "#999";
    if (statusText === "อนุมัติแล้ว" || statusText === "อนุมัติ" || statusText === "เยี่ยมเสร็จสิ้น") return C.greenCheck;
    return C.primary;
  };

  const getProcessedItemData = (item) => {
    if (!item) return {};

    const targetBookingId = item.booking_id || item.id || null;

    const rejectReason = 
    item.cancel_reason || 
    item.remark || 
    item.reason || 
    item.reject_reason || 
    item.booking_info?.cancel_reason || 
    item.booking_info?.remark || 
    item.slot?.cancel_reason || 
    item.slot?.remark || 
    item.slot?.reason || 
    "ไม่ระบุเหตุผล";

    let inmateName = item.inmate_fullname || "-";
    if (item.inmate_info) {
      const prefix = item.inmate_info.prefix || item.inmate_info.prefixe || item.inmate_info.prefixes_nameth || '';
      inmateName = `${prefix}${item.inmate_info.firstname || ''} ${item.inmate_info.lastname || ''}`.trim();
    }
    const inmateCode = item.inmate_info?.inmate_id || item.inmate_id || "-";

    const visitDate = item.booking_info?.date || item.date || item.visit_date || "-";
    const visitTime = item.booking_info?.time || item.time || item.time_slot || "-";
    const meetingLink = String(item.booking_info?.meeting_link || item.link || item.meeting_link || "");
    const platform = String(item.booking_info?.device_platform || item.device_platform || item.platform || item.channel || "").toLowerCase();
    const deviceName = String(item.booking_info?.device_name || item.device_name || "").toLowerCase();

    const linkLower = meetingLink.toLowerCase();

    let isWebRTC = false;
    let isLine = false;
    let isZoom = false;

    if (platform.includes("webrtc") || deviceName.includes("webrtc") || linkLower.includes("duckdns.org") || linkLower.includes("front.html")) {
      isWebRTC = true;
    } else if (platform.includes("line") || deviceName.includes("line") || linkLower.includes("line.me")) {
      isLine = true;
    } else if (platform.includes("zoom") || deviceName.includes("zoom") || linkLower.includes("zoom.us") || (meetingLink.length > 0)) {
      isZoom = true;
    }

    const lineId = item.booking_info?.device_name || item.device_name || item.line_id || "-";

    let channelDisplayName = "-";
    if (isWebRTC) channelDisplayName = "แอปพลิเคชัน (วีดีโอเยี่ยม)";
    else if (isLine) channelDisplayName = "LINE (ผ่านแอปพลิเคชัน)";
    else if (isZoom) channelDisplayName = "Zoom (วีดีโอคอนเฟอเรนซ์)";
    else channelDisplayName = item.booking_info?.device_platform || item.device_platform || item.booking_info?.device_name || item.device_name || "-";

    return { targetBookingId, inmateName, inmateCode, visitDate, visitTime, meetingLink, isLine, isZoom, isWebRTC, lineId, channelDisplayName, rejectReason };
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => router.replace("/visitor")}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>สถานะการจองคิวเยี่ยม</Text>
          <Text style={s.headerSub}>แสดงข้อมูลของคิวที่ได้เลือกไว้เพื่อเยี่ยมผู้ต้องขัง</Text>
        </View>
      </View>

      <View style={s.tabContainer}>
        <View style={s.toggleWrapper}>
          <TouchableOpacity style={[s.toggleBtn, activeTab === "status" && s.activeToggleBtn]} onPress={() => setActiveTab("status")}>
            <Text style={[s.toggleText, activeTab === "status" ? { color: '#000' } : { color: '#666' }]}>สถานะของคิว</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toggleBtn, activeTab === "history" && s.activeToggleBtn]} onPress={() => setActiveTab("history")}>
            <Text style={[s.toggleText, activeTab === "history" ? { color: '#000' } : { color: '#666' }]}>ประวัติจอง/เข้าเยี่ยม</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
      >
        {loading && !refreshing ? (
          <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
        ) : filteredBookings.length === 0 ? (
          <View style={s.center}><Text style={{ color: C.grayText, marginTop: 50 }}>{activeTab === "status" ? "ไม่มีคิวที่กำลังรอ" : "ไม่มีประวัติการเข้าเยี่ยม"}</Text></View>
        ) : (
          filteredBookings.map((item, index) => {
            const { targetBookingId, inmateName, inmateCode, visitDate, visitTime, meetingLink, isLine, isZoom, isWebRTC, lineId, channelDisplayName } = getProcessedItemData(item);
            const showActions = activeTab === "status";

            if (activeTab === "history") {
              const statusText = getStatusDisplay(item);
              return (
                <TouchableOpacity
                  key={`hist-${index}`}
                  style={s.historyCompactCard}
                  activeOpacity={0.7}
                  onPress={() => setSelectedHistory(item)}
                >
                  <View style={s.historyCompactIcon}>
                    <Ionicons name="time-outline" size={24} color={C.primary} />
                  </View>
                  <View style={s.historyCompactBody}>
                    <Text style={s.historyCompactTitle} numberOfLines={1}>{inmateName}</Text>
                    <Text style={s.historyCompactDate}>{visitDate} | {visitTime} น.</Text>
                  </View>
                  <View style={s.historyCompactRight}>
                    <Text style={[s.historyStatusBadge, statusText === "เยี่ยมเสร็จสิ้น" && { color: "#00C853" }]}>
                      {statusText}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#CCC" />
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <View key={`stat-${index}`} style={s.cardWrapper}>
                <View style={[s.cardHeader, { backgroundColor: getHeaderColor(item) }]}>
                  <Text style={s.cardHeaderTitle}>{getStatusDisplay(item)}</Text>
                </View>

                <View style={s.cardBody}>
                  <Text style={s.cardSubTitle}>รายละเอียดของคิวผู้ต้องขัง</Text>
                  <View style={s.infoContainer}>
                    <InfoRow label="รหัสประจำตัวผู้ต้องขัง" value={inmateCode} />
                    <InfoRow label="ชื่อของผู้ต้องขัง" value={inmateName} />
                    <InfoRow label="วัน/เดือน/ปี" value={visitDate} />
                    <InfoRow label="เวลาที่ทำการจอง" value={visitTime} />
                    <InfoRow label="ช่องทางที่เข้าเยี่ยม" value={channelDisplayName} />
                  </View>

                  <View style={s.linkContainer}>
                    {isWebRTC ? (
                      <View style={[s.linkWrapper, { borderColor: C.webrtcBtn, backgroundColor: C.webrtcBg }]}>
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 5, justifyContent: 'center' }}
                          onPress={() => meetingLink ? openMeetingLink(meetingLink) : openWebRTC(inmateName, inmateCode)}
                        >
                          <Ionicons name="videocam" size={22} color={C.webrtcBtn} style={{ marginRight: 8 }} />
                          <Text style={{ color: C.webrtcBtn, fontSize: 14, fontWeight: 'bold' }}>
                            กดเพื่อเริ่มวิดีโอเยี่ยม (WebRTC)
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) :
                      isLine ? (
                        <View style={[s.linkWrapper, { borderColor: '#06C755', backgroundColor: '#E8F5E9' }]}>
                          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 5 }}>
                            <Text style={{ fontSize: 12, color: '#06C755', fontWeight: 'bold', marginBottom: 2 }}>LINE ID สำหรับแอดเพื่อรอเยี่ยม</Text>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{lineId}</Text>
                          </View>
                          <TouchableOpacity onPress={() => copyLink(lineId)} style={s.copyBtn}>
                            <MaterialCommunityIcons name="content-copy" size={20} color="#06C755" />
                          </TouchableOpacity>
                        </View>
                      ) :
                        meetingLink ? (
                          <View style={[s.linkWrapper, { borderColor: '#2D8CFF', backgroundColor: '#EBF4FF' }]}>
                            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }} onPress={() => openMeetingLink(meetingLink)}>
                              <Ionicons name="videocam" size={20} color="#2D8CFF" style={{ marginRight: 8 }} />
                              <Text style={{ color: '#2D8CFF', fontSize: 13, fontWeight: 'bold', textDecorationLine: 'underline' }}>
                                กดเพื่อเริ่มการสนทนาผ่าน ZOOM
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => copyLink(meetingLink)} style={s.copyBtn}>
                              <MaterialCommunityIcons name="content-copy" size={20} color="#2D8CFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={[s.linkWrapper, { backgroundColor: '#F0F0F0' }]}>
                            <Text style={{ flex: 1, color: '#999', fontSize: 13, textAlign: 'center', paddingVertical: 8 }}>รอลิงก์เข้าเยี่ยมจากเจ้าหน้าที่...</Text>
                          </View>
                        )}
                  </View>

                  {showActions && (
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={s.rescheduleBtn}
                        onPress={() => {
                          router.push({
                            pathname: "/visitor/reschedule",
                            params: {
                              editId: targetBookingId,
                              inmate_id: inmateCode,
                              inmate_name: inmateName,
                              old_date: visitDate,
                              old_time: visitTime,
                              old_channel: channelDisplayName
                            }
                          });
                        }}
                      >
                        <Text style={s.rescheduleText}>เลื่อนวัน/เวลา</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={s.cancelBtn} onPress={() => {
                        Alert.alert("ยืนยัน", "ต้องการยกเลิกการจองนี้ใช่หรือไม่?", [
                          { text: "ไม่ใช่", style: "cancel" },
                          {
                            text: "ใช่", style: "destructive", onPress: async () => {
                              if (!targetBookingId) {
                                return Alert.alert("ผิดพลาด", "ไม่พบรหัสการจอง");
                              }
                              try {
                                setLoading(true);
                                await cancelMyBooking(targetBookingId);
                                Alert.alert("สำเร็จ", "ยกเลิกการจองเรียบร้อยแล้ว");
                                fetchBookings(true);
                              }
                              catch (e) {
                                Alert.alert("Error", e.response?.data?.message || "ยกเลิกไม่สำเร็จ");
                              }
                              finally { setLoading(false); }
                            }
                          }
                        ]);
                      }}>
                        <Text style={s.cancelText}>ยกเลิก</Text>
                      </TouchableOpacity>

                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal ประวัติ */}
      {selectedHistory && (
        <Modal visible={!!selectedHistory} transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={s.modalContainer}>
              {(() => {
                const { inmateName, inmateCode, visitDate, visitTime, isZoom, isLine, isWebRTC, channelDisplayName, rejectReason } = getProcessedItemData(selectedHistory);
                const statusText = getStatusDisplay(selectedHistory);
                
                // 🟢 แยกสถานะให้ชัดเจน
                const isRejected = statusText === "ถูกปฏิเสธ";
                const isCancelled = statusText === "ยกเลิกแล้ว";
                const isFailed = isRejected || isCancelled; // รวมสถานะที่ไม่ได้เยี่ยมจริง

                return (
                  <View style={s.modalContent}>
                    <Text style={s.modalTitle}>รายละเอียดประวัติการเยี่ยม</Text>
                    <View style={s.divider} />

                    <Text style={s.historyFullText}>
                      <Text style={{ fontWeight: 'bold', color: C.primary }}>
                        {isFailed ? 'ขอเข้าเยี่ยม: ' : 'คุณได้เข้าเยี่ยม: '}
                      </Text>{inmateName}{"\n"}
                      <Text style={{ fontWeight: 'bold', color: C.primary }}>รหัสประจำตัว: </Text>{inmateCode}{"\n"}
                      <Text style={{ fontWeight: 'bold', color: C.primary }}>ผ่านช่องทาง: </Text>{isWebRTC ? 'แอปพลิเคชัน (วีดีโอเยี่ยม)' : isZoom ? 'Zoom' : isLine ? 'Line' : channelDisplayName}{"\n"}
                      <Text style={{ fontWeight: 'bold', color: C.primary }}>ณ วันที่: </Text>{visitDate} , {visitTime} น.
                    </Text>

                    {/* 🔴 1. ถ้าโดนปฏิเสธ ให้โชว์กรอบแดง + เหตุผล */}
                    {isRejected && (
                      <View style={[s.quotaBox, { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}>
                        <Text style={[s.quotaText, { color: '#C62828', fontWeight: 'bold', fontSize: 14 }]}>
                          สถานะ: {statusText}
                        </Text>
                        <Text style={[s.quotaText, { color: '#C62828', marginTop: 4 }]}>
                          เหตุผล: {rejectReason}
                        </Text>
                      </View>
                    )}

                    {/* ⚪ 2. ถ้าญาติยกเลิกเอง ให้โชว์กรอบเทา ไม่ต้องมีเหตุผล */}
                    {isCancelled && (
                      <View style={[s.quotaBox, { backgroundColor: '#F5F5F5', borderColor: '#DDD' }]}>
                        <Text style={[s.quotaText, { color: '#666', fontWeight: 'bold', fontSize: 14 }]}>
                          สถานะ: {statusText}
                        </Text>
                        <Text style={[s.quotaText, { color: '#666', marginTop: 4 }]}>
                          (ท่านเป็นผู้ยกเลิกรายการนี้ด้วยตนเอง)
                        </Text>
                      </View>
                    )}

                    {/* 🟡 3. ถ้าเยี่ยมสำเร็จ โชว์กรอบเหลืองบอกโควต้า */}
                    {!isFailed && (
                      <View style={s.quotaBox}>
                        <Text style={s.quotaText}>
                          คุณเหลือสิทธิ์การเข้าเยี่ยมผู้ต้องขังคนนี้แบบออนไลน์ภายในเดือนนี้ <Text style={{ fontWeight: 'bold', color: C.primary }}>จำนวน 1 ครั้ง</Text>
                        </Text>
                      </View>
                    )}

                    <Text style={s.historyFooterText}>ข้อมูลอัปเดต: {visitDate}</Text>

                    <TouchableOpacity style={s.modalCloseBtn} onPress={() => setSelectedHistory(null)}>
                      <Text style={s.modalCloseText}>ปิด</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={s.row}>
    <Ionicons name="checkmark-circle" size={18} color={C.greenCheck} style={{ marginRight: 8, marginTop: 2 }} />
    <Text style={s.rowText}>
      <Text style={{ fontWeight: 'bold', color: '#000' }}>{label} : </Text>
      <Text style={{ color: '#555' }}>{value}</Text>
    </Text>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: C.primary, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  backButton: { position: "absolute", left: 16, bottom: 25, padding: 5, zIndex: 10 },
  headerCenter: { alignItems: "center" },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  headerSub: { color: "#E0E0E0", fontSize: 12, marginTop: 4 },

  tabContainer: { alignItems: "center", marginTop: 20, marginBottom: 10 },
  toggleWrapper: { flexDirection: "row", backgroundColor: "#E0E0E0", borderRadius: 8, padding: 3, width: "90%", height: 45 },
  toggleBtn: { flex: 1, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  activeToggleBtn: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: "bold" },

  cardWrapper: { marginBottom: 20, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#E5E5E5", backgroundColor: "#fff", elevation: 3 },
  cardHeader: { paddingVertical: 12, alignItems: "center" },
  cardHeaderTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cardBody: { padding: 20 },
  cardSubTitle: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 15, color: "#000" },
  infoContainer: { gap: 8, marginBottom: 15 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  rowText: { fontSize: 13, lineHeight: 20, flex: 1 },

  historyCompactCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 1,
  },
  historyCompactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FCE4EC",
    alignItems: "center",
    justify: "center",
    marginRight: 12,
  },
  historyCompactBody: {
    flex: 1,
  },
  historyCompactTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  historyCompactDate: {
    fontSize: 13,
    color: "#777",
  },
  historyCompactRight: {
    alignItems: "flex-end",
    justify: "center",
  },
  historyStatusBadge: {
    fontSize: 10,
    color: "#999",
    fontWeight: "bold",
    marginBottom: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justify: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: C.text,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 15,
  },
  historyFullText: {
    color: "#444",
    fontSize: 14,
    lineHeight: 26,
  },
  quotaBox: {
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  quotaText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
    textAlign: "center",
  },
  historyFooterText: {
    color: "#999",
    fontSize: 11,
    textAlign: "right",
    marginBottom: 15,
  },
  modalCloseBtn: {
    backgroundColor: C.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  linkContainer: {
    marginBottom: 20,
  },
  linkWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    minHeight: 45,
  },
  copyBtn: {
    padding: 8,
    marginLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#DDD",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  rescheduleBtn: {
    flex: 1,
    backgroundColor: C.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  rescheduleText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#CCC",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: {
    color: C.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
});