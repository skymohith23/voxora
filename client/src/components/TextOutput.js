import React, { useEffect, useState } from "react";

export default function TextOutput() {
  const [text, setText] = useState("Recognized text will appear here...");
  const [time, setTime] = useState(null);

  useEffect(() => {
    function handle(e) {
      const { text: t, ts } = e.detail || {};
      setText(t || "—");
      setTime(ts ? new Date(ts).toLocaleTimeString() : null);
    }
    window.addEventListener("voxora-prediction", handle);
    return () => window.removeEventListener("voxora-prediction", handle);
  }, []);

  return (
    <div className="box">
      <h3>Detected Text</h3>
      <div style={{ fontSize: 18, padding: 8, minHeight: 36 }}>{text}</div>
      {time && <div style={{ color: "#94a3b8", fontSize: 12 }}>Updated: {time}</div>}
    </div>
  );
}
