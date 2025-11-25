import React, { useRef, useEffect } from "react";
import "./SignCapture.css";

function SignCapture() {
  const videoRef = useRef(null);

  useEffect(() => {
    // Access webcam
    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam: ", err);
      }
    }

    startWebcam();
  }, []);

  return (
    <div className="sign-capture">
      <h2>Sign Capture</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="webcam-video"
      />

      <p>Webcam feed is live above.</p>
    </div>
  );
}

export default SignCapture;
