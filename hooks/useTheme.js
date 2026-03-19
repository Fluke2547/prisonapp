// hooks/useTheme.js
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// กำหนดชุดสีโหมดสว่าง
const lightTheme = {
  mode: "light",
  primary: "#722F37",
  primarySoft: "#A35A63", // เพิ่ม: สำหรับพื้นหลัง Avatar
  accent: "#F5A623",
  bg: "#F8F8F8",
  card: "#FFFFFF",
  border: "#E5E5E5",
  text: "#222222",
  subtext: "#666666",
  icon: "#666666",       // เพิ่ม: สีไอคอนทั่วไป
  sectionHeader: "#600F1E", // เพิ่ม: สีหัวข้อ
  headerBg: "#722F37",
  headerText: "#FFFFFF",
  bottomBar: "#722F37",
  inputBg: "#FFFFFF",
  statusBar: "light-content",
};

const darkTheme = {
  mode: "dark",
  primary: "#B36A75",
  primarySoft: "#501B22", // เพิ่ม
  accent: "#F5A623",
  bg: "#101010",
  card: "#1E1E1E",
  border: "#333333",
  text: "#F5F5F5",
  subtext: "#BBBBBB",
  icon: "#F5F5F5",        // เพิ่ม
  sectionHeader: "#F5A623", // เพิ่ม: ใช้สีส้มในโหมดมืดเพื่อให้เด่น
  headerBg: "#1E1E1E",
  headerText: "#FFFFFF",
  bottomBar: "#1E1E1E",
  inputBg: "#222222",
  statusBar: "light-content",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false);
    const [ready, setReady] = useState(false);

    // โหลดค่าจาก AsyncStorage ครั้งแรก
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const value = await AsyncStorage.getItem("appTheme");
                if (value === "dark") setIsDark(true);
            } catch (e) {
                console.log("load theme error:", e);
            } finally {
                setReady(true);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const next = !isDark;
        setIsDark(next);
        try {
            await AsyncStorage.setItem("appTheme", next ? "dark" : "light");
        } catch (e) {
            console.log("save theme error:", e);
        }
    };

    const theme = isDark ? darkTheme : lightTheme;

    if (!ready) return null; // โหลด theme ยังไม่เสร็จ ค่อยเรนเดอร์

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
}
