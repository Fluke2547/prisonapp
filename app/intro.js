//prison-visit-app/app/intro.js
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const C = { primary: "#722F37", text: "#333" };

export default function IntroScreen() {
    const router = useRouter();

    return (
        <View style={s.container}>
            <Text style={s.title}>ยินดีต้อนรับเข้าสู่ระบบจองคิวเยี่ยมผู้ต้องขัง</Text>
            <Text style={s.text}>
                หน้านี้จะแสดงคำแนะนำการใช้งานคร่าว ๆ เช่น{`\n`}
                - เมนู "ข้อมูลผู้ต้องขัง"{`\n`}
                - เมนู "จองคิวเยี่ยม"{`\n`}
                - เมนู "สถานะการจอง"{`\n`}
                - เมนู "วิดีโอคอลเยี่ยม"
            </Text>

            <TouchableOpacity
                style={s.btn}
                onPress={() => router.replace("/")}
            >
                <Text style={s.btnText}>เริ่มใช้งาน</Text>
            </TouchableOpacity>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: C.text,
        textAlign: "center",
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
        color: C.text,
        textAlign: "left",
        lineHeight: 22,
        marginBottom: 32,
    },
    btn: {
        backgroundColor: C.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    btnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
