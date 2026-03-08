import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  TextInput, 
  PermissionsAndroid, 
  Platform,
  Linking 
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';
import SignCameraNative from "../components/SignCamera.native";
import axiosInst from "../utils/api_native";

export default function EmergencyCall({ navigation }) {
  // --- State Variables ---
  const [toEmail, setToEmail] = useState("");
  const [word, setWord] = useState("");
  const [contacts, setContacts] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // --- Refs ---
  const socket = useRef(null);

  // --- Permissions Handler ---
  const requestEmergencyPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
        ]);
        
        const isCallGranted = granted['android.permission.CALL_PHONE'] === PermissionsAndroid.RESULTS.GRANTED;
        const isSmsGranted = granted['android.permission.SEND_SMS'] === PermissionsAndroid.RESULTS.GRANTED;

        if (!isCallGranted || !isSmsGranted) {
          Alert.alert(
            "Permissions Required",
            "Emergency features require Call and SMS permissions to function correctly."
          );
        }
      } catch (err) {
        console.warn("Permission Error:", err);
      }
    }
  };

  // --- Data Loading ---
  const loadData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const user = JSON.parse(storedUser || "{}");
      setUserEmail(user.email);

      const res = await axiosInst.get("/emergency/contacts");
      let list = res.data?.who_added_me || [];
      
      if (res.data?.my_emergency_contact) {
        list.unshift(res.data.my_emergency_contact);
      }
      
      setContacts(list);

      if (list.length > 0) {
        const firstContact = list[0];
        setToEmail(firstContact?.id || firstContact?.email || "");
      }
    } catch (e) {
      console.error("Failed to load contacts", e);
    }
  };

  useEffect(() => {
    requestEmergencyPermissions();
    loadData();

    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);

    return () => {
      if (socket.current) socket.current.close();
      Tts.stop();
    };
  }, []);

  useEffect(() => {
    if (userEmail) {
      const wsUrl = `ws://192.168.1.4:8000/ws/call/${userEmail}`;
      socket.current = new WebSocket(wsUrl);

      socket.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "voice_broadcast") {
          Tts.speak(data.content);
        }
      };

      socket.current.onerror = (e) => console.log("WS Error:", e.message);
    }
  }, [userEmail]);

  // --- Handlers ---
  const handleSafeBack = () => {
    if (socket.current) socket.current.close();
    Tts.stop();
    setTimeout(() => {
      navigation.goBack();
    }, 150);
  };

  const makePhoneCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Error", "This contact does not have a phone number saved.");
    }
  };

  const broadcastLiveSign = (text) => {
    const isSocketReady = socket.current && socket.current.readyState === WebSocket.OPEN;
    if (isSocketReady && toEmail) {
      socket.current.send(JSON.stringify({
        to_user: toEmail,
        text: text
      }));
    }
  };

  const handleAddContact = async () => {
    if (!newEmail) return Alert.alert("Error", "Please fill the email");
    try {
      await axiosInst.post("/emergency/contacts", { contact_email: newEmail });
      Alert.alert("Success", "Contact added!");
      setNewEmail("");
      loadData();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.detail || "Check backend connection");
    }
  };

  const handleRecognizedText = useCallback((newText) => {
    setWord(prev => prev === "" ? newText : `${prev} ${newText}`);
    broadcastLiveSign(newText);
  }, [toEmail]);

  const sendText = async () => {
    if (!toEmail) return Alert.alert("Error", "Select a contact");
    
    const selectedContact = contacts.find(c => (c.id === toEmail || c.email === toEmail));

    try {
      if (word.trim()) {
        await axiosInst.post("/emergency/send-text", {
          to_user: toEmail,
          message: word.trim()
        });
      }
      
      Alert.alert(
        "Emergency Action", 
        "Transcript sent. Would you like to place the call now?", 
        [
          { text: "Cancel", style: "cancel", onPress: handleSafeBack },
          { 
            text: "CALL NOW", 
            onPress: () => {
              makePhoneCall(selectedContact?.phone_number || selectedContact?.phone);
            } 
          }
        ]
      );
      
      setWord("");
    } catch (e) {
      Alert.alert("Failed", "Network Error: Could not send transcript, but you can still call.");
      makePhoneCall(selectedContact?.phone_number || selectedContact?.phone);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#130426" }}> 
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Call</Text>
          <TouchableOpacity onPress={handleSafeBack}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cameraContainer}>
          <SignCameraNative onRecognizedText={handleRecognizedText} />
        </View>
      </View>

      <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.form}>
          <View style={styles.addContactSection}>
            <Text style={styles.label}>Quick Add Contact (Email):</Text>
            <TextInput
              placeholder="User Email"
              placeholderTextColor="#666"
              style={styles.input}
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddContact}>
              <Text style={styles.boldWhite}>+ Add to List</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Connected To (Call):</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={toEmail}
              onValueChange={(val) => setToEmail(val)}
              style={styles.picker}
              dropdownIconColor="white"
            >
              <Picker.Item label="Select Contact" value="" />
              {contacts?.map((c, index) => (
                <Picker.Item
                  key={c?.id || c?.email || index.toString()}
                  label={`${c?.name || 'User'}`}
                  value={c?.id || c?.email || ""}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>AI Voice Broadcast Preview:</Text>
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>{word || "Waiting for signs..."}</Text>
          </View>

          <TouchableOpacity style={styles.clearBtn} onPress={() => setWord("")}>
            <Text style={styles.clearText}>Clear Call Transcript</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sendBtn} onPress={sendText}>
            <Text style={styles.sendText}>End Call / Send Transcript</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fixedHeader: { padding: 20, backgroundColor: "#130426" },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  cancelText: { color: '#ff4444', fontWeight: 'bold' },
  cameraContainer: { height: 300, backgroundColor: 'black', borderRadius: 20, overflow: 'hidden' },
  formScroll: { flex: 1, paddingHorizontal: 20 },
  form: { marginTop: 10 },
  addContactSection: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 15, marginBottom: 20 },
  input: { borderBottomWidth: 1, borderBottomColor: '#7c3aed', color: 'white', marginBottom: 10, padding: 5 },
  addBtn: { backgroundColor: '#7c3aed', padding: 10, borderRadius: 8, alignItems: 'center' },
  boldWhite: { color: 'white', fontWeight: 'bold' },
  label: { color: '#aaa', fontSize: 14, marginBottom: 5 },
  pickerWrapper: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, marginBottom: 20 },
  picker: { color: 'white' },
  previewBox: { padding: 15, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 15, minHeight: 80 },
  previewText: { color: 'white', fontSize: 18 },
  clearBtn: { alignSelf: 'flex-end', marginTop: 10 },
  clearText: { color: '#7c3aed', fontWeight: '600' },
  sendBtn: { backgroundColor: '#7c3aed', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  sendText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});