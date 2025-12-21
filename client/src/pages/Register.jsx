import React, { useState } from "react";

export default function Register({ switchTo }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");

  const handleRegister = async () => {
    setResult("Loading...");
    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
      if (res.status === 201) {
        alert("Registered — now login.");
        switchTo("login");
      } else {
        alert("Register failed: " + (data.detail || data.error || JSON.stringify(data)));
      }
    } catch (err) {
      console.error(err);
      setResult("Network error");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: 20 }}>
      <h2>Register</h2>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
      <button onClick={handleRegister} style={{ padding: 10, width: "100%" }}>
        Register
      </button>
      <div style={{ marginTop: 10 }}>
        <small>
          Already have an account?{" "}
          <button onClick={() => switchTo("login")} style={{ color: "blue", background: "none", border: "none" }}>
            Login
          </button>
        </small>
      </div>

      <pre style={{ background: "#f3f3f3", padding: 8, marginTop: 12, whiteSpace: "pre-wrap" }}>{result}</pre>
    </div>
  );
}
