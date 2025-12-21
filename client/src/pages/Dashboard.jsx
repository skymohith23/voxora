import React from "react";
import SignCapture from "./SignCapture";
import TextOutput from "./TextOutput";
import VoiceInput from "./VoiceInput";

export default function Dashboard(){
  return (
    <div>
      <h2>Dashboard</h2>
      <SignCapture />
      <TextOutput />
      <VoiceInput />
    </div>
  );
}
