import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { API_BASE } from "../utils/api_native"; 

export default function SignCameraNative({ onRecognizedText }) {
  const device = useCameraDevice('front');
  const camera = useRef(null);
  
  const lastLetterRef = useRef(""); 
  const isProcessing = useRef(false);

  useEffect(() => {
    const checkPermission = async () => {
      const status = await Camera.requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert("Camera Error", "Permission denied.");
      }
    };
    checkPermission();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (camera.current && !isProcessing.current) {
        try {
          const photo = await camera.current.takePhoto({ 
            flash: 'off',
            enableShutterSound: false 
          });
          uploadImage(photo.path);
        } catch (e) { 
          console.log("Capture error:", e); 
        }
      }
    }, 1500); 

    return () => {
      clearInterval(interval);
      isProcessing.current = false;
    };
  }, []);

  const uploadImage = async (filePath) => {
    isProcessing.current = true;
    const formData = new FormData();
    formData.append('image', { 
      uri: `file://${filePath}`, 
      type: 'image/jpeg', 
      name: 'sign.jpg' 
    });

    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const data = await response.json();
      
      if (data.status === "success" && data.prediction) {
        // Only update local buffer if the letter is new and not a safety error "?"
        if (data.prediction !== lastLetterRef.current && data.prediction !== "?") {
          lastLetterRef.current = data.prediction;
          // This updates the draftMessage state in EmergencyCall.js
          onRecognizedText?.(data.prediction);
        }
      } else if (data.status === "no_hand") {
          // Reset so the same letter can be signed again after a pause
          lastLetterRef.current = "";
      }
    } catch (err) { 
      console.log("Prediction error:", err); 
    } finally {
      isProcessing.current = false;
    }
  };

  if (!device) return <View style={styles.container} />;
  
  return (
    <View style={styles.container}>
      <Camera 
        ref={camera} 
        style={StyleSheet.absoluteFill} 
        device={device} 
        isActive={true} 
        photo={true} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }
});