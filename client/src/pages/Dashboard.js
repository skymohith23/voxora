import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInst from "../utils/api_native";

export default function Dashboard({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await axiosInst.get("/me");
        setUser(res.data);
      } catch (e) {
        // If token is invalid, force logout
        handleLogout();
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    navigation.replace("Login");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome, {user?.name || "User"}</Text>
          <Text style={styles.subtitle}>Ready when you are — pick an action</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.profileBtn}>
          <Text style={styles.btnText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#FF3B30' }]} 
          onPress={() => navigation.navigate("EmergencyCall")}
        >
          <Text style={styles.cardTitle}>Emergency Call</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#7c3aed' }]} 
          onPress={() => navigation.navigate("EmergencyText")}
        >
          <Text style={styles.cardTitle}>Emergency Text</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.06)' }]} 
          onPress={() => navigation.navigate("Contacts")}
        >
          <Text style={styles.cardTitle}>Contacts</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#10b981' }]} 
          onPress={() => navigation.navigate("SignDetection")}
        >
          <Text style={styles.cardTitle}>Sign Detection</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#130426", padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 20 },
  welcome: { color: "white", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#ccc", fontSize: 14, marginTop: 5 },
  profileBtn: { backgroundColor: "rgba(255,255,255,0.1)", padding: 10, borderRadius: 10 },
  btnText: { color: "white" },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', height: 120, borderRadius: 20, padding: 20, justifyContent: 'center', marginBottom: 15, elevation: 5 },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  logoutBtn: { width: "100%", padding: 15, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 15, marginTop: 20, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: 'bold' }
});