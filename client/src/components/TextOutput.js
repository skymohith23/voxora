import React from "react";
import "./TextOutput.css";

function TextOutput({ text }) {
  return (
    <div className="text-output-box">
      <h2>Text Output</h2>

      <div className="output-area">
        {text ? text : "Detected text will appear here..."}
      </div>
    </div>
  );
}

export default TextOutput;
