import React, { useState } from "react";
import "./VoiceInput.css";


function VoiceInput({ onTextDetected }) {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setRecognizedText(transcript);

      // send text to parent page (Home.js or TextOutput)
      if (onTextDetected) {
        onTextDetected(transcript);
      }
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return (
    <div className="box">
      <h2>Voice Input</h2>
      <p>{recognizedText || "Speak something..."}</p>

      {!isListening ? (
        <button className="btn" onClick={startListening}>🎤 Start Listening</button>
      ) : (
        <button className="btn stop" onClick={stopListening}>🛑 Stop</button>
      )}
    </div>
  );
}

export default VoiceInput;
