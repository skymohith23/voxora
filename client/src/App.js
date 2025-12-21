import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import LearnSignLanguage from "./components/LearnSignLanguage";
import VoiceOutput from "./components/VoiceOutput";
import TextOutput from "./components/TextOutput";
import SignCapture from "./components/SignCapture";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<LearnSignLanguage />} />
        <Route path="/voice-output" element={<VoiceOutput />} />
        <Route path="/text-output" element={<TextOutput />} />
        <Route path="/sign-capture" element={<SignCapture />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
