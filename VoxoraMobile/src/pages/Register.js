import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { registerUser } from '../utils/api_native';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await registerUser({ email, name, password });
      Alert.alert("Success", "Account created! Please login.");
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert("Registration Failed", error.response?.data?.detail || "Error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Voxora Account</Text>
      <TextInput 
        placeholder="Full Name" placeholderTextColor="#aaa"
        style={styles.input} onChangeText={setName} value={name}
      />
      <TextInput 
        placeholder="Email" placeholderTextColor="#aaa"
        style={styles.input} onChangeText={setEmail} value={email}
      />
      <TextInput 
        placeholder="Password" placeholderTextColor="#aaa"
        style={styles.input} secureTextEntry onChangeText={setPassword} value={password}
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#130426', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: 'white', fontSize: 24, marginBottom: 20 },
  input: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#7c3aed', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' }
});

export default RegisterScreen;