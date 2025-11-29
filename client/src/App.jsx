import React, { useState, useEffect } from "react";
import SignCapture from "./components/SignCapture";
import Dashboard from "./components/Dashboard";

function App() {
  const [user, setUser] = useState("alice"); // simple fixed user for demo

  return (
    <div style={{ padding: 20 }}>
      <h1>Voxora - demo</h1>
      <p>Logged in as: {user}</p>
      <Dashboard user={user} />
      <hr />
      <SignCapture />
    </div>
  );
}

export default App;
