// prison-visit-app/app/register.js
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal // 🟢 1. เพิ่ม Modal เข้ามา
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { checkIdCard, registerUser } from "../constants/api";

const C = {
  primary: "#722F37",
  text: "#222",
  subtext: "#555",
  border: "#D9D9D9",
  bg: "#FFFFFF",
};

// map คำนำหน้า -> id ตามฐานข้อมูล
const PREFIX_MAP = {
  "นาย": "1",
  "นาง": "2",
  "นางสาว": "3",
  "เด็กหญิง": "4",
  "เด็กชาย": "5",
};

export default function Register() {
  const router = useRouter();

  // step: 1 = กรอกเลขบัตร, 2 = แบบฟอร์มเต็ม
  const [step, setStep] = useState(1);

  // ฟิลด์ทั้งหมด
  const [cid, setCid] = useState("");
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [agreeDisclosure, setAgreeDisclosure] = useState(true);
  
  // 🟢 2. เพิ่ม State สำหรับเปิด/ปิด Popup เลือกคำนำหน้า
  const [showPrefixModal, setShowPrefixModal] = useState(false);

  // ตรวจความยาว/รูปแบบต่าง ๆ
  const isValidCid = (v) => /^\d{13}$/.test(v);
  const isValidPwd = (v) =>
    typeof v === "string" && v.length >= 8 && v.length <= 50;

  // STEP 1: เช็คเลขบัตรกับ backend
  const goNextFromStep1 = async () => {
    if (!isValidCid(cid)) {
      return Alert.alert("ข้อมูลไม่ถูกต้อง", "กรุณากรอกเลขบัตรประชาชน 13 หลัก");
    }

    try {
      const res = await checkIdCard(cid);
      console.log("check-idcard res:", res.data);

      if (res.data?.message === "ID card นี้สามารถใช้ได้" || res.status === 200) {
        setFirstName("");
        setLastName("");
        setTitle("");

        setStep(2);
      } else {
        Alert.alert("ไม่สามารถใช้เลขบัตรนี้", res.data?.message || "เลขบัตรนี้มีในระบบแล้ว");
      }
    } catch (error) {
      const data = error?.response?.data;
      console.log("check-idcard error:", data || error.message);

      Alert.alert("ข้อผิดพลาด", data?.message || "ไม่สามารถตรวจสอบเลขบัตรได้ หรือเลขบัตรนี้อาจมีในระบบแล้ว");
    }
  };

  // STEP 2: สมัครสมาชิก (เรียก /register)
  const onSubmit = async () => {
    if (!title || !firstName || !lastName || !phone || !pwd || !confirm) {
      return Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
    }

    if (!isValidPwd(pwd)) {
      return Alert.alert("รหัสผ่านไม่ถูกต้อง", "ความยาวรหัสผ่านอย่างน้อย 8 ตัวอักษร และไม่เกิน 50 ตัวอักษร");
    }

    if (pwd !== confirm) {
      return Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณาตรวจสอบรหัสผ่านอีกครั้ง");
    }

    if (!agreePrivacy || !agreeDisclosure) {
      return Alert.alert("กรุณายืนยันเงื่อนไข", "กรุณาติ๊กยอมรับเงื่อนไขทั้งสองข้อ");
    }

    const prefixeId = PREFIX_MAP[title.trim()];
    if (!prefixeId) {
      return Alert.alert("คำนำหน้าไม่ถูกต้อง", "กรุณาเลือกคำนำหน้า");
    }

    try {
      const payload = {
        id_card: cid,
        prefixe: title.trim(),
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        phone: phone.trim(),
        password: pwd,
      };

      const res = await registerUser(payload);
      console.log("register res:", res.data);

      Alert.alert("สำเร็จ", "สมัครสมาชิกเรียบร้อย", [
        { text: "ตกลง", onPress: () => router.replace("/") },
      ]);
    } catch (error) {
      const data = error?.response?.data;
      console.log("register error:", data || error.message);
      const msg = data?.message || "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง";
      Alert.alert("สมัครสมาชิกไม่สำเร็จ", msg);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => (step === 1 ? router.back() : setStep(1))}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={s.headercenter}>
          <Text style={s.headerTitle}>สมัครสมาชิก</Text>
          <Text style={s.headerSub}>กรอกข้อมูลเพื่อทำการลงทะเบียน</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {step === 1 ? (
          <ScrollView contentContainerStyle={s.step1Wrap} keyboardShouldPersistTaps="handled">
            <Text style={s.hintCenter}>
              กรุณากรอก{"\n"}
              <Text style={{ fontWeight: "700" }}>เลขบัตรประจำตัวประชาชนของท่าน</Text>
            </Text>

            <TextInput
              style={s.input}
              placeholder="เลขบัตรประชาชน 13 หลัก"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={13}
              value={cid}
              onChangeText={setCid}
            />

            <TouchableOpacity style={[s.btn, { marginTop: 16 }]} onPress={goNextFromStep1}>
              <Text style={s.btnText}>ถัดไป</Text>
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.line} />
              <Text style={s.orText}>หรือ</Text>
              <View style={s.line} />
            </View>

            <Text style={{ color: C.subtext, textAlign: "center" }}>
              หากมีบัญชีอยู่แล้ว{" "}
              <Link href="/" style={{ color: C.primary, fontWeight: "600" }}>เข้าสู่ระบบ</Link>
            </Text>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={s.formWrap}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.label}>เลขบัตรประจำตัวประชาชน</Text>
            <TextInput style={[s.input, { backgroundColor: "#F5F5F5" }]} value={cid} editable={false} />

            <Text style={s.label}>คำนำหน้า</Text>
            {/* 🟢 3. เปลี่ยนจาก TextInput เป็น TouchableOpacity เพื่อเปิด Modal */}
            <TouchableOpacity 
              style={[s.input, { justifyContent: "center" }]} 
              activeOpacity={0.7}
              onPress={() => setShowPrefixModal(true)}
            >
              <Text style={{ color: title ? "#333" : "#999", fontSize: 16 }}>
                {title ? title : "เลือกคำนำหน้า"}
              </Text>
            </TouchableOpacity>

            <Text style={s.label}>ชื่อ</Text>
            <TextInput style={s.input} placeholder="ชื่อจริง" placeholderTextColor="#999" value={firstName} onChangeText={setFirstName} />

            <Text style={s.label}>นามสกุล</Text>
            <TextInput style={s.input} placeholder="นามสกุล" placeholderTextColor="#999" value={lastName} onChangeText={setLastName} />

            <Text style={s.label}>เบอร์โทรศัพท์</Text>
            <TextInput style={s.input} placeholder="เช่น 0812345678" placeholderTextColor="#999" keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} />

            <Text style={s.label}>รหัสผ่าน</Text>
            <TextInput style={s.input} placeholder="อย่างน้อย 8 ตัวอักษร" placeholderTextColor="#999" secureTextEntry value={pwd} onChangeText={setPwd} />
            <Text style={s.note}>(ต้องตั้งให้มีความยาวอย่างน้อย 8 ตัวอักษรขึ้นไป ต้องไม่เกิน 50 ตัวอักษร)</Text>

            <Text style={s.label}>ยืนยันรหัสผ่าน</Text>
            <TextInput style={s.input} placeholder="พิมพ์รหัสผ่านอีกครั้ง" placeholderTextColor="#999" secureTextEntry value={confirm} onChangeText={setConfirm} />

            <TouchableOpacity style={s.checkRow} onPress={() => setAgreePrivacy((v) => !v)} activeOpacity={0.7}>
              <View style={[s.checkbox, agreePrivacy && s.checkboxChecked]}>
                {agreePrivacy && <Text style={{ color: "#fff", fontWeight: "700" }}>✓</Text>}
              </View>
              <Text style={s.checkText}>เงื่อนไขความเป็นส่วนตัว</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.checkRow} onPress={() => setAgreeDisclosure((v) => !v)} activeOpacity={0.7}>
              <View style={[s.checkbox, agreeDisclosure && s.checkboxChecked]}>
                {agreeDisclosure && <Text style={{ color: "#fff", fontWeight: "700" }}>✓</Text>}
              </View>
              <Text style={s.checkText}>ยินยอมเปิดเผยข้อมูล</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.btn, { marginTop: 15 }]} onPress={onSubmit}>
              <Text style={s.btnText}>ถัดไป</Text>
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.line} />
              <Text style={s.orText}>หรือ</Text>
              <View style={s.line} />
            </View>

            <Text style={{ color: C.subtext, textAlign: "center", marginBottom: 24 }}>
              หากมีบัญชีชื่ออยู่แล้ว{" "}
              <Link href="/" style={{ color: C.primary, fontWeight: "600" }}>เข้าสู่ระบบ</Link>
            </Text>

          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* 🟢 4. สร้าง Modal สำหรับเป็น Popup เลือกคำนำหน้า */}
      <Modal
        visible={showPrefixModal}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity 
          style={s.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPrefixModal(false)}
        >
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>เลือกคำนำหน้า</Text>
            {Object.keys(PREFIX_MAP).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={s.modalItem}
                onPress={() => {
                  setTitle(item); // บันทึกคำนำหน้าที่เลือก
                  setShowPrefixModal(false); // ปิด Modal
                }}
              >
                <Text style={s.modalItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: C.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 16,
    bottom: 12,
    padding: 5,
    zIndex: 10
  },
  headercenter: {
    alignItems: "center"
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18
  },
  headerSub: {
    color: "#F3E8EA",
    fontSize: 12,
    marginTop: 2
  },

  step1Wrap: {
    padding: 20,
    paddingTop: 28,
    flexGrow: 1,
    justifyContent: "center"
  },
  hintCenter: {
    textAlign: "center",
    color: C.text,
    marginBottom: 16,
    lineHeight: 22
  },

  formWrap: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 150
  },

  label: {
    color: C.text,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10
  },
  note: {
    color: C.subtext,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 6
  },

  input: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#fff",
    color: "#333",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 16,
    marginBottom: 8,
  },

  btn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E6E6E6"
  },
  orText: {
    marginHorizontal: 12,
    color: C.subtext
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  checkText: { color: C.text },

  // 🟢 5. สไตล์เพิ่มเติมสำหรับ Popup (Modal)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.primary,
    textAlign: "center",
    marginBottom: 15,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemText: {
    fontSize: 16,
    color: C.text,
    textAlign: "center",
  },
});