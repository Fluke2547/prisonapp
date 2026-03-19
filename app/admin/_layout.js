// app/admin/_layout.js
import { Stack, useRouter, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {

      const token = await AsyncStorage.getItem("userToken"); // แก้ให้ตรงกับหน้า Login

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      setChecking(false);
      //console.log("admintoken:", token);
    };

    checkAdmin();
  }, [pathname]);

  if (checking && pathname !== "/admin/login") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
