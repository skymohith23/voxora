import React from "react";
import SignCapture from "../components/SignCapture";
import TextOutput from "../components/TextOutput";
import VoiceOutput from "../components/VoiceOutput";
import EmergencyButton from "../components/EmergencyButton";

function Home() {
  return (
    <div className="container">
      <h1>Voxora – Sign to Speech</h1>
      <div className="row">
        <SignCapture />
        <TextOutput />
        <VoiceOutput />
      </div>
      <EmergencyButton />
    </div>
  );
}

export default Home;
