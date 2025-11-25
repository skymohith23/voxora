import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LearnSignLanguage from "./components/LearnSignLanguage";
import SignCapture from "./components/SignCapture";
import TextOutput from "./components/TextOutput";
import VoiceOutput from "./components/VoiceOutput";
import Home from "./components/Home";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LearnSignLanguage />} />
        <Route path="/capture" element={<SignCapture />} />
        <Route path="/text" element={<TextOutput />} />
        <Route path="/voice" element={<VoiceOutput />} />
  <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
