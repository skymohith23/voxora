import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Learn from "./pages/Learn";

function App() {
  return (
    <Router>
      <nav className="navbar">
        <h2 className="logo">Voxora</h2>
        <div className="links">
          <Link to="/">Home</Link>
          <Link to="/learn">Learn</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<Learn />} />
      </Routes>
    </Router>
  );
}

export default App;
