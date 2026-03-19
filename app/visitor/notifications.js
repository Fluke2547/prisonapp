// prison-visit-app/app/visitor/notifications.js
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Modal, ScrollView, StatusBar, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { getMyNotifications, markNotificationAsRead } from "../../service/notification.service";

const C = {
    primary: "#722F37",
    bg: "#F5F5F5",
    card: "#FFFFFF",
    text: "#333",
    subtext: "#666",
    unreadBg: "#FFF0F0"
};

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const determineType = (title, message) => {
        const text = (title + " " + message).toLowerCase();
        if (text.includes("ยกเลิก") || text.includes("ปฏิเสธ")) return "error";
        if (text.includes("พร้อมใช้งาน") || text.includes("สำเร็จ") || text.includes("อนุมัติ")) return "success";
        if (text.includes("พรุ่งนี้") || text.includes("เตรียมตัว")) return "warning";
        return "info";
    };

    const fetchNotifications = async () => {
        try {
            const res = await getMyNotifications();
            if (res && res.notifications) {
                const formattedData = res.notifications.map(item => {
                    const dateParts = item.created_at.split('(');
                    const dateStr = dateParts[0].trim();
                    const timeStr = dateParts[1] ? dateParts[1].replace(')', '') : '';

                    return {
                        id: item.id.toString(),
                        title: item.title,
                        detail: item.message,
                        date: dateStr,
                        time: timeStr,
                        read: item.is_read === 1,
                        type: determineType(item.title, item.message),
                    };
                });
                setNotifications(formattedData);
            }
        } catch (error) {
            console.error("Fetch Notifications Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchNotifications(); }, []));

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handlePressNotification = async (item) => {
        setSelectedItem(item);
        setModalVisible(true);

        if (!item.read) {
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
            try {
                await markNotificationAsRead(item.id);
            } catch (e) {
                console.error("Mark as read error:", e);
            }
        }
    };

    const handleGoToStatus = () => {
        setModalVisible(false);
        router.push("/visitor/status");
    };

    const getIcon = (type) => {
        switch (type) {
            case "success": return <Ionicons name="checkmark-circle" size={32} color="#00C853" />;
            case "error": return <Ionicons name="close-circle" size={32} color="#D32F2F" />;
            case "warning": return <Ionicons name="alert-circle" size={32} color="#FF9800" />;
            default: return <Ionicons name="information-circle" size={32} color="#2196F3" />;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[s.card, !item.read && s.unreadCard]}
            onPress={() => handlePressNotification(item)}
            activeOpacity={0.7}
        >
            {!item.read && <View style={s.redDot} />}
            <View style={s.iconContainer}>{getIcon(item.type)}</View>

            <View style={s.contentContainer}>
                <View style={s.topRow}>
                    <Text style={[s.cardTitle, !item.read && s.boldText]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={s.dateText}>{item.date}</Text>
                </View>
                <Text style={[s.detailText, !item.read && { color: '#333' }]} numberOfLines={2}>
                    {item.detail}
                </Text>
                <Text style={s.timeText}>{item.time}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />
            <View style={s.header}>
                <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>การแจ้งเตือน</Text>
                    <Text style={s.headerSub}>อัปเดตสถานะคิวเยี่ยมของคุณ</Text>
                </View>
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
                    ListEmptyComponent={
                        <View style={s.emptyContainer}>
                            <MaterialCommunityIcons name="bell-sleep" size={60} color="#CCC" />
                            <Text style={s.emptyText}>ยังไม่มีการแจ้งเตือนใหม่</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        {selectedItem && (
                            <>
                                <View style={s.modalHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {getIcon(selectedItem.type)}
                                        <Text style={s.modalTitle}>{selectedItem.title}</Text>
                                    </View>
                                </View>

                                <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                                    <Text style={s.modalDateText}>วันที่ {selectedItem.date} เวลา {selectedItem.time} น.</Text>
                                    <Text style={s.modalDetailFull}>{selectedItem.detail}</Text>
                                </ScrollView>

                                <View style={s.modalFooter}>
                                    <TouchableOpacity style={s.modalBtnClose} onPress={() => setModalVisible(false)}>
                                        <Text style={s.modalBtnCloseText}>ปิด</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.modalBtnAction} onPress={handleGoToStatus}>
                                        <Text style={s.modalBtnActionText}>ดูสถานะคิวเยี่ยม</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        backgroundColor: C.primary,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: {
        position: "absolute",
        left: 16,
        bottom: 20,
    },
    headerCenter: {
        alignItems: "center",
    },
    headerTitle: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },
    headerSub: {
        color: "#F3E8EA",
        fontSize: 12,
        marginTop: 4,
    },
    card: {
        flexDirection: "row",
        backgroundColor: C.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    unreadCard: {
        backgroundColor: C.unreadBg,
        borderColor: "#FFD1D1",
    },
    iconContainer: {
        marginRight: 15,
        justifyContent: "center",
    },
    contentContainer: {
        flex: 1,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 15,
        color: C.text,
        flex: 1,
        marginRight: 8,
        fontWeight: "600",
    },
    boldText: {
        fontWeight: "bold",
        color: C.primary,
    },
    dateText: {
        fontSize: 11,
        color: C.subtext,
    },
    detailText: {
        fontSize: 13,
        color: "#666",
        lineHeight: 20,
        marginBottom: 8,
    },
    timeText: {
        fontSize: 11,
        color: "#999",
        textAlign: "right",
    },
    redDot: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FF0000",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: C.subtext,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "85%",
        maxHeight: "70%",
        backgroundColor: "#FFF",
        borderRadius: 16,
        overflow: "hidden",
        elevation: 10,
    },
    modalHeader: {
        padding: 20,
        backgroundColor: "#FAFAFA",
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: C.text,
        marginLeft: 10,
        flex: 1,
    },
    modalBody: {
        padding: 20,
    },
    modalDateText: {
        fontSize: 12,
        color: "#888",
        marginBottom: 15,
    },
    modalDetailFull: {
        fontSize: 15,
        color: "#444",
        lineHeight: 24,
    },
    modalFooter: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#EEE",
    },
    modalBtnClose: {
        flex: 1,
        paddingVertical: 15,
        alignItems: "center",
        backgroundColor: "#FFF",
        borderBottomLeftRadius: 16,
    },
    modalBtnCloseText: {
        fontSize: 15,
        color: "#888",
        fontWeight: "bold",
    },
    modalBtnAction: {
        flex: 1.5,
        paddingVertical: 15,
        alignItems: "center",
        backgroundColor: C.primary,
        borderBottomRightRadius: 16,
    },
    modalBtnActionText: {
        fontSize: 15,
        color: "#FFF",
        fontWeight: "bold",
    },
});