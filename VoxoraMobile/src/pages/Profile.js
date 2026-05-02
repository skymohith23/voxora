import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  TextInput, Modal, Alert, ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInst from "../utils/api_native"; 

const Profile = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Updated loadContacts to pass your email
  const loadContacts = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) return;
      const parsed = JSON.parse(userData);
      const myEmail = parsed.email.toLowerCase().trim();

      // Pass user_email in the query string so the server knows whose list to get
      const res = await axiosInst.get(`/emergency/contacts?user_email=${myEmail}`);
      
      let list = res.data?.who_added_me || [];
      // Handle the extra property if returned by backend logic
      if (res.data?.my_emergency_contact) list.unshift(res.data.my_emergency_contact);
      
      setContacts(list);
      await AsyncStorage.setItem('emergency_contacts', JSON.stringify(list));
    } catch (e) {
      console.error("Failed to load contacts", e);
      // Fallback to local storage if offline
      const saved = await AsyncStorage.getItem('emergency_contacts');
      if (saved) setContacts(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // 2. Updated handleAddContact to send both emails
  const handleAddContact = async () => {
    if (!emailInput.trim()) return Alert.alert("Error", "Please enter an email address.");
    
    setLoading(true);
    try {
      // Get your email from storage
      const userData = await AsyncStorage.getItem("user");
      const parsed = JSON.parse(userData);
      const myEmail = parsed.email.toLowerCase().trim();

      const response = await axiosInst.post("/emergency/contacts", { 
        user_email: myEmail, // Crucial: Tells the server WHO is adding the contact
        contact_email: emailInput.toLowerCase().trim() 
      });

      if (response.data.status === "success" || response.status === 201) {
        Alert.alert("Success", "Emergency contact added successfully!");
        setEmailInput("");
        setIsModalVisible(false);
        loadContacts(); // Refresh the list
      }
    } catch (e) {
      // Improved error message handling to show server-side verification errors
      const errorMsg = e.response?.data?.error || "User not found in Voxora. Please check the email ID.";
      Alert.alert("Verification Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>U</Text>
        </View>
        <Text style={styles.name}>User Profile</Text>
      </View>

      <View style={styles.contactSection}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity style={styles.addIconBtn} onPress={() => setIsModalVisible(true)}>
                <Text style={styles.addIconText}>+ ADD</Text>
            </TouchableOpacity>
        </View>

        <FlatList
          data={contacts}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.contactItem}>
              <View>
                <Text style={styles.contactName}>{item.name || "Voxora User"}</Text>
                <Text style={styles.contactEmail}>{item.email || item.id}</Text>
              </View>
              <Text style={styles.statusBadge}>Verified</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No contacts added yet.</Text>
          }
        />
      </View>

      {/* ADD CONTACT MODAL */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            <Text style={styles.modalSub}>Verify user by their Voxora Email ID</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter user email"
              placeholderTextColor="#666"
              value={emailInput}
              onChangeText={setEmailInput}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.cancelBtn]} 
                  onPress={() => setIsModalVisible(false)}
                >
                    <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.confirmBtn]} 
                  onPress={handleAddContact}
                  disabled={loading}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Verify & Add</Text>}
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#130426', padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  avatarPlaceholder: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', marginBottom: 10 
  },
  avatarLetter: { color: 'white', fontSize: 30, fontWeight: 'bold' },
  name: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  contactSection: { flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  addIconBtn: { backgroundColor: 'rgba(124, 58, 237, 0.2)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  addIconText: { color: '#7c3aed', fontWeight: 'bold', fontSize: 12 },
  contactItem: { 
    backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 15, 
    marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
  },
  contactName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  contactEmail: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  statusBadge: { color: '#4ade80', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e1033', borderRadius: 25, padding: 25, elevation: 5 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  modalSub: { color: '#aaa', fontSize: 12, marginBottom: 20 },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, 
    padding: 15, color: 'white', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#7c3aed' 
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 0.48, padding: 15, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.1)' },
  confirmBtn: { backgroundColor: '#7c3aed' },
  btnText: { color: 'white', fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#FF3B30', padding: 15, borderRadius: 12, marginBottom: 30, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: 'bold' }
});

export default Profile;