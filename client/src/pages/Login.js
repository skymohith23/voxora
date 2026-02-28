import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInst from "../utils/api_native";

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const doLogin = async () => {
    try {
      const res = await axiosInst.post("/login", { email, password });
      if (res.data.access_token) {
        await AsyncStorage.setItem("userToken", res.data.access_token);
        navigation.replace("Dashboard");
      }
    } catch (e) {
      Alert.alert("Login Error", e.response?.data?.detail || "Could not connect to server");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.title}>Voxora</Text>
        <Text style={styles.subtitle}>AI-powered sign → text assistant</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={doLogin}>
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert("Coming Soon")}>
          <Text style={styles.footerText}>New here? <Text style={styles.underline}>Create account</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#130426", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "rgba(255, 255, 255, 0.05)", padding: 30, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center" },
  logo: { width: 100, height: 100, borderRadius: 15, marginBottom: 15 },
  title: { color: "white", fontSize: 32, fontWeight: "bold" },
  subtitle: { color: "#ccc", fontSize: 14, marginBottom: 25 },
  input: { w: "100%", backgroundColor: "rgba(255,255,255,0.08)", padding: 15, borderRadius: 12, color: "white", marginBottom: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  button: { width: "100%", backgroundColor: "#7c3aed", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 10 },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  footerText: { color: "#ccc", marginTop: 20, fontSize: 14 },
  underline: { textDecorationLine: "underline", color: "white" }
});