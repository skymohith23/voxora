import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);

  // Load contacts from storage when the screen opens
  useEffect(() => {
    const loadContacts = async () => {
      const savedContacts = await AsyncStorage.getItem('emergency_contacts');
      if (savedContacts) {
        setContacts(JSON.parse(savedContacts));
      }
    };
    loadContacts();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear(); // Clears token and user data safely
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.name}>User Profile</Text>
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <FlatList
          data={contacts}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.contactItem}>
              <Text style={styles.contactText}>{item.name}: {item.phone}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No contacts added yet.</Text>
          }
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#130426', padding: 20 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  name: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  contactSection: { flex: 1 },
  sectionTitle: { color: '#7c3aed', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  contactItem: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10, marginBottom: 10 },
  contactText: { color: 'white', fontSize: 16 },
  emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 20 },
  logoutBtn: { backgroundColor: '#FF3B30', padding: 15, borderRadius: 12, marginBottom: 30, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: 'bold' }
});

export default Profile;