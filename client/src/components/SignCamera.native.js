// src/components/SignCamera.native.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Camera } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { apiRecognizeBase64 } from "../utils/api_native"; // see api helper below
import { useIsFocused } from "@react-navigation/native";

/**
 * Props:
 *  - onRecognizedText(label: string)
 *  - captureInterval (ms) default 900
 *  - outputSize default 224
 */
export default function SignCameraNative({
  onRecognizedText,
  captureInterval = 900,
  outputSize = 224,
}) {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const inFlight = useRef(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    let tid;
    if (hasPermission && isFocused) {
      // start polling
      tid = setInterval(() => {
        captureAndSend().catch(() => {});
      }, captureInterval);
    }
    return () => {
      if (tid) clearInterval(tid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, isFocused]);

  async function captureAndSend() {
    try {
      if (inFlight.current) return;
      if (!cameraRef.current) return;

      inFlight.current = true;

      // take picture with low quality to minimize payload
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: false, // we'll read file and manipulate
        skipProcessing: true,
      });

      // Optional: you can crop to center square or full image. Here we crop center square.
      const { uri, width, height } = photo;
      const size = Math.min(width, height);
      const cropX = Math.floor((width - size) / 2);
      const cropY = Math.floor((height - size) / 2);

      // Resize+crop to outputSize x outputSize
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { crop: { originX: cropX, originY: cropY, width: size, height: size } },
          { resize: { width: outputSize, height: outputSize } },
        ],
        { compress: 0.8, base64: true, format: ImageManipulator.SaveFormat.JPEG }
      );

      const base64 = manipResult.base64;
      if (!base64) {
        inFlight.current = false;
        return;
      }

      // send to backend; backend expects data:image/jpeg;base64,... OR raw base64
      const dataUrl = "data:image/jpeg;base64," + base64;
      let res;
      try {
        res = await apiRecognizeBase64(dataUrl);
      } catch (e) {
        // network / server failure -> ignore but unflag inFlight
        inFlight.current = false;
        return;
      }

      const label = (res?.data?.recognized_text || "").toString().trim();
      if (label) {
        if (/^[a-z]$/i.test(label)) {
          onRecognizedText && onRecognizedText(label.toUpperCase());
        } else {
          // multi-character words pass-through
          onRecognizedText && onRecognizedText(label);
        }
      }
      inFlight.current = false;
    } catch (err) {
      inFlight.current = false;
      // silent fail
    }
  }

  if (hasPermission === null) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator /></View>;
  if (hasPermission === false) return <View style={{ padding: 20 }}><Text>No camera permission</Text></View>;

  return (
    <View style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 12, overflow: "hidden" }}>
      {/* camera view */}
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        type={Camera.Constants.Type.front}
        ratio="16:9"
        pictureSize="640x480"
      />
    </View>
  );
}
