// src/components/SignCamera.js
import React, { useEffect, useRef, useState } from "react";
import { apiRecognizeBase64 } from "../api";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/**
 * SignCamera
 * Props:
 *  - onRecognizedText(value: string)  // called when a stable letter/word is accepted
 *  - captureInterval (ms) default 700
 *
 * Notes:
 *  - This component uses Mediapipe hand landmarker to crop the hand region,
 *    sends the crop as a base64 image to the backend, and emits recognized text.
 *  - Backend is expected to resize/normalize the image to the model's expected size.
 */
export default function SignCamera({ onRecognizedText, captureInterval = 700 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handModelRef = useRef(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(false);
  const processingRef = useRef(false);

  // sliding window for stability filtering (require N identical detections)
  const historyRef = useRef([]);
  const STABILITY_FRAMES = 3;

  async function initHandModel() {
    // load wasm files for mediapipe
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    handModelRef.current = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
      },
      numHands: 1,
      runningMode: "video",
    });
  }

  useEffect(() => {
    mountedRef.current = true;

    async function startCameraAndModel() {
      try {
        await initHandModel();

        // prefer front (user) camera for mobile
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (!mountedRef.current) {
          // component unmounted while acquiring camera
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const vid = videoRef.current;
        vid.srcObject = stream;
        // autoplay/play permission handling
        await vid.play();
        vid.onloadedmetadata = () => {
          vid.play().catch(err => {
            console.error("Video play failed:", err);
          });
        };
        

        // start periodic frame processing
        intervalRef.current = setInterval(processFrame, captureInterval);
      } catch (err) {
        // non-fatal: log for debugging
        // eslint-disable-next-line no-console
        console.error("SignCamera start error:", err);
      }
    }

    startCameraAndModel();

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
      // stop camera tracks
      try {
        const stream = videoRef.current?.srcObject;
        if (stream && stream.getTracks) stream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    };
    // intentionally run once

  }, []);

  async function processFrame() {
    if (!mountedRef.current) return;
    const video = videoRef.current;
    const model = handModelRef.current;
    if (!video || !model) return;
    if (processingRef.current) return; // prevent overlapping
    try {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;

      processingRef.current = true;
      const handResult = await model.detectForVideo(video, Date.now());
      if (!handResult || !handResult.landmarks || handResult.landmarks.length === 0) {
        // push a null to history (pause)
        pushHistory(null);
        processingRef.current = false;
        return;
      }

      const landmarks = handResult.landmarks[0];
      const xs = landmarks.map((p) => p.x);
      const ys = landmarks.map((p) => p.y);

      // compute crop with margin and clamp to video bounds
      const margin = 40;
      const minX = Math.max(0, Math.round(Math.min(...xs) * w - margin));
      const minY = Math.max(0, Math.round(Math.min(...ys) * h - margin));
      const maxX = Math.min(w, Math.round(Math.max(...xs) * w + margin));
      const maxY = Math.min(h, Math.round(Math.max(...ys) * h + margin));

      const cropWidth = Math.max(1, maxX - minX);
      const cropHeight = Math.max(1, maxY - minY);

      const canvas = canvasRef.current;
      if (!canvas) {
        processingRef.current = false;
        return;
      }

      // draw crop to canvas
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      // send compact PNG to backend
      const dataUrl = canvas.toDataURL("image/png");

      // call backend
      let res;
      try {
        res = await apiRecognizeBase64(dataUrl);
      } catch (e) {
        // backend error — skip this frame
        // eslint-disable-next-line no-console
        console.warn("apiRecognizeBase64 error:", e);
        pushHistory(null);
        processingRef.current = false;
        return;
      }

      const label = String(res?.data?.recognized_text || "").trim();
      if (!label) {
        pushHistory(null);
        processingRef.current = false;
        return;
      }

      // push and check stability
      pushHistory(label);

      // if stable, emit and clear history to avoid duplicates
      if (isStable()) {
        const stable = historyRef.current[historyRef.current.length - 1];
        // normalize: if single letter, uppercase it
        const outgoing = stable.length === 1 ? stable.toUpperCase() : stable;
        try {
          onRecognizedText && onRecognizedText(outgoing);
        } catch (e) {
          // ignore errors from parent callback
        }
        // reset history so we don't spam the same label
        historyRef.current = [];
      }

      processingRef.current = false;
    } catch (err) {
      // log and continue
      // eslint-disable-next-line no-console
      console.warn("processFrame caught:", err);
      processingRef.current = false;
    }
  }

  function pushHistory(item) {
    historyRef.current.push(item);
    if (historyRef.current.length > STABILITY_FRAMES) historyRef.current.shift();
  }

  function isStable() {
    const arr = historyRef.current;
    if (arr.length < STABILITY_FRAMES) return false;
    // all must be non-null and identical (case-insensitive)
    const first = arr[0];
    if (!first) return false;
    return arr.every((x) => x && String(x).toLowerCase() === String(first).toLowerCase());
  }

  // UI
  return (
    <div className="w-full max-w-xl mx-auto">
      <video
        ref={videoRef}
        className="w-full rounded-lg bg-black"
        playsInline
        muted
        autoPlay
      />
      {/* hidden canvas used for cropping the hand area before sending */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
