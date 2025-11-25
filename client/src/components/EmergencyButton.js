import React, { useState } from "react";
import "./EmergencyButton.css";

function EmergencyButton() {
  const [alert, setAlert] = useState(false);

  const handleClick = () => {
    setAlert(true);
    setTimeout(() => setAlert(false), 2000); 
  };

  return (
    <div className="emergency-container">
      <button className="emergency-btn" onClick={handleClick}>
        🚨 Emergency
      </button>

      {alert && (
        <div className="emergency-popup">
          🚨 Emergency Alert Triggered!
        </div>
      )}
    </div>
  );
}

export default EmergencyButton;
