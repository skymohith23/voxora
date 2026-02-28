import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Dashboard = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voxora Dashboard</Text>
      
      {/* 1. Emergency Call Button (Live Sign-to-Speech) */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: '#7c3aed' }]} 
        onPress={() => navigation.navigate('EmergencyCall')}
      >
        <Text style={styles.cardText}>📞 Emergency Live Call</Text>
      </TouchableOpacity>

      {/* 2. Emergency Text Button (Sign-to-SMS) */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: '#9333ea' }]} 
        onPress={() => navigation.navigate('EmergencyText')}
      >
        <Text style={styles.cardText}>💬 Emergency Message</Text>
      </TouchableOpacity>

      {/* 3. Profile Button */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.1)' }]} 
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.cardText}>👤 User Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#130426', padding: 20, justifyContent: 'center' },
  title: { color: 'white', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  card: { padding: 20, borderRadius: 15, marginBottom: 15, alignItems: 'center' },
  cardText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

export default Dashboard;