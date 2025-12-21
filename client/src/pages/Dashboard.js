// client/src/pages/Dashboard.js
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130426] via-[#2a005d] to-[#1a0b3a] p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome, {user?.name || user?.email || "User"}</h1>
            <p className="text-gray-300 mt-1">Ready when you are — pick an emergency action</p>
          </div>
          <div>
            <button onClick={() => nav("/profile")} className="bg-white/6 text-white px-3 py-2 rounded-lg">Profile</button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => nav("/emergency-call")}
            className="p-5 rounded-2xl bg-gradient-to-tr from-red-500 to-red-600 text-white text-lg font-semibold shadow-lg">
            Emergency Call
          </button>

          <button onClick={() => nav("/emergency-text")}
            className="p-5 rounded-2xl bg-gradient-to-tr from-purple-600 to-purple-700 text-white text-lg font-semibold shadow-lg">
            Emergency Text
          </button>

          <button onClick={() => nav("/contacts")}
            className="p-5 rounded-2xl bg-white/6 text-white text-lg font-semibold shadow-lg">
            Emergency Contacts
          </button>

          <button onClick={() => nav("/sign-detection")}
            className="p-5 rounded-2xl bg-green-600 text-white text-lg font-semibold shadow-lg">
            Sign Detection
          </button>
        </div>

        <div className="mt-6">
          <button onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/";
          }} className="w-full py-3 bg-white/6 text-white rounded-xl">Logout</button>
        </div>
      </div>
    </div>
  );
}
