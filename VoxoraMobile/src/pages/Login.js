import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../utils/api_native'; 

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please enter email and password");
    }

    try {
      console.log("Attempting login for:", email);
      
      // Send cleaned data to match app.py expectations
      const res = await loginUser(email.toLowerCase().trim(), password);
      console.log("Raw Response:", res);

      const data = res.data; 

      if (data && data.userExists) {
        // Save Token
        if (data.access_token) {
          await AsyncStorage.setItem('userToken', data.access_token);
        }
        
        // Use .trim(), NOT .strip() to avoid crash
        await AsyncStorage.setItem('user', JSON.stringify({ email: email.toLowerCase().trim() })); 
        
        console.log("✅ Success! Navigating to Dashboard...");
        navigation.replace('Dashboard');
      } else {
        Alert.alert("Login Failed", "User not found in database.");
      }
    } catch (error) {
      console.error("❌ Login Error:", error);
      Alert.alert("Login Error", "Invalid credentials or server error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voxora Hub v2</Text>
      
      <TextInput 
        placeholder="Email" 
        placeholderTextColor="#aaa"
        style={styles.input} 
        onChangeText={setEmail} 
        value={email}
        keyboardType="email-address" 
        autoCapitalize="none"
      />
      
      <TextInput 
        placeholder="Password" 
        placeholderTextColor="#aaa"
        style={styles.input} 
        secureTextEntry 
        onChangeText={setPassword} 
        value={password}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{ marginTop: 20 }} 
        onPress={() => navigation.navigate('Register')}
      >       
        <Text style={{ color: '#7c3aed', fontWeight: 'bold' }}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#130426', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  input: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#6200ee', padding: 18, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default LoginScreen;