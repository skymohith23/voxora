import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';


export default function SignCameraNative({ onRecognizedText }) {
  const isFocused = useIsFocused();
  const device = useCameraDevice('front');
  const camera = useRef(null);
  const [currentSign, setCurrentSign] = useState("Standing by...");
  const isProcessing = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isFocused && camera.current && !isProcessing.current) {
        if (!camera.current) return;
        try {
          isProcessing.current = true;
          const frameCount = 30; // 30 frames is the optimized length for the Google TFLite model
          const frames = [];
          
          for (let i = 0; i < frameCount; i++) {
            // takeSnapshot is used for speed and efficiency during bursts
            const snapshot = await camera.current.takeSnapshot({
              quality: 30, 
              skipMetadata: true,
            });
            frames.push(snapshot.path);
            
            // Short delay to capture motion naturally (~15-20 FPS)
            await new Promise(resolve => setTimeout(resolve, 20)); 
          }
          
          await uploadBurst(frames);
          
        } catch (e) {
          console.log("Capture Error:", e);
        } finally {
          isProcessing.current = false;
        }
      }
    }, 1500); // Wait 1.5s between bursts to allow server processing
    return () => clearInterval(interval);
  }, [isFocused]);

  const uploadBurst = async (filePaths) => {
    const formData = new FormData();
    filePaths.forEach((path, index) => {
      formData.append('images', {
        uri: `file://${path}`,
        type: 'image/jpeg',
        name: `frame_${index}.jpg`,
      });
    });

    try {
      const response = await fetch("http://192.168.1.4:8000/predict", {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const data = await response.json();
      
      if (data.prediction) {
        const displayText = data.prediction === "LISTENING..." ? "Listening..." : data.prediction;
        setCurrentSign(displayText);
        
        // Only trigger the callback if a real word was found
        if (data.prediction !== "LISTENING...") {
          onRecognizedText?.(data.prediction);
        }
      }
    } catch (err) {
      console.log("Upload error:", err);
      setCurrentSign("Server Offline");
    }
  };

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>Loading Camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera 
        ref={camera} 
        style={StyleSheet.absoluteFill} 
        device={device} 
        isActive={isFocused} 
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  info: { color: '#fff' },
  overlay: { 
    position: 'absolute', 
    bottom: 50, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    padding: 15, 
    borderRadius: 10 
  },
  predictionText: { 
    color: '#7c3aed', 
    fontSize: 24, 
    fontWeight: 'bold' 
  }
});