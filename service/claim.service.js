// ไฟล์: service/claim.service.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../constants/api"; 

// 🟢 ฟังก์ชันส่งคำขอผูกความสัมพันธ์ (เปลี่ยนมารับ firstname, lastname แล้ว)
export const submitClaimRequest = async (firstname, lastname, relation, idCardUri, selfieUri) => {
    const token = await AsyncStorage.getItem("userToken"); 

    const formData = new FormData();
    
    // 1️⃣ แนบข้อมูลตัวอักษร
    formData.append("firstname", firstname); 
    formData.append("lastname", lastname);
    formData.append("relation", relation); // หรือถ้า Backend ลูกพี่ใช้คำว่า relationship ให้เปลี่ยนตรงนี้นะครับ

    // 2️⃣ แนบรูปบัตรประชาชน
    if (idCardUri) {
        let filename = idCardUri.split('/').pop() || "id_card.jpg";
        // ดึงนามสกุลไฟล์ออกมาให้ถูกต้อง (เช่น image/png, image/jpeg)
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("id_card_image", {
            uri: idCardUri,
            name: filename,
            type: type,
        });
    }

    // 3️⃣ แนบรูปเซลฟี่
    if (selfieUri) {
        let filename = selfieUri.split('/').pop() || "selfie.jpg";
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("selfie_image", {
            uri: selfieUri,
            name: filename,
            type: type,
        });
    }

    // 4️⃣ ยิง API
    const response = await apiClient.post('/user/claim-inmate', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.data;
};