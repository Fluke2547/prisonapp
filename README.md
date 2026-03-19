# 🏢 Prison Visit Booking App (Frontend)

แอปพลิเคชันฝั่ง Frontend สำหรับระบบจองคิวและเข้าเยี่ยมผู้ต้องขังออนไลน์ผ่านวิดีโอคอล (WebRTC) พัฒนาด้วย [React Native (Expo)](https://expo.dev/)

## 📋 สิ่งที่ต้องเตรียม (Prerequisites)

ก่อนเริ่มต้นการติดตั้งและทดสอบระบบ กรุณาตรวจสอบให้แน่ใจว่าเครื่องคอมพิวเตอร์ของคุณมีเครื่องมือดังต่อไปนี้:

* **Node.js**: เวอร์ชัน 18 ขึ้นไป
* **Git**: สำหรับโคลนและดาวน์โหลดซอร์สโค้ด
* **Expo Go**: แอปพลิเคชันบนสมาร์ทโฟน (ดาวน์โหลดได้จาก App Store / Google Play) สำหรับรันแอปพลิเคชันบนอุปกรณ์จริง
* *(ทางเลือก)* **Android Studio / iOS Simulator**: หากต้องการรันทดสอบผ่านอีมูเลเตอร์บนคอมพิวเตอร์

## 🚀 วิธีการติดตั้งและใช้งาน (Getting Started)

### 1. การติดตั้งโปรเจกต์ (Project Setup)

เปิด Terminal และรันคำสั่งต่อไปนี้เพื่อดาวน์โหลดโปรเจกต์และติดตั้ง Packages ที่จำเป็น:

```bash
# โคลนโปรเจกต์ลงเครื่อง
git clone <ใส่ลิงก์-github-ของโปรเจกต์ตรงนี้>
cd prison-visit-app

# ติดตั้ง Dependencies ทั้งหมด
npm install
```

### 2. การรันแอปพลิเคชัน (Running the Application)

#### เริ่มต้นรันเซิร์ฟเวอร์ Metro Bundler:
ขั้นตอนแรก ให้รัน Metro dev server ก่อน

```bash
npx expo start
```
เมื่อเซิร์ฟเวอร์ทำงาน คุณสามารถเลือกวิธีทดสอบแอปได้ดังนี้:

*    ทดสอบบนอุปกรณ์จริง (Physical Device): เปิดแอป Expo Go บนมือถือ แล้วสแกน QR Code ที่ปรากฏบนหน้าจอ Terminal 
(คอมพิวเตอร์และโทรศัพท์มือถือต้องเชื่อมต่อ Wi-Fi วงเดียวกัน)
*    ทดสอบบน Android Emulator: กดปุ่ม a บน Terminal
*    ทดสอบบน iOS Simulator: กดปุ่ม i บน Terminal (สำหรับ macOS เท่านั้น)

## 📂โครงสร้างโปรเจกต์ (Project Structure)

*   `app/admin`: หน้าจอสำหรับเจ้าหน้าที่ (ดูตารางคิว, จัดการอุปกรณ์, อนุมัติ/ปฏิเสธคิว)
*   `app/visitor`: หน้าจอสำหรับญาติผู้ต้องขัง (จองคิว, ดูประวัติ, ตรวจสอบสถานะ)
*   `app/regis`: หน้าจอสำหรับเจ้าหน้าที่ประจำจุดรับเยี่ยม (ระบบ WebRTC)
*   `components/`: UI Components ที่ถูกเรียกใช้งานซ้ำในหลายๆ หน้าจอ
*   `service/`: รวบรวมฟังก์ชันสำหรับการเรียกใช้งาน API (แยกตามส่วนผู้ใช้งาน)
*   `constants`: เก็บค่าตัวแปรคงที่ระดับ Global เช่น ธีมสี (Colors), ค่า Config ต่างๆ

## 🛠 เทคโนโลยีที่ใช้ (Tech Stack)

*   **Framework**: React Native 0.81.5
*   **Navigation**: Expo Router (File-based routing)
*   **Networking**: Axios, WebRTC (สำหรับการสนทนาวิดีโอ)
*   **Icons**: React Native Vector Icons (Ionicons, MaterialCommunityIcons)
*   **Storage**: AsyncStorage (สำหรับจัดเก็บ Token และข้อมูลผู้ใช้ชั่วคราว)

## ⚙️ การตั้งค่าระบบ (Configuration)

### การตั้งค่า API Base URL
ระบบจะเรียกใช้งาน API จากเซิร์ฟเวอร์ Backend ผ่านตัวแปร Environment ให้ทำการสร้างไฟล์ .env ไว้ที่โฟลเดอร์หลักของโปรเจกต์ (ระดับเดียวกับ package.json) และตั้งค่าดังนี้:

| Environment        | Base URL                             |
|--------------------|--------------------------------------|
| **Production Server**     | `https://prison-visit-booking.duckdns.org`  |
| **Production Server** | `http://<IP-ของคอมพิวเตอร์>:3000`            |
| **Physical Device** | `http://<your-computer-ip>:3000`   |

## 📝 วิธีแก้ปัญหาเบื้องต้น (Troubleshooting)

*   แอปค้างหรือโหลดข้อมูลไม่ขึ้น: อาจเกิดจากแคชค้าง ให้หยุดการทำงานเก่า (กด Ctrl + C) แล้วล้างแคชด้วยคำสั่ง npx expo start --clear
*   มือถือสแกน QR Code แล้วไม่เชื่อมต่อ (Network Error): ตรวจสอบให้แน่ใจว่าคอมพิวเตอร์และมือถือเชื่อมต่อเครือข่าย Wi-Fi เดียวกัน และไม่ได้เปิดใช้งาน VPN อยู่
*   หาตัวแปร API ไม่เจอ: หากเพิ่งแก้ไขไฟล์ .env จะต้องทำการรีสตาร์ทเซิร์ฟเวอร์ (Expo) ใหม่ทุกครั้ง เพื่อให้ระบบอ่านค่าอัปเดต
