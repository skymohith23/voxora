import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <h1>Welcome to Voxora</h1>
      <p>Your AI-powered sign language assistant.</p>

      <div className="home-buttons">
        <Link to="/learn">
          <button>Learn Sign Language</button>
        </Link>

        <Link to="/detect">
          <button>Sign Detection</button>
        </Link>

        <Link to="/voice">
          <button>Voice Output</button>
        </Link>
      </div>
    </div>
  );
}
