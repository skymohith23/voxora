import React from "react";
import SignCapture from "../components/SignCapture";
import TextOutput from "../components/TextOutput";
import VoiceOutput from "../components/VoiceOutput";
import EmergencyButton from "../components/EmergencyButton";

function Home() {
  return (
    <div>
      <h1>Voxora</h1>
      <SignCapture />
      <TextOutput />
      <VoiceOutput />
      <EmergencyButton />
    </div>
  );
}

export default Home;
