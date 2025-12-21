// client/src/pages/SignDetection.js
import React, { useState } from "react";
import SignCamera from "../components/SignCamera";
import SignWordBuilder from "../components/SignWordBuilder";

export default function SignDetection() {
  const [sentence, setSentence] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130426] via-[#2a005d] to-[#1a0b3a] p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-4">Sign → Text</h1>

        <div className="bg-white/5 p-4 rounded-2xl mb-6">
          <SignCamera
            onRecognizedText={(ltr) => {
              // feed the global helper used by SignWordBuilder
              window.__FEED_LETTER && window.__FEED_LETTER(ltr);
            }}
            captureInterval={700}
          />
        </div>

        <SignWordBuilder
          detecting={true}
          onSendSentence={(s) => setSentence(s)}
        />

        <div className="mt-4 p-4 bg-white/6 rounded-xl text-white">
          <strong>Sentence:</strong>
          <p className="mt-2 text-lg">{sentence || "—"}</p>
        </div>
      </div>
    </div>
  );
}
