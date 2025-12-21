import React from "react";
import "./LearnSignLanguage.css";

export default function LearnSignLanguage() {
  const lessons = [
    { id: "a", title: "A — Basic handshape", desc: "How to make A" },
    { id: "b", title: "B — Flat hand", desc: "How to make B" },
    { id: "hello", title: "Hello", desc: "Greeting sign" },
  ];

  return (
    <div className="learn-module">
      <h2>Learn Sign Language</h2>
      <p>Short lessons to practice common signs.</p>
      <div className="lessons-grid">
        {lessons.map(l => (
          <div key={l.id} className="lesson-card">
            <h3>{l.title}</h3>
            <p>{l.desc}</p>
            <button onClick={() => alert(`Play demo for ${l.title}`)}>Play Demo</button>
          </div>
        ))}
      </div>
    </div>
  );
}
