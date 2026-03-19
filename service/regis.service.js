// prison-visit-app/service/regis.service.js
import { apiClient } from "../constants/api"; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🟢 1. ฟังก์ชันเข้าสู่ระบบเจ้าหน้าที่
export const loginOfficer = (payload) => {
    return apiClient.post(`/admin/login`, payload);
};

// 🟢 2. ดึงรายการจองของวันนี้ (อัปเดตให้เหมือนฝั่งแอดมิน 100%)
export const getOfficerBookings = async (date) => {
    const token = await AsyncStorage.getItem("userToken");
    
    // เติม _t=Date.now() เพื่อกันระบบจำข้อมูลเก่า (Cache)
    const response = await apiClient.get(`/admin/visit-bookings`, { 
        params: { date, _t: Date.now() },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data; // 👈 คืนค่า payload จริงๆ ออกไปเลย
};

// 🟢 3. อัปเดตสถานะการเยี่ยม (ส่ง CHECK_IN, COMPLETED, NO_SHOW)
export const updateBookingStatus = async (id, status) => {
    const token = await AsyncStorage.getItem("userToken");

    return apiClient.put(`/admin/visit-bookings/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 🟢 4. ดึงประวัติการจอง
export const getVisitHistory = async (params) => {
    const token = await AsyncStorage.getItem("userToken");
    
    return apiClient.get(`/admin/visit-history`, {
        params: params,
        headers: { Authorization: `Bearer ${token}` }
    });
};