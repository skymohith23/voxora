// client/src/pages/Register.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRegister } from "../api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  async function doRegister() {
    try {
      const res = await apiRegister(name, email, password);
      if (res.status === 200 || res.status === 201) {
        alert("Registered — please log in");
        nav("/");
      } else {
        alert("Register failed");
      }
    } catch (e) {
      alert("Error: " + (e?.response?.data || e.message));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#130426] via-[#2a005d] to-[#1a0b3a] px-6">
      <div className="w-full max-w-md bg-white/5 rounded-2xl p-8 shadow-lg border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Create account</h2>

        <div className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                 className="w-full p-3 rounded-xl bg-white/6 placeholder-gray-400 text-white border border-white/10" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
                 className="w-full p-3 rounded-xl bg-white/6 placeholder-gray-400 text-white border border-white/10" />
          <input value={password} type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                 className="w-full p-3 rounded-xl bg-white/6 placeholder-gray-400 text-white border border-white/10" />

          <button onClick={doRegister} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-semibold">
            Register
          </button>

          <div className="text-sm text-gray-300 text-center">
            Already registered?{" "}
            <button onClick={() => nav("/")} className="text-white underline">Log in</button>
          </div>
        </div>
      </div>
    </div>
  );
}
