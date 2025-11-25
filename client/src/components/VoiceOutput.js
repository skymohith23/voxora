import React from "react";

function VoiceOutput() {
  const speak = () => {
    const msg = new SpeechSynthesisUtterance("This will speak the recognized text");
    window.speechSynthesis.speak(msg);
  };

  return (
    <div>
      <h2>AI Voice Output</h2>
      <button onClick={speak}>Play Voice</button>
    </div>
  );
}

export default VoiceOutput;
