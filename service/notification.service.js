// service/notification.service.js
import { apiClient } from "../constants/api";
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🟢 1. Import ตัวดึงข้อมูลในเครื่อง

// ฟังก์ชันช่วยดึง Token (เปลี่ยน 'token' เป็นชื่อคีย์ที่ลูกพี่ใช้ตอน Login นะขอรับ)
const getHeaders = async () => {
    const token = await AsyncStorage.getItem('userToken'); // 🟢 2. ดึง Token จาก AsyncStorage
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

// 1. ดึงรายการแจ้งเตือนทั้งหมด
export const getMyNotifications = async () => {
    const config = await getHeaders(); // 🟢 2. ดึง Token มาใส่ Header
    const response = await apiClient.get('/api/notifications', config);
    return response.data;
};

// 2. อัปเดตสถานะว่า "อ่านแล้ว" (PUT)
export const markNotificationAsRead = async (id) => {
    const config = await getHeaders(); // 🟢 2. ดึง Token มาใส่ Header
    // สำหรับ PUT พารามิเตอร์ตัวที่ 2 คือ Body (เราไม่ได้ส่งอะไรให้ใส่ {}) ตัวที่ 3 คือ Config (Headers)
    const response = await apiClient.put(`/api/notifications/read/${id}`, {}, config);
    return response.data;
};