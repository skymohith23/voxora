import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from "react-native";
import SignCameraNative from "../components/SignCamera.native";
import axiosInst from "../utils/api_native";

export default function EmergencyCall() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [recognizedMessage, setRecognizedMessage] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const res = await axiosInst.get("/emergency/contacts");
      // Mapping from your FastAPI structure
      const list = res.data.who_added_me || [];
      if (res.data.my_emergency_contact) list.unshift(res.data.my_emergency_contact);
      setContacts(list);
    } catch (e) {
      console.error(e);
    }
  };

  const startCall = () => {
    if (!selected) return Alert.alert("Required", "Please select a contact first.");
    setInCall(true);
  };

  return (
    <View style={styles.container}>
      {!inCall ? (
        <View style={styles.setupView}>
          <Text style={styles.title}>Select Contact</Text>
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => setSelected(item)}
                style={[styles.contactItem, selected?.id === item.id && styles.selectedItem]}
              >
                <Text style={styles.contactText}>{item.name} ({item.email})</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No emergency contacts found.</Text>}
          />
          <TouchableOpacity style={styles.callBtn} onPress={startCall}>
            <Text style={styles.callBtnText}>Start Emergency Call</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.callView}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Connected: {selected?.name}</Text>
          </View>

          <View style={styles.cameraContainer}>
            <SignCameraNative 
              onRecognizedText={(text) => setRecognizedMessage(prev => prev + " " + text)} 
            />
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.label}>Live Translation:</Text>
            <Text style={styles.messageText}>{recognizedMessage || "Waiting for signs..."}</Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.endBtn} onPress={() => setInCall(false)}>
              <Text style={styles.endText}>End Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.muteBtn}>
              <Text style={styles.btnText}>Mute</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#130426", padding: 15 },
  setupView: { flex: 1, paddingTop: 20 },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  contactItem: { padding: 15, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 10 },
  selectedItem: { backgroundColor: '#7c3aed' },
  contactText: { color: 'white' },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 20 },
  callBtn: { backgroundColor: '#FF3B30', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  callBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  callView: { flex: 1 },
  statusBadge: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, marginBottom: 10 },
  statusText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  cameraContainer: { flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: 'black' },
  messageBox: { padding: 15, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 15, marginTop: 15 },
  label: { color: '#ccc', fontSize: 12, marginBottom: 5 },
  messageText: { color: 'white', fontSize: 18, fontWeight: '500' },
  controls: { flexDirection: 'row', gap: 10, marginTop: 15 },
  endBtn: { flex: 2, backgroundColor: '#FF3B30', padding: 15, borderRadius: 12, alignItems: 'center' },
  muteBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white' },
  endText: { color: 'white', fontWeight: 'bold' }
});