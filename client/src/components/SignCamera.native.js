import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { runOnJS } from 'react-native-reanimated';

export default function SignCameraNative({ onRecognizedText }) {
  const device = useCameraDevice('front');
  const { resize } = useResizePlugin();
  const [hasPermission, setHasPermission] = useState(false);
  
  // Load your local TFLite model
  const model = useTensorflowModel(require('../assets/model.tflite'));

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Use a ref to prevent spamming the same character 30 times a second
  const lastRecognized = React.useRef("");

  const handleDetection = useCallback((outputs) => {
    // Logic to convert model array output to a label
    // This depends on how your model was trained (Classification vs Detection)
    const label = decodeTFLiteOutput(outputs); 
    
    if (label && label !== lastRecognized.current) {
      lastRecognized.current = label;
      onRecognizedText?.(label);
    }
  }, [onRecognizedText]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.model != null) {
      // 1. Resize the frame to 224x224 (standard for most mobile AI)
      const resized = resize(frame, { 
        scale: { width: 224, height: 224 }, 
        pixelFormat: 'rgb',
        dataType: 'uint8' 
      });

      // 2. Run inference on the GPU
      const outputs = model.model.runSync([resized]);
      
      // 3. Jump back to JS thread to handle the text
      runOnJS(handleDetection)(outputs);
    }
  }, [model, handleDetection]);

  if (!hasPermission) return <Text style={styles.info}>Grant Camera Permission</Text>;
  if (!device) return <ActivityIndicator size="large" />;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat="yuv" 
      />
    </View>
  );
}

// TODO: Update this based on your model's specific labels
function decodeTFLiteOutput(outputs) {
  // Example: Your model returns [0.1, 0.8, 0.1] for ['A', 'B', 'C']
  // This finds the index of the highest probability
  const scores = outputs[0]; 
  const maxScore = Math.max(...scores);
  if (maxScore < 0.7) return null; // Confidence threshold
  
  const index = scores.indexOf(maxScore);
  const labels = ["A", "B", "C", "HELLO", "HELP"]; // Replace with your labels
  return labels[index];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', borderRadius: 15, overflow: 'hidden' },
  info: { color: 'white', textAlign: 'center', marginTop: 50 }
});