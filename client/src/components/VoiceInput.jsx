// Simple wrapper - user types text that will be sent to server TTS
import React, { useState } from "react";

export default function VoiceInput() {
  const [text, setText] = useState("");

  const speak = async () => {
    if (!text) return;
    const res = await fetch("http://127.0.0.1:5000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  };

  return (
    <div>
      <h3>Text -> Voice</h3>
      <textarea value={text} onChange={e => setText(e.target.value)} />
      <button onClick={speak}>Speak</button>
    </div>
  );
}
