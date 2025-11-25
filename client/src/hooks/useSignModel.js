// client/src/hooks/useSignModel.js
import { useRef, useEffect } from "react";

/*
  Simple local mock recognizer:
  - grabs an image from the video every 400ms
  - computes a very small heuristic (movement / brightness changes)
  - outputs one of a fixed set of demo labels
  This is a placeholder for a real ML model (MediaPipe/TF.js) you can integrate later.
*/

const PHRASES = [
  "Hello",
  "I need help",
  "Yes",
  "No",
  "Thank you",
  "Emergency! Please help."
];

export default function useSignModel() {
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const prevAvgRef = useRef(null);

  useEffect(() => {
    // cleanup on unmount just in case
    return () => {
      stopDetection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startDetection(videoEl) {
    if (!videoEl) return;
    if (runningRef.current) return;
    runningRef.current = true;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const w = Math.min(320, videoEl.videoWidth || 320);
    const h = Math.min(240, videoEl.videoHeight || 240);
    canvas.width = w;
    canvas.height = h;

    let tickCount = 0;

    async function loop() {
      if (!runningRef.current) return;
      try {
        // draw current video frame
        ctx.drawImage(videoEl, 0, 0, w, h);
        const img = ctx.getImageData(0, 0, w, h);
        // compute average brightness (simple heuristic)
        let sum = 0;
        for (let i = 0; i < img.data.length; i += 4) {
          const r = img.data[i];
          const g = img.data[i + 1];
          const b = img.data[i + 2];
          // luminosity
          sum += 0.21 * r + 0.72 * g + 0.07 * b;
        }
        const avg = sum / (w * h);

        // movement heuristic: compare with previous avg
        const prev = prevAvgRef.current;
        let movement = 0;
        if (prev != null) {
          movement = Math.abs(avg - prev);
        }
        prevAvgRef.current = avg;

        // every few ticks, emit a mock prediction based on movement
        tickCount++;
        if (tickCount % 3 === 0) {
          const now = Date.now();
          let label;
          // If movement is high, pick an "urgent" phrase sometime
          if (movement > 6) {
            // random chance to say "I need help" or "Emergency"
            label = Math.random() > 0.85 ? PHRASES[5] : PHRASES[1];
          } else {
            // rotate through non-urgent phrases
            label = PHRASES[Math.floor((now / 3000) % (PHRASES.length - 2))];
          }
          // dispatch a custom event with the predicted text
          const e = new CustomEvent("voxora-prediction", {
            detail: { text: label, ts: now },
          });
          window.dispatchEvent(e);
        }
      } catch (err) {
        console.warn("frame read error", err);
      }

      // schedule next (approx 400ms)
      rafRef.current = setTimeout(loop, 400);
    }

    // start
    loop();
  }

  function stopDetection() {
    runningRef.current = false;
    if (rafRef.current) {
      clearTimeout(rafRef.current);
      rafRef.current = null;
    }
    prevAvgRef.current = null;
  }

  return { startDetection, stopDetection };
}
