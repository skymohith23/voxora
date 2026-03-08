import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Camera, useCameraDevice } from 'react-native-vision-camera';

export default function SignCameraNative({ onRecognizedText }) {
  const device = useCameraDevice('front');
  const camera = useRef(null);
  const [currentSign, setCurrentSign] = useState("Standing by...");

  useEffect(() => {
    const interval = setInterval(async () => {
      if (camera.current) {
        try {
          const photo = await camera.current.takePhoto({
            flash: 'off',
            enableAutoRedEyeReduction: false
          });
          
          // photo.path provides the local file path
          uploadImage(photo.path);
        } catch (e) {
          console.log("Capture error:", e);
        }
      }
    }, 1000); 

    return () => clearInterval(interval);
  }, []);

  const uploadImage = async (filePath) => {
    const formData = new FormData();
    formData.append('image', {
      // On Android, we need the file:// prefix
      uri: `file://${filePath}`,
      type: 'image/jpeg',
      name: 'sign.jpg',
    });

    try {
      // REPLACE 192.168.1.XX with your Laptop's IPv4 address
      // Change this line in SignCameraNative.js
      const response = await fetch("http://192.168.1.4:8000/predict", {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const data = await response.json();
      
      // Update UI with the prediction
      if (data.prediction) {
        setCurrentSign(data.prediction);
        onRecognizedText?.(data.prediction);
      }
    } catch (err) {
      console.log("Upload error:", err);
      setCurrentSign("Server Offline");
    }
  };

  if (!device) return <View style={styles.center}><Text style={styles.info}>Loading Camera...</Text></View>;

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true} 
      />
      <View style={styles.overlay}>
        <Text style={styles.predictionText}>{currentSign}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  info: { color: '#fff' },
  overlay: { 
    position: 'absolute', 
    bottom: 50, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    padding: 15, 
    borderRadius: 10 
  },
  predictionText: { color: '#7c3aed', fontSize: 24, fontWeight: 'bold' }
});