// prison-visit-app/service/booking.service.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../constants/api";

const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 1. เช็ควันว่างรายเดือน
export const getMonthlySlots = async (year, month, excludeBookingId = null) => {
    try {
        const token = await AsyncStorage.getItem("userToken");
        const formattedMonth = String(month).padStart(2, '0');

        let url = `/slot/monthly?year=${year}&month=${formattedMonth}`;

        if (excludeBookingId && excludeBookingId !== "-") {
            url += `&exclude_booking_id=${excludeBookingId}`;
        }
        const response = await apiClient.get(url, { headers: { Authorization: `Bearer ${token}` } });

        return response?.data || response;
    } catch (error) { throw error; }
};

// 🟢 2. เช็คเวลาว่างรายวัน (เปลี่ยนมารับค่า inmateId แทนเพศ)
export const getDailySlots = async (date, type, inmateId, excludeBookingId = null) => {
    try {
        const token = await AsyncStorage.getItem("userToken");
        const cleanDate = formatDate(date);
        const channelType = type ? type.toUpperCase() : 'LINE';

        // 🟢 ส่งค่า inmate_id ไปให้ Backend ตามที่อัปเดตใหม่
        const params = { 
            date: cleanDate, 
            type: channelType,
            inmate_id: inmateId // 👈 ส่ง ID ของนักโทษไป
        };

        if (excludeBookingId && excludeBookingId !== "-") {
            params.exclude_booking_id = excludeBookingId;
        }

        console.log(`📡 Fetching Slots with Inmate ID:`, params);

        const response = await apiClient.get(`/slots`, {
            params: params,
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;

    } catch (error) {
        if (error.response && error.response.status === 404) return [];
        throw error;
    }
};

// 2.5 ดึงรายชื่อผู้ต้องขังที่มีคิวในวันนั้นๆ
export const getInmatesForDate = async (date) => {
    const token = await AsyncStorage.getItem("userToken");
    const cleanDate = formatDate(date);
    return await apiClient.get(`/inmate/slot?date=${cleanDate}`, {
        headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
};

// 2.75 ดึงข้อมูลพรีวิวการจอง (Booking Preview) เพื่อแสดงรายละเอียดก่อนยืนยันการจอง
export const getBookingPreview = async (inmateId, slotId) => {
    const token = await AsyncStorage.getItem("userToken");
    return await apiClient.get(`/booking-preview`, {
        params: { inmate_id: inmateId, slot_id: slotId },
        headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
};

// 3. สร้างการจอง (Booking)
export const createBooking = async (bookingToken) => {
    const token = await AsyncStorage.getItem("userToken");
    return await apiClient.post('/booking', { bookingToken }, {
        headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
};

// 4. ดึงข้อมูลการจองของผู้ใช้ (My Bookings)
export const getMyBookings = async () => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.get("/my-booking", {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// ✅ ฟังก์ชันยกเลิกการจอง
export const cancelMyBooking = async (bookingId) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.put(`/booking/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};


// ==========================================
// 🚀 ฟังก์ชันสำหรับการ "เลื่อนคิว" (Reschedule)
// ==========================================

// ดึงข้อมูลการจองเก่าเพื่อแสดงในหน้าพรีวิวการเลื่อน
export const getOldBookingForReschedule = async (bookingId) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.get(`/booking/${bookingId}/reschedule`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response?.data || response;
};

// ดึง Token สำหรับพรีวิวการเลื่อน
export const getReschedulePreview = async (bookingId, newSlotId) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.get(`/booking/${bookingId}/reschedule/preview`, {
        params: { new_slot_id: newSlotId },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response?.data || response;
};

// ยืนยันการเลื่อนคิว (POST)
export const confirmReschedule = async (rescheduleToken) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.post(`/booking/reschedule`,
        { reschedule_token: rescheduleToken },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response?.data || response;
};

// 🟢 เพิ่มฟังก์ชันนี้ต่อท้ายไฟล์ได้เลยครับ
export const getMyHistoryBookings = async () => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.get('/my-booking/history', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};