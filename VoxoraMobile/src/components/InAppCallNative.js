import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { RTCPeerConnection, RTCView, mediaDevices } from 'react-native-webrtc';
import { io } from "socket.io-client";

export default function InAppCallNative({ username }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);

  const cleanup = () => {
    console.log("Releasing Camera and Socket...");
    if (socketRef.current) socketRef.current.disconnect();
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setLocalStream(null);
    }
  };

  useEffect(() => {
    // Replace YOUR_SERVER_IP with your actual local IP
    socketRef.current = io("http://192.168.1.4:5000", { transports: ["websocket"] });

    socketRef.current.on("incoming_call", async (data) => {
      const { from, offer } = data;
      Alert.alert("Emergency Call", `From ${from}`, [
        { text: "Reject", style: "cancel", onPress: () => socketRef.current.emit("call_rejected", { to: from }) },
        { text: "Accept", onPress: () => handleAcceptCall(from, offer) }
      ]);
    });

    return () => cleanup();
  }, []);

  const handleAcceptCall = async (from, offer) => {
    const stream = await startLocalStream();
    // Your WebRTC PeerConnection logic goes here...
  };

  const startLocalStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (e) {
      console.error("Failed to get stream", e);
    }
  };

  return (
    <View style={styles.container}>
      {remoteStream && (
        <RTCView streamURL={remoteStream.toURL()} style={styles.remoteView} objectFit="cover" />
      )}
      {localStream && (
        <RTCView 
          streamURL={localStream.toURL()} 
          style={styles.localView} 
          objectFit="cover" 
        />
      )}
      {!localStream && (
        <TouchableOpacity style={styles.startButton} onPress={startLocalStream}>
          <Text style={styles.buttonText}>Start Video</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remoteView: { flex: 1 },
  localView: { width: 120, height: 180, position: 'absolute', right: 20, top: 20, borderRadius: 10 },
  startButton: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#7c3aed', padding: 15, borderRadius: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' }
});