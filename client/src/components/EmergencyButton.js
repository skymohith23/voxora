import React from "react";

function EmergencyButton() {
  const sendAlert = () => {
    alert("Emergency message sent (will integrate backend later).");
  };

  return (
    <div>
      <h2>Emergency Contact</h2>
      <button onClick={sendAlert}>Send Emergency Message</button>
    </div>
  );
}

export default EmergencyButton;
