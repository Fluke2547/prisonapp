//prison-visit-app/service/inmate.service.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../constants/api";

export const getInmateInfo = async () => {
  const token = await AsyncStorage.getItem("userToken");

  if (!token) {
    throw new Error("ไม่มีโทเค็นผู้ใช้");
  }

  const res = await apiClient.get("/inmate_info", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// ✅ [เพิ่มใหม่] ฟังก์ชันดึงข้อมูลรายคน
export const getInmateDetailById = async (id) => {
  const token = await AsyncStorage.getItem("userToken");
  
  if (!token) throw new Error("ไม่มีโทเค็นผู้ใช้");

  // เรียก GET /inmate_info/{id}
  const res = await apiClient.get(`/inmate_info/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data; 
};