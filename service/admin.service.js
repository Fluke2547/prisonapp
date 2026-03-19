//prison-visit-app/service/admin.service.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../constants/api";

// Helper: แปลงวันที่เป็น YYYY-MM-DD
const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

//ดึงรายการจอง (GET /admin/slots?date=...)
export const getAdminBookings = async (date) => {
    const token = await AsyncStorage.getItem("userToken");
    const dateStr = formatDate(date);
    // 🔥 เติม &_t=${Date.now()} เข้าไป เพื่อกันแอปจำข้อมูลเก่า (Cache)
    const response = await apiClient.get(`/admin/slots?date=${dateStr}&_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

//ใส่ลิงก์ Zoom (PUT /admin/slots/{id}/link)
export const updateMeetingLink = async (bookingId, link) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.put(
        `/admin/slots/${bookingId}/link`,
        { meeting_link: link },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

//ยกเลิกการจอง (PUT /admin/slots/{id}/cancel)
export const cancelBooking = async (slotId, reason) => {
    try {
        const token = await AsyncStorage.getItem("userToken");
        const response = await apiClient.put(
            `/admin/slots/${slotId}/cancel`,
            { reason: reason },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

// ดึงรายการคำขอสมัครสมาชิก (สถานะ Pending)
export const getRegisterRequests = async () => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.get(`/admin/request/pending?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// อนุมัติการสมัครสมาชิก (ส่ง status: "APPROVED")
export const approveRegister = async (id) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.put(`/admin/request/${id}/review`,
        { action: "APPROVED" },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

// ไม่อนุมัติการสมัครสมาชิก (ส่ง status: "REJECTED" พร้อมเหตุผล)
export const rejectRegister = async (id, reason) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.put(`/admin/request/${id}/review`,
        { 
            action: "REJECTED", 
            reject_reason: reason // 🟢 เปลี่ยนจาก reason: reason เป็น reject_reason: reason 
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

// เพิ่มฟังก์ชันอัปโหลด Excel ผู้ต้องขัง
export const uploadInmateExcel = async (fileUri, fileName, mimeType) => {
    const token = await AsyncStorage.getItem("userToken");

    // สร้างฟอร์มสำหรับส่งไฟล์ (multipart/form-data)
    const formData = new FormData();
    formData.append('file', {
        uri: fileUri,
        name: fileName || 'inmates.xlsx',
        type: mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Type ของไฟล์ Excel
    });

    try {
        const response = await apiClient.post('/admin/inmate/excel', formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data', // 🟢 บังคับให้เป็นประเภทอัปโหลดไฟล์
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// ดึงรายชื่อผู้ต้องขังทั้งหมด (รองรับการค้นหา) (GET /admin/inmates)
export const getAdminInmates = async (search = "") => {
    const token = await AsyncStorage.getItem("userToken");

    // ตั้งค่า params ถ้ามีคำค้นหาจะส่งไป ถ้าไม่มีจะดึงทั้งหมด
    const params = search ? { search } : {};

    const response = await apiClient.get('/admin/inmates', {
        params: params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// ==========================================
// 🚀 ระบบจัดการรอบการจอง และ คิวเยี่ยม
// ==========================================

//ดึงข้อมูลอุปกรณ์ทั้งหมด (GET /admin/devices)
export const getAdminDevices = async () => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.get('/admin/devices', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

//ดึงข้อมูลรอบการจอง (GET /admin/visit-slots)
// params รับค่า { start_date, end_date, device_id, status }
export const getAdminVisitSlots = async (params = {}) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.get('/admin/visit-slots', {
        params: params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

//สร้างรอบการจองล่วงหน้า (POST /admin/visit-slots/generate-advanced)
export const generateAdminVisitSlots = async (payload) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.post('/admin/visit-slots/generate-advanced', payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// 🟢 ฟังก์ชันสำหรับลบรอบเวลา (Slot)
export const deleteAdminVisitSlot = async (slotId) => {
    const token = await AsyncStorage.getItem("userToken");

    const response = await apiClient.delete(`/admin/visit-slots/${slotId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
};

// 4. ดึงข้อมูลรายการจองของญาติ (GET /admin/visit-bookings)
// params รับค่า { booking_code, status, date }
export const getAdminVisitBookings = async (params = {}) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.get('/admin/visit-bookings', {
        params: params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// เพิ่มผู้ต้องขังใหม่ (POST /admin/inmates)
export const addAdminInmate = async (payload) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.post('/admin/inmates', payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// แก้ไขข้อมูลผู้ต้องขัง (PUT /admin/inmates/{id})
export const updateAdminInmate = async (id, payload) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.put(`/admin/inmates/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// ลบผู้ต้องขัง (DELETE /admin/inmates/{id})
export const deleteAdminInmate = async (id) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.delete(`/admin/inmates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// 🟢 แก้ไขจุดนี้: เปลี่ยนจาก startDate/endDate เป็น date/range ตาม Postman
export const getAdminDashboardSummary = async (date, range) => {
    const token = await AsyncStorage.getItem("userToken");
    
    const response = await apiClient.get(`/api/dashboard/summary`, {
        params: { 
            date: date,    // เช่น 2026-03-12
            range: range   // เช่น daily, weekly, monthly
        },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// 🟢 ฟังก์ชันดาวน์โหลด PDF (ใช้ startDate/endDate ตามเดิม)
export const exportDashboardReport = async (startDate, endDate) => {
    const token = await AsyncStorage.getItem("userToken");
    const response = await apiClient.get(`/api/dashboard/export`, {
        params: { startDate, endDate, format: 'pdf' },
        responseType: 'blob',
        headers: { 
            Authorization: `Bearer ${token}`,
            'Accept': 'application/pdf' 
        }
    });
    return response.data;
};

// 🟢 1. ดึงข้อมูล
export const getAdminUsers = async (search = "") => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.get(`/admin/officers`, {
        params: { search },
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 🟢 2. เพิ่มข้อมูล
export const addAdminUser = async (payload) => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.post(`/admin/officers`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 🟢 3. อัปเดตข้อมูล
export const updateAdminUser = async (id, payload) => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.put(`/admin/officers/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 🟢 4. ลบข้อมูล
export const deleteAdminUser = async (id) => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.delete(`/admin/officers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// ==========================================
// 🟢 จัดการอุปกรณ์ (Devices)
// ==========================================

export const getDevices = async () => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.get(`/admin/devices`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const getDeviceById = async (id) => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.get(`/admin/devices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const addDevice = async (payload) => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.post(`/admin/devices`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateDevice = async (id, payload) => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.put(`/admin/devices/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const deleteDevice = async (id) => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.delete(`/admin/devices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// ==========================================
// 🟢 จัดการข้อมูลญาติ (Relatives / Users)
// ==========================================

export const getAdminRelatives = async (search = "") => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.get(`/admin/users`, { 
        params: { search },
        headers: { Authorization: `Bearer ${token}` } 
    });
};

export const updateRelativeStatus = async (userId, isActive) => {
    const token = await AsyncStorage.getItem("userToken");
    // isActive ส่งเป็น "1" (เปิด) หรือ "0" (ระงับ)
    return apiClient.put(`/admin/users/${userId}/status`, 
        { is_active: String(isActive) }, 
        { headers: { Authorization: `Bearer ${token}` } }
    );
};

// เพิ่มฟังก์ชันสำหรับแก้ไขข้อมูลส่วนตัวญาติ
export const updateRelativeInfo = async (userId, payload) => {
    const token = await AsyncStorage.getItem("userToken");
    return apiClient.put(`/admin/users/${userId}/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
};