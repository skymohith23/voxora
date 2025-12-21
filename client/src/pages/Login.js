// client/src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin } from "../api";
import logo from "../assets/logo.png"; // replace if necessary

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  async function doLogin() {
    try {
      const res = await apiLogin(email, password);
      if (res.status === 200) {
        const user = {
          user_id: res.data.user_id,
          email: res.data.email,
          name: res.data.name,
        };
        localStorage.setItem("user", JSON.stringify(user));
        nav("/dashboard", { replace: true });
      } else {
        alert("Login failed");
      }
    } catch (e) {
      alert("Login error: " + (e?.response?.data || e.message));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#130426] via-[#2a005d] to-[#1a0b3a] px-6">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/10">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Voxora" className="w-28 h-28 rounded-lg object-cover mb-3" />
          <h1 className="text-white text-3xl font-bold">Voxora</h1>
          <p className="text-gray-300 mt-1 text-sm text-center">AI-powered sign → text assistant</p>
        </div>

        <div className="space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 rounded-xl bg-white/6 placeholder-gray-400 text-white border border-white/10"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full p-3 rounded-xl bg-white/6 placeholder-gray-400 text-white border border-white/10"
          />
          <button
            onClick={doLogin}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-semibold"
          >
            Log in
          </button>

          <div className="text-center text-sm text-gray-300">
            New here?{" "}
            <button onClick={() => nav("/register")} className="text-white font-medium underline">
              Create account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
