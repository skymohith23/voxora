// client/src/components/EmergencyButton.js
import React from "react";

export default function EmergencyButton({ username }) {
  const triggerEmergency = async () => {
    const message = prompt("Emergency message (short)","I need help!");
    try {
      const resp = await fetch("/api/emergency", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ username, message })
      });
      const data = await resp.json();
      alert("Emergency sent: " + JSON.stringify(data.sent || data));
    } catch (e) {
      console.error(e);
      alert("Failed to send emergency: " + e.message);
    }
  };

  return (
    <div>
      <button onClick={triggerEmergency} style={{background:"red",color:"white",padding:"12px 20px",fontSize:16,borderRadius:8}}>
        🚨 Emergency — notify contacts
      </button>
    </div>
  );
}
