//prison-visit-app/constants/api.js
import axios from "axios";

export const apiClient = axios.create({
    // 🟢 ดึง URL และ API KEY จากไฟล์ .env (ซ่อนความลับ)
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.EXPO_PUBLIC_API_KEY,
    },
    timeout: 15000,
});

// เช็คบัตรประชาชน
export const checkIdCard = (id_card) =>
  apiClient.post("/check-idcard", { id_card });

// สมัครสมาชิก
export const registerUser = (payload) =>
  apiClient.post("/register", payload);

// login
export const loginUser = (payload) =>
  apiClient.post("/login", payload);

// ดึงข้อมูลหน้าหลัก
export const getMainProfile = (token) =>
  apiClient.get("/main", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });