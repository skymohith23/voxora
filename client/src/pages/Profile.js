// client/src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { apiMe } from "../api";

export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.user_id;
  const [me, setMe] = useState(null);
  const [locationSharing, setLocationSharing] = useState(false);

  useEffect(()=>{ if(userId) load(); }, [userId]);

  async function load() {
    try {
      const r = await apiMe(userId);
      setMe(r.data);
    } catch(e) { console.warn(e); }
  }

  function logout() {
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130426] via-[#2a005d] to-[#1a0b3a] p-6">
      <div className="max-w-3xl mx-auto text-white">
        <h2 className="text-3xl font-bold mb-4">Profile</h2>

        <div className="mb-4 p-4 bg-white/6 rounded-xl">
          <div className="mb-2"><strong>Username:</strong> {me?.name || user?.name}</div>
          <div><strong>Email:</strong> {user?.email}</div>
        </div>

        <div className="mb-4 p-4 bg-white/6 rounded-xl">
          <h3 className="font-semibold mb-2">Emergency contacts</h3>
          <ul>
            {me?.emergency_contacts?.length ? me.emergency_contacts.map(c => <li key={c.id}>{c.contact_email}</li>) : <li className="text-gray-300">None</li>}
          </ul>
        </div>

        <div className="mb-4 p-4 bg-white/6 rounded-xl flex items-center justify-between">
          <div>
            <div className="font-semibold">Location sharing</div>
            <div className="text-sm text-gray-300">Share live location during emergencies</div>
          </div>
          <div>
            <button onClick={() => setLocationSharing(s => !s)} className={`px-4 py-2 rounded-lg ${locationSharing ? "bg-green-500" : "bg-white/6"}`}>{locationSharing ? "On" : "Off"}</button>
          </div>
        </div>

        <div className="mt-6">
          <button onClick={logout} className="w-full py-3 bg-white/6 rounded-xl text-white">Logout</button>
        </div>
      </div>
    </div>
  );
}
