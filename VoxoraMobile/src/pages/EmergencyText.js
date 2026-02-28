import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axiosInst from "../utils/api_native";
import SignCameraNative from '../components/SignCamera.native';

export default function EmergencyText({ navigation }) {
  // --- State Management ---
  const [detectedSign, setDetectedSign] = useState("");
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(true); // Control camera mounting

  // --- Data Loading ---
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await axiosInst.get("/emergency/contacts");
        setContacts(res.data?.who_added_me || []);
      } catch (e) {
        console.error("Load failed", e);
      }
    };
    loadContacts();

    // Cleanup when leaving screen
    return () => setIsCameraActive(false);
  }, []);

  // --- Handlers ---
  const handleSafeBack = useCallback(() => {
    setIsCameraActive(false); // Kill camera instance first
    setTimeout(() => {
      navigation.goBack();
    }, 200); // Wait for hardware release
  }, [navigation]);

  const sendText = async () => {
    if (!selectedContact || !detectedSign) {
      return Alert.alert("Error", "Select a contact and detect a sign first.");
    }

    try {
      await axiosInst.post("/emergency/send-text", {
        to_user: selectedContact,
        message: `EMERGENCY MSG: ${detectedSign}`
      });

      // Show alert after giving the UI a small breather
      setTimeout(() => {
        Alert.alert("Success", "Message Sent!", [
          { text: "OK", onPress: handleSafeBack }
        ]);
      }, 100);

    } catch (e) {
      Alert.alert("Failed", "Network Error");
    }
  };

  // --- Render ---
  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSafeBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Text</Text>
        <View style={{ width: 50 }} /> 
      </View>

      {/* AI Camera Section with Unmount Guard */}
      <View style={styles.cameraWrapper}>
        {isCameraActive ? (
          <SignCameraNative onRecognizedText={(sign) => setDetectedSign(sign)} />
        ) : (
          <View style={styles.placeholder}>
            <ActivityIndicator color="#7c3aed" />
          </View>
        )}
      </View>

      {/* Control Panel */}
      <View style={styles.bottomSheet}>
        <Text style={styles.label}>Recipient Contact:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedContact}
            onValueChange={(val) => setSelectedContact(val)}
            dropdownIconColor="white"
            style={styles.picker}
          >
            <Picker.Item label="Select Contact" value="" color="#666" />
            {contacts.map(c => (
              <Picker.Item key={c.id} label={c.name} value={c.email} color="white" />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Sign Detection Preview:</Text>
        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>
            {detectedSign || "No sign detected..."}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.btn, !detectedSign && styles.btnDisabled]} 
          onPress={sendText}
          disabled={!detectedSign}
        >
          <Text style={styles.btnText}>Send Text Alert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 50, 
    paddingHorizontal: 20, 
    paddingBottom: 20 
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  backText: { color: '#7c3aed', fontSize: 16, fontWeight: 'bold' },
  cameraWrapper: { flex: 1, overflow: 'hidden' },
  placeholder: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  bottomSheet: { 
    backgroundColor: '#130426', 
    padding: 25, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    elevation: 10 
  },
  label: { color: '#888', fontSize: 14, marginBottom: 8 },
  pickerContainer: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 12, 
    marginBottom: 20 
  },
  picker: { color: 'white' },
  previewContainer: { 
    padding: 15, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 12, 
    marginBottom: 25 
  },
  previewText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  btn: { 
    backgroundColor: '#7c3aed', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center',
    shadowColor: "#7c3aed",
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  btnDisabled: { backgroundColor: '#444' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});