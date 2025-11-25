import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import LearnSignLanguage from "./components/LearnSignLanguage";
import SignCapture from "./components/SignCapture";
import TextOutput from "./components/TextOutput";
import VoiceOutput from "./components/VoiceOutput";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<LearnSignLanguage />} />
        <Route path="/capture" element={<SignCapture />} />
        <Route path="/textout" element={<TextOutput />} />
        <Route path="/voice" element={<VoiceOutput />} />
      </Routes>
    </Router>
  );
}

export default App;
