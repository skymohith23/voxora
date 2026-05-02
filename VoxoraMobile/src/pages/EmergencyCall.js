import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Alert, Dimensions, Modal, ActivityIndicator 
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice'; 
import SignCameraNative from "../components/SignCamera.native";
import axiosInst from "../utils/api_native";

const quickActions = ["HELP!", "DANGER", "MEDICAL", "POLICE", "FIRE"];

export default function EmergencyCall({ navigation }) {
  const [toEmail, setToEmail] = useState("");
  const [currentSentence, setCurrentSentence] = useState("");
  const [remoteTranscript, setRemoteTranscript] = useState("");
  const [contacts, setContacts] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  
  // Call States
  const [isCallActive, setIsCallActive] = useState(false);
  const [callMode, setCallMode] = useState(null); // 'sign' or 'talk'
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callerEmail, setCallerEmail] = useState("");
  
  // UI States
  const [isModeModalVisible, setIsModeModalVisible] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const socket = useRef(null);
  const timerRef = useRef(null);

  // --- 1. Lifecycle & Initial Load ---
  useEffect(() => {
    loadData();
    setupVoice();
    setupTts();

    return () => {
      cleanupCall();
      if (socket.current) socket.current.close();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const setupTts = () => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.6); 
    Tts.setIgnoreSilentSwitch("ignore");
  };

  const setupVoice = () => {
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        setCurrentSentence(text);
        // Relay speech result to the other user
        relayMediaData(text, 'speech_result');
      }
    };
    Voice.onSpeechError = (e) => console.log("Speech Error:", e);
  };

  // --- 2. Call Timer Logic ---
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallTimer(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isCallActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- 3. WebSocket Setup ---
  useEffect(() => {
    if (userEmail) {
      const wsUrl = `ws://192.168.1.4:8000/ws/call/${userEmail}`;
      socket.current = new WebSocket(wsUrl);

      socket.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        
        // Handle Incoming Call Notification
        if (data.content?.includes("Incoming Voxora Call")) {
          setCallerEmail(data.sender);
          setIsIncomingCall(true);
        }

        // Handle Voice Broadcast AND Speech Results
        // Adding 'speech_result' check ensures spoken words are voiced on the other end
        if (data.type === "voice_broadcast" || data.type === "speech_result") {
          setRemoteTranscript(data.content);
          
          if (isSpeakerOn) {
            // Use a small delay to ensure TTS doesn't overlap
            Tts.stop(); 
            Tts.speak(data.content);
          }
        }
      };

      socket.current.onclose = () => console.log("Socket Closed");
      return () => { if (socket.current) socket.current.close(); };
    }
  }, [userEmail, isSpeakerOn]);

  const loadData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const user = JSON.parse(storedUser || "{}");
      if (!user || !user.email) return;
      const myEmail = user.email.toLowerCase().trim();
      setUserEmail(myEmail);
      const res = await axiosInst.get(`/emergency/contacts?user_email=${myEmail}`);
      const list = res.data?.who_added_me || [];
      setContacts(list);
      if (list.length > 0) setToEmail(list[0].email);
    } catch (e) {
      Alert.alert("Connection Error", "Could not fetch contacts.");
    }
  };

  // --- 4. Call Control Handlers ---
  const startVoxoraCall = () => {
    if (!toEmail) return Alert.alert("Error", "Select a contact.");
    setIsModeModalVisible(true);
  };

  const selectMode = async (mode) => {
    setCallMode(mode);
    setIsModeModalVisible(false);
    setIsIncomingCall(false);
    setIsCallActive(true);
    
    // Notify target
    relayMediaData(`Incoming Voxora Call... [${mode.toUpperCase()} MODE]`, 'voice_broadcast');

    if (mode === 'talk') {
      try { await Voice.start('en-US'); } catch (e) { console.error(e); }
    }
  };

  const cleanupCall = async () => {
    setIsCallActive(false);
    setCallMode(null);
    setCurrentSentence("");
    setRemoteTranscript("");
    try { await Voice.stop(); } catch (e) {}
  };

  const relayMediaData = (text, type) => {
    const target = isIncomingCall ? callerEmail : toEmail;
    if (socket.current?.readyState === WebSocket.OPEN && target) {
      socket.current.send(JSON.stringify({
        to_user: target.toLowerCase().trim(),
        text: text,
        type: type 
      }));
    }
  };

  const handleRecognizedText = useCallback((newText) => {
    setCurrentSentence(prev => prev + newText);
    if (isCallActive && callMode === 'sign') {
      relayMediaData(newText, 'voice_broadcast');
    }
  }, [toEmail, callerEmail, isCallActive, callMode, isIncomingCall]);

  // --- 5. Render Helpers ---
  const renderTalkUI = () => (
    <View style={styles.talkUIContainer}>
      <View style={styles.callHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLetter}>
            {(isIncomingCall ? callerEmail : toEmail).charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.callerName}>{isIncomingCall ? callerEmail : toEmail}</Text>
        <Text style={styles.timerText}>{formatTime(callTimer)}</Text>
      </View>

      <View style={styles.remoteTranscriptBox}>
        <Text style={styles.remoteLabel}>REMOTE PARTY SAYS/SIGNS:</Text>
        <Text style={styles.remoteContent}>{remoteTranscript || "Listening..."}</Text>
      </View>

      <View style={styles.callActions}>
        <TouchableOpacity 
          style={[styles.roundActionBtn, isSpeakerOn && styles.activeAction]} 
          onPress={() => setIsSpeakerOn(!isSpeakerOn)}
        >
          <Text style={styles.actionIcon}>{isSpeakerOn ? "🔊" : "🔈"}</Text>
          <Text style={styles.actionLabel}>Speaker</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.roundActionBtn, {backgroundColor: '#ff4444'}]} onPress={cleanupCall}>
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionLabel}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Voxora Call Hub</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>CLOSE</Text>
        </TouchableOpacity>
      </View>

      {/* Incoming Call Modal */}
      <Modal visible={isIncomingCall && !isCallActive} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📞 Incoming Voxora Call</Text>
            <Text style={styles.modalSubtitle}>From: {callerEmail}</Text>
            <TouchableOpacity style={styles.modeBtn} onPress={() => selectMode('sign')}>
              <Text style={styles.modeBtnText}>Answer with Sign Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, {backgroundColor: '#10b981'}]} onPress={() => selectMode('talk')}>
              <Text style={styles.modeBtnText}>Answer with Talk Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsIncomingCall(false)}>
              <Text style={styles.cancelBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Outgoing Mode Modal */}
      <Modal visible={isModeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Your Mode</Text>
            <TouchableOpacity style={styles.modeBtn} onPress={() => selectMode('sign')}>
              <Text style={styles.modeBtnText}>📷 SIGN MODE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, {backgroundColor: '#10b981'}]} onPress={() => selectMode('talk')}>
              <Text style={styles.modeBtnText}>🎙️ TALK MODE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {!isCallActive ? (
        <ScrollView style={styles.mainScroll}>
          <View style={styles.card}>
            <Text style={styles.label}>SELECT EMERGENCY CONTACT</Text>
            <View style={styles.pickerBox}>
              <Picker
                selectedValue={toEmail}
                onValueChange={(val) => setToEmail(val)}
                dropdownIconColor="#7c3aed"
                style={{ color: 'white' }}
              >
                {contacts && contacts.length > 0 ? (
                  contacts.map((c) => (
                    <Picker.Item key={c.email} label={`${c.name} (${c.email})`} value={c.email} color="black" />
                  ))
                ) : (
                  <Picker.Item label="No Contacts Found" value="" color="gray" />
                )}
              </Picker>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={startVoxoraCall}>
              <Text style={styles.callBtnText}>🎙️ START VOXORA CALL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>QUICK BROADCAST</Text>
            <View style={styles.quickActionRow}>
              {quickActions.map(action => (
                <TouchableOpacity key={action} style={styles.quickBtn} onPress={() => relayMediaData(action, 'voice_broadcast')}>
                  <Text style={styles.quickBtnText}>{action}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.callActiveContainer}>
          {callMode === 'sign' ? (
            <View style={styles.signUIContainer}>
              <View style={styles.timerHeader}>
                <Text style={styles.timerTextWhite}>{formatTime(callTimer)}</Text>
                <TouchableOpacity style={styles.endCallSmall} onPress={cleanupCall}>
                   <Text style={{color: 'white', fontWeight: 'bold'}}>END</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cameraWrapperLarge}>
                <SignCameraNative 
                  onRecognizedText={handleRecognizedText} 
                  onBroadcastText={(t) => relayMediaData(t, 'voice_broadcast')} 
                />
              </View>
              <View style={styles.signTranscriptBox}>
                 <Text style={styles.label}>YOUR SIGNS:</Text>
                 <Text style={styles.transcriptText}>{currentSentence || "Detecting..."}</Text>
              </View>
            </View>
          ) : renderTalkUI()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#130426" },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1033' },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { backgroundColor: '#ff4444', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  closeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  mainScroll: { flex: 1, padding: 15 },
  card: { backgroundColor: '#1a1033', borderRadius: 20, padding: 15, marginBottom: 15 },
  label: { fontSize: 10, color: '#7c3aed', fontWeight: 'bold', marginBottom: 10 },
  pickerBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 15 },
  callBtn: { backgroundColor: '#7c3aed', padding: 15, borderRadius: 12, alignItems: 'center' },
  callBtnText: { color: 'white', fontWeight: 'bold' },
  quickActionRow: { flexDirection: 'row', flexWrap: 'wrap' },
  quickBtn: { backgroundColor: '#ff4444', margin: 4, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
  quickBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  talkUIContainer: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 40 },
  callHeader: { alignItems: 'center' },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  avatarLetter: { color: 'white', fontSize: 40, fontWeight: 'bold' },
  callerName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  timerText: { color: '#7c3aed', fontSize: 18, marginTop: 10 },
  remoteTranscriptBox: { width: '90%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 15 },
  remoteLabel: { color: '#10b981', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  remoteContent: { color: 'white', fontSize: 16, lineHeight: 22 },
  callActions: { flexDirection: 'row', width: '80%', justifyContent: 'space-around' },
  roundActionBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  activeAction: { backgroundColor: '#7c3aed' },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionLabel: { color: 'white', fontSize: 10 },
  callActiveContainer: { flex: 1 },
  signUIContainer: { flex: 1 },
  timerHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  timerTextWhite: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  endCallSmall: { backgroundColor: '#ff4444', padding: 10, borderRadius: 10 },
  cameraWrapperLarge: { flex: 1, backgroundColor: 'black' },
  signTranscriptBox: { padding: 20, backgroundColor: '#1a1033' },
  transcriptText: { color: 'white', fontSize: 18, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1a1033', padding: 25, borderRadius: 25, width: '85%', alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalSubtitle: { color: '#aaa', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  modeBtn: { width: '100%', backgroundColor: '#7c3aed', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  modeBtnText: { color: 'white', fontWeight: 'bold' },
  cancelBtn: { marginTop: 10 },
  cancelBtnText: { color: '#ff4444' }
});