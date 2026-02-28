import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { runOnJS } from 'react-native-reanimated'; 
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useIsFocused } from '@react-navigation/native'; 

const modelSource = require('../../models/asl_model.tflite');
const ALPHABET_LABELS = ["A", "B", "C", "HELLO", "HELP"];

export default function SignCameraNative({ onRecognizedText }) {
  const isFocused = useIsFocused();
  const device = useCameraDevice('front');
  const { resize } = useResizePlugin();
  const plugin = useTensorflowModel(modelSource);
  const model = plugin?.model;

  const [hasPermission, setHasPermission] = useState(false);
  const [localWord, setLocalWord] = useState(""); 
  const historyRef = useRef([]); 

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleDetection = (letter) => {
    historyRef.current.push(letter);
    if (historyRef.current.length > 3) historyRef.current.shift();

    if (historyRef.current.length === 3 && historyRef.current.every(v => v === letter)) {
      setLocalWord(prev => {
        const updated = prev + (prev.length > 0 ? " " : "") + letter;
        onRecognizedText?.(letter); 
        return updated;
      });
      historyRef.current = [];
    }
  };

  const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  if (model == null || !isFocused) return;

  try {
    const resized = resize(frame, {
      size: { width: 224, height: 224 },
      pixelFormat: 'rgb',
      dataType: 'uint8'
    });

    if (!resized) return;

    const floatData = new Float32Array(resized.length);

    for (let i = 0; i < resized.length; i++) {
      floatData[i] = resized[i] / 255.0;
    }

    const outputs = model.runSync([floatData]);
    const scores = outputs[0];

    console.log("Scores:", scores);

    let maxScore = 0;
    let maxIndex = -1;

    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > maxScore) {
        maxScore = scores[i];
        maxIndex = i;
      }
    }

    if (maxIndex !== -1 && maxScore > 0.40) {
      runOnJS(handleDetection)(ALPHABET_LABELS[maxIndex]);
    }

  } catch (e) {
    console.log("AI ERROR:", e.message);
  }

}, [model, isFocused]);

  if (!hasPermission) return <View style={styles.center}><Text style={styles.info}>Waiting...</Text></View>;
  if (!device || !model) return <ActivityIndicator size="large" style={styles.center} color="#7c3aed" />;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused} 
        pixelFormat="rgb" 
        frameProcessor={frameProcessor}
      /> 
      <View style={styles.overlay}>
        <Text style={styles.wordLabel}>{localWord || "AI Ready"}</Text>
      </View>
      <TouchableOpacity style={styles.clearBtn} onPress={() => setLocalWord("")}>
        <Text style={styles.btnText}>CLEAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  info: { color: '#aaa' },
  overlay: { position: 'absolute', top: 20, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 15, borderRadius: 10 },
  wordLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  clearBtn: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#ef4444', padding: 10, borderRadius: 10 },
  btnText: { color: 'white', fontWeight: 'bold' }
});