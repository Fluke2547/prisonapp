//prison-visit-app/app/visitor/index.js
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMainProfile } from "../../constants/api";
import { useTheme } from "../../hooks/useTheme";

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const items = [
    { id: 1, title: "ข้อมูลผู้ต้องขัง", icon: "users", iconLib: "Feather", to: "/visitor/inmate" },
    { id: 2, title: "จองคิวเยี่ยม", icon: "home-outline", iconLib: "Ionicons", to: "/visitor/booking" },
    { id: 3, title: "สถานะการจอง/ประวัติการจอง", icon: "check-square", iconLib: "Feather", to: "/visitor/status" },
    { id: 4, title: "วิดีโอคอลเยี่ยม", icon: "video", iconLib: "Feather", to: "/visitor/video-call" },
  ];

  const renderIcon = (iconLib, iconName, size, color) => {
    if (iconLib === "Feather") {
      return <Feather name={iconName} size={size} color={color} />;
    } else if (iconLib === "Ionicons") {
      return <Ionicons name={iconName} size={size} color={color} />;
    }
  };

  // แจ้งเตือนก่อนออกจากระบบ
  const handleLogout = () => {
    Alert.alert(
      "ยืนยันการออกจากระบบ",
      "คุณต้องการออกจากระบบใช่หรือไม่?",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ออกจากระบบ",
          style: "destructive",
          onPress: async () => {

            await AsyncStorage.removeItem("userToken");
            await AsyncStorage.removeItem("idCard");
            router.replace("/");
          },
        },
      ]
    );
  };

  useEffect(() => {
    const fetchMain = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          router.replace("/");
          return;
        }

        const res = await getMainProfile(token);
        const { id_card, fullname } = res.data.user || res.data.data || {};

        setUser({
          idCard: id_card,
          name: fullname,
        });
      } catch (error) {
        console.log("getMainProfile error:", error?.response || error);
      } finally {
        setLoading(false);
      }
    };
    fetchMain();
  }, []);

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBg} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.headerBg }]}>
        <View style={s.headerTop}>
          <View style={s.row}>
            <Ionicons name="home" size={24} color={theme.headerText} />
            <Text style={[s.headerTitle, { color: theme.headerText }]}>หน้าหลัก</Text>
          </View>
          <View style={s.row}>

            <TouchableOpacity
              style={{ marginRight: 12 }}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color={theme.headerText} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/visitor/notifications")}>
              <Ionicons name="notifications-outline" size={24} color={theme.headerText} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[s.userCard, { borderColor: theme.border }]}>
          <Text style={[s.userCardTitle, { color: theme.headerText }]}>ข้อมูลส่วนตัว</Text>
          <View style={[s.userBox, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            {loading ? (
              <ActivityIndicator color={theme.headerText} />
            ) : (
              <>
                <Text
                  style={[
                    s.userText,
                    {
                      color: theme.headerText,
                      flexShrink: 1,
                      flexWrap: "wrap"
                    }
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit={true}
                >
                  ชื่อ : {user?.name ?? "-"}
                </Text>
                <Text style={[s.userText, { color: theme.headerText }]}>
                  เลขบัตรประชาชน : {user?.idCard ?? "-"}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 20 }}
      >
        <View style={s.grid}>
          {items.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[s.card, { backgroundColor: theme.primary, borderColor: theme.border }]}
              onPress={() => router.push(m.to)}
              activeOpacity={0.8}
            >
              <View style={s.cardIcon}>
                {renderIcon(m.iconLib, m.icon, 32, "#fff")}
              </View>
              <Text style={[s.cardText, { color: "#fff" }]}>{m.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[s.bottom, { backgroundColor: theme.bottomBar }]}>
        <TouchableOpacity
          style={s.navItem}
          onPress={() => router.replace("/visitor")}
          activeOpacity={0.8}
        >
          <View style={s.activeBg}>
            <Ionicons name="home-outline" size={26} color={theme.accent} />
          </View>
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          style={s.navItem}
          onPress={() => router.replace("/visitor/settings")}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={s.navItem}
          onPress={() => router.replace("/visitor/profile")}
        >
          <Ionicons name="person-outline" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Help */}
        <TouchableOpacity
          style={s.navItem}
          onPress={() => router.replace("/visitor/help")}
        >
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 6,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 10,
  },
  userCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  userCardTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  userBox: {
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  userText: {
    lineHeight: 20,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  card: {
    width: "48%",
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    alignItems: "center",
    minHeight: 130,
    elevation: 5,
    borderWidth: 1,
  },
  cardIcon: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 50,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cardText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  bottom: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingBottom: 30,
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navItem: {
    flex: 1,
    padding: 8,
    borderRadius: 30,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBg: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
    elevation: 3,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});