import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import LearnSignLanguage from "./components/LearnSignLanguage";
import TextOutput from "./components/TextOutput";
import VoiceOutput from "./components/VoiceOutput";

function App() {
  return (
    <Router>
      <div style={{ padding: "20px" }}>
        <h1>Voxora</h1>

        {/* Simple Navigation */}
        <nav style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <Link to="/learn-sign">Learn Sign</Link>
          <Link to="/text-output">Text Output</Link>
          <Link to="/voice-output">Voice Output</Link>
        </nav>

        {/* Routing Section */}
        <Routes>
          <Route path="/learn-sign" element={<LearnSignLanguage />} />
          <Route path="/text-output" element={<TextOutput />} />
          <Route path="/voice-output" element={<VoiceOutput />} />
          <Route path="/" element={<h2>Welcome to Voxora</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
