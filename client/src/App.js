import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Home from "./components/Home";
import LearnSignLanguage from "./components/LearnSignLanguage";
import SignCapture from "./components/SignCapture";
import TextOutput from "./components/TextOutput";
import VoiceOutput from "./components/VoiceOutput";

function App() {
  return (
    <Router>
      <nav className="navbar">
        <Link to="/">Home</Link>
        <Link to="/learn">Learn</Link>
        <Link to="/capture">Capture</Link>
        <Link to="/text">Text Output</Link>
        <Link to="/voice">Voice Output</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<LearnSignLanguage />} />
        <Route path="/capture" element={<SignCapture />} />
        <Route path="/text" element={<TextOutput />} />
        <Route path="/voice" element={<VoiceOutput />} />
      </Routes>
    </Router>
  );
}

export default App;
