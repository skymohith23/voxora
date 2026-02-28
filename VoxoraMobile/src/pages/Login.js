import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../utils/api_native'; // Import your helper

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await loginUser(email, password);
      // Save the token exactly where api_native.js expects it
      await AsyncStorage.setItem('userToken', res.data.access_token);
      // Save user details for EmergencyText.js
      await AsyncStorage.setItem('user', JSON.stringify({ email })); 
      
      navigation.replace('Dashboard');
    } catch (error) {
      Alert.alert("Login Failed", "Invalid email or password");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voxora Login</Text>
      <TextInput 
        placeholder="Email" placeholderTextColor="#aaa"
        style={styles.input} onChangeText={setEmail} value={email}
      />
      <TextInput 
        placeholder="Password" placeholderTextColor="#aaa"
        style={styles.input} secureTextEntry onChangeText={setPassword} value={password}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate('Register')}>       
        <Text style={{ color: '#7c3aed', fontWeight: 'bold' }}>
          Don't have an account? Sign Up
        </Text>
</TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#130426', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: 'white', fontSize: 24, marginBottom: 20 },
  input: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#6200ee', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' }
});

export default LoginScreen;