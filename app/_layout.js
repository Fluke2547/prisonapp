//prison-visit-app/app/_layout.js
import { Stack } from "expo-router";
import { ThemeProvider } from "../hooks/useTheme";

// 🟢 เพิ่มโค้ดดักจับตรงนี้ครับ (มันจะทำงานครั้งเดียวตอนเปิดแอป)
if (!__DEV__) {
  console.log = () => { };
  console.warn = () => { };
  console.error = () => { };
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" options={{ title: "สมัครสมาชิก" }} />
        <Stack.Screen name="intro" options={{ title: "แนะนำการใช้งาน" }} />
        <Stack.Screen name="visitor/index" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
