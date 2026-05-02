import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Alert, TextInput, KeyboardAvoidingView, Platform 
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';
import SignCameraNative from "../components/SignCamera.native";
import axiosInst, { API_BASE } from "../utils/api_native";

export default function EmergencyText({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null); 
  const [currentSentence, setCurrentSentence] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); 
  const [myEmail, setMyEmail] = useState(""); 
  
  const socketRef = useRef(null);
  const scrollViewRef = useRef();

  // Emergency Shortcuts
  const quickActions = ["HELP!", "DANGER", "MEDICAL", "POLICE", "FIRE"];

  // --- 1. Load Personal Data & Initial Contacts ---
  useEffect(() => { 
    const initializeData = async () => {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsed = JSON.parse(userData);
        const email = parsed.email.toLowerCase().trim();
        setMyEmail(email);
        loadContacts(email); 
        setupWebSocket(email);
      }
    };
    initializeData();

    // Initialize TTS
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);

    return () => {
      if (socketRef.current) socketRef.current.close();
      Tts.stop();
    };
  }, []);

  // --- 2. WebSocket Setup for Voice Relay ---
  const setupWebSocket = (email) => {
    const wsUrl = `${API_BASE.replace('http', 'ws')}/ws/call/${email}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "voice_broadcast") {
        console.log("🔊 Incoming Voice Content:", data.content);
        Tts.speak(data.content); // Speak incoming text messages
      }
    };

    socketRef.current.onerror = (e) => console.log("WS Error:", e.message);
  };

  // --- 3. Communication Logic ---
  const broadcastSignAsVoice = (text) => {
    if (socketRef.current?.readyState === WebSocket.OPEN && selectedContact) {
      socketRef.current.send(JSON.stringify({
        type: "voice_command",
        to_user: selectedContact.email.toLowerCase().trim(),
        text: text
      }));
    }
  };

  const handleQuickAction = (action) => {
    setCurrentSentence(action);
    broadcastSignAsVoice(action); // Broadcast to contact
    Tts.speak(action);            // Play locally for confirmation
  };

  const loadContacts = async (email) => {
    try {
      const res = await axiosInst.get(`/emergency/contacts?user_email=${email}`);
      let list = res.data?.who_added_me || [];
      const filteredList = list.filter(c => c.email.toLowerCase().trim() !== email);
      setContacts(filteredList);
    } catch (e) { 
      console.error("Contact load error", e); 
    }
  };

  const loadMessages = async (contact) => {
    if (!myEmail || !contact) return;
    try {
      const contactEmail = contact.email.toLowerCase().trim();
      const res = await axiosInst.get(`/emergency/get-messages?to_user=${contactEmail}&sender_email=${myEmail}`);
      setChatHistory(res.data);
    } catch (e) { 
      console.error("Message load error", e); 
    }
  };

  // Poll for messages every 3 seconds
  useEffect(() => {
    let interval;
    if (selectedContact && myEmail) {
        loadMessages(selectedContact);
        interval = setInterval(() => {
            loadMessages(selectedContact);
        }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [selectedContact, myEmail]);

  const sendTextMessage = async () => {
    if (!currentSentence.trim() || !selectedContact) return;
    try {
      const res = await axiosInst.post("/emergency/send-text", {
        sender_email: myEmail,
        to_user: selectedContact.email.toLowerCase().trim(),
        message: currentSentence.trim()
      });
      
      setChatHistory(prev => [...prev, res.data.message]);
      setCurrentSentence("");
      setIsCameraActive(false);
    } catch (e) { 
      Alert.alert("Error", "Message failed to send."); 
    }
  };

  const handleRecognizedText = useCallback((newText) => {
    setCurrentSentence(prev => prev + newText);
  }, []);

  // --- RENDER 1: CONTACT LIST ---
  if (!selectedContact) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Contacts</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.contactList}>
          {contacts.map((c, i) => (
            <TouchableOpacity key={i} style={styles.contactItem} onPress={() => setSelectedContact(c)}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{c.name ? c.name[0] : '?'}</Text></View>
              <View>
                <Text style={styles.contactName}>{c.name || 'User'}</Text>
                <Text style={styles.contactEmail}>{c.email}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {contacts.length === 0 && <Text style={styles.emptyHint}>No contacts verified yet.</Text>}
        </ScrollView>
      </View>
    );
  }

  // --- RENDER 2: CHAT INTERFACE ---
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedContact(null)}><Text style={styles.backLink}>←</Text></TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{selectedContact.name || 'Chat'}</Text>
          <Text style={styles.status}>Active Now</Text>
        </View>
        <TouchableOpacity style={styles.sosToggle} onPress={() => setIsCameraActive(!isCameraActive)}>
          <Text style={styles.sosToggleText}>{isCameraActive ? "⌨️ TEXT" : "📷 SIGN"}</Text>
        </TouchableOpacity>
      </View>

      {/* EMERGENCY BUTTONS BAR */}
      <View style={styles.quickBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickActions.map(action => (
            <TouchableOpacity key={action} style={styles.quickBtn} onPress={() => handleQuickAction(action)}>
              <Text style={styles.quickBtnText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        style={styles.chatArea}
      >
        {chatHistory.map((msg, i) => {
          const isMe = msg.sender.toLowerCase().trim() === myEmail;
          return (
            <View 
              key={i} 
              style={[
                styles.msgBubble, 
                isMe ? styles.myMsg : styles.theirMsg
              ]}
            >
              <Text style={styles.msgText}>{msg.text}</Text>
              <Text style={styles.msgTime}>{msg.time}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* CAMERA MODULE */}
      {isCameraActive && (
        <View style={styles.cameraOverlay}>
            <View style={styles.cameraBox}>
              <SignCameraNative 
                onRecognizedText={handleRecognizedText} 
                onBroadcastText={broadcastSignAsVoice} 
              />
            </View>
            <View style={styles.controls}>
                <TouchableOpacity style={styles.toolBtn} onPress={() => {
                  setCurrentSentence(prev => prev + " ");
                  broadcastSignAsVoice(" ");
                }}>
                  <Text style={styles.toolText}>SPACE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toolBtn, {backgroundColor: '#444'}]} onPress={() => setCurrentSentence("")}>
                  <Text style={styles.toolText}>CLEAR</Text>
                </TouchableOpacity>
            </View>
        </View>
      )}

      {/* INPUT BAR */}
      <View style={styles.inputArea}>
        <TextInput 
          style={styles.input} 
          placeholder="Type or sign..." 
          placeholderTextColor="#666" 
          value={currentSentence} 
          onChangeText={setCurrentSentence} 
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendTextMessage}>
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#130426" },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1033' },
  headerInfo: { flex: 1, marginLeft: 15 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  status: { color: '#4ade80', fontSize: 11 },
  backLink: { color: '#7c3aed', fontSize: 16, fontWeight: 'bold' },
  quickBar: { backgroundColor: '#1a1033', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  quickBtn: { backgroundColor: '#ff4444', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5 },
  quickBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  contactList: { flex: 1, padding: 15 },
  contactItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 15, marginBottom: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  contactName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  contactEmail: { color: '#aaa', fontSize: 12 },
  chatArea: { flex: 1, paddingHorizontal: 15 },
  msgBubble: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 18, marginBottom: 10, maxWidth: '80%' },
  myMsg: { alignSelf: 'flex-end', backgroundColor: '#7c3aed', borderBottomRightRadius: 2 },
  theirMsg: { alignSelf: 'flex-start', backgroundColor: '#333', borderBottomLeftRadius: 2 },
  msgText: { color: 'white', fontSize: 15 },
  msgTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textAlign: 'right', marginTop: 4 },
  cameraOverlay: { height: 320, backgroundColor: '#1a1033' },
  cameraBox: { height: 250, backgroundColor: 'black' },
  controls: { flexDirection: 'row', padding: 10, justifyContent: 'center' },
  toolBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, marginHorizontal: 5 },
  toolText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  inputArea: { flexDirection: 'row', padding: 15, alignItems: 'center', backgroundColor: '#1a1033', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, paddingHorizontal: 20, height: 45, color: 'white' },
  sendBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  sendBtnText: { color: 'white', fontSize: 20 },
  sosToggle: { backgroundColor: 'rgba(124, 58, 237, 0.2)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  sosToggleText: { color: '#7c3aed', fontWeight: 'bold', fontSize: 12 },
  emptyHint: { color: '#666', textAlign: 'center', marginTop: 50 },
});