import React from "react";

export default function TextOutput({ text }) {
  return <div><h4>Detected Text:</h4><p>{text || "—"}</p></div>;
}
