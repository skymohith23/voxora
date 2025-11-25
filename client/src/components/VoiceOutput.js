import React, { useState } from "react";
import "./VoiceOutput.css";

function VoiceOutput() {
  const [text, setText] = useState("");

  // Text‑to‑Speech Function
  const speakText = () => {
    if (!text.trim()) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;   // speech speed
    utter.pitch = 1;  // voice tone

    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="voice-box">
      <h2>Voice Output</h2>

      <textarea
        placeholder="Enter text to speak"
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>

      <button onClick={speakText}>Speak</button>
    </div>
  );
}

export default VoiceOutput;
