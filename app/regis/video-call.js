// prison-visit-app/app/regis/video-call.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Alert, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// ปิดคอมเมนต์ WebRTC ไว้ก่อน เพื่อให้รันใน Expo Go ได้โดยไม่แครช
// import { RTCView, mediaDevices, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
// import io from 'socket.io-client';

const C = {
    primary: "#722F37",
    bg: "#333333",
    white: "#FFFFFF",
    text: "#FFF",
    controlBg: "#FFFFFF",
    btnBg: "#E0E0E0",
    redEnd: "#FF0000"
};

export default function VideoCallScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 นาที
    const [statusText, setStatusText] = useState("โหมดจำลอง (Expo Go)");

    // ==========================================
    // ฟังก์ชันจับเวลาถอยหลัง (จำลองการทำงาน)
    // ==========================================
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    Alert.alert("หมดเวลา", "การสนทนาสิ้นสุดลงแล้ว ระบบกำลังตัดสาย", [{ text: "ตกลง", onPress: () => router.back() }]);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // ==========================================
    // 🟢 ควบคุมปุ่มต่างๆ (Control Bar)
    // ==========================================
    const toggleMute = () => setIsMuted(!isMuted);
    const toggleVideo = () => setIsVideoOff(!isVideoOff);

    const handleEndCallBtn = () => {
        Alert.alert(
            "วางสาย",
            "คุณต้องการสิ้นสุดการสนทนาใช่หรือไม่?",
            [
                { text: "ยกเลิก", style: "cancel" },
                { text: "วางสาย", style: "destructive", onPress: () => router.back() }
            ]
        );
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />

            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={handleEndCallBtn}>
                    <Ionicons name="arrow-back" size={28} color={C.white} />
                </TouchableOpacity>
                <View style={s.headerTextContainer}>
                    <Text style={s.headerTitle}>กำลังสนทนากับ : {params.inmateName || "ผู้ต้องขัง"}</Text>
                    <Text style={s.headerSub}>{statusText}</Text>
                </View>
            </View>

            <View style={s.videoArea}>
                
                <View style={s.localVideoContainer}>
                    {isVideoOff ? (
                        <View style={s.rtcViewDummy}><Ionicons name="videocam-off" size={40} color="#888" /></View>
                    ) : (
                        <View style={[s.rtcViewDummy, {backgroundColor: '#777'}]}>
                            <Text style={{color: '#FFF', fontSize: 10}}>กล้องคุณ</Text>
                            <Ionicons name="person" size={50} color="#CCC" />
                        </View>
                    )}
                </View>

                <View style={s.remoteVideoContainer}>
                    <View style={s.remoteAvatarDummy}>
                        <Text style={{color: '#FFF', marginBottom: 10}}>กล้องผู้ต้องขัง (รอรันบนแอปจริง)</Text>
                        <Ionicons name="person" size={120} color="#FFF" />
                    </View>
                </View>

                <View style={s.timerContainer}>
                    <Text style={s.timerLabel}>เหลือเวลา :</Text>
                    <Text style={[s.timerValue, timeLeft <= 60 && { color: '#FFCDD2' }]}>
                        {formatTime(timeLeft)} นาที
                    </Text>
                </View>

            </View>

            <View style={s.footer}>
                <Text style={s.warningText}>การสนทนานี้ถูกบันทึกภาพและเสียงตามระเบียบเรือนจำ</Text>
                
                <View style={s.controlBar}>
                    <TouchableOpacity 
                        style={[s.controlBtn, isMuted && { backgroundColor: '#FFCDD2' }]} 
                        onPress={toggleMute}
                    >
                        <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? C.primary : "#555"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={s.endCallBtn} onPress={handleEndCallBtn}>
                        <MaterialIcons name="call-end" size={36} color={C.white} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[s.controlBtn, isVideoOff && { backgroundColor: '#FFCDD2' }]} 
                        onPress={toggleVideo}
                    >
                        <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color={isVideoOff ? C.primary : "#555"} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },

    header: {
        backgroundColor: C.primary,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 10,
        paddingTop: Platform.OS === "ios" ? 50 : 40,
    },
    backBtn: {
        padding: 5,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: "center",
        paddingRight: 30,
    },
    headerTitle: {
        color: C.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    headerSub: {
        color: "#FFCDD2",
        fontSize: 12,
        marginTop: 2,
    },

    videoArea: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    timerContainer: {
        position: "absolute",
        top: 20,
        right: 20,
        alignItems: "flex-end",
        zIndex: 20,
        backgroundColor: "rgba(0,0,0,0.4)",
        padding: 8,
        borderRadius: 8,
    },
    timerLabel: {
        color: C.white,
        fontSize: 12,
        fontWeight: "bold",
    },
    timerValue: {
        color: C.white,
        fontSize: 24,
        fontWeight: "bold",
    },

    remoteVideoContainer: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#222",
    },
    remoteAvatarDummy: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "#555",
        justifyContent: "center",
        alignItems: "center",
    },

    localVideoContainer: {
        position: "absolute",
        bottom: 20,
        right: 20,
        width: 110,
        height: 150,
        backgroundColor: "#9e9e9e",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#555",
        zIndex: 10,
    },
    rtcViewDummy: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#E0E0E0",
    },

    footer: {
        paddingBottom: 40,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    warningText: {
        color: C.white,
        fontSize: 12,
        marginBottom: 15,
        textAlign: "center",
    },
    controlBar: {
        flexDirection: "row",
        backgroundColor: C.controlBg,
        borderRadius: 50,
        paddingVertical: 10,
        paddingHorizontal: 20,
        width: "90%",
        justifyContent: "space-around",
        alignItems: "center",
    },
    controlBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#FFF3E0",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    endCallBtn: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: C.redEnd,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});