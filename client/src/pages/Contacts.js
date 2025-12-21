// client/src/pages/Contacts.js
import React, { useEffect, useState } from "react";
import { apiMe, apiAddContact } from "../api";

export default function Contacts() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.user_id;
  const [contacts, setContacts] = useState([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line
  }, [userId]);

  async function load() {
    try {
      const res = await apiMe(userId);
      setContacts(res.data.emergency_contacts || []);
    } catch (e) {
      console.warn(e);
    }
  }

  async function add() {
    if (!email) return;
    try {
      await apiAddContact(userId, email);
      setEmail("");
      load();
    } catch (e) {
      alert("Add failed");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130426] via-[#2a005d] to-[#1a0b3a] p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-4">Emergency Contacts</h1>

        <div className="mb-4 flex gap-3">
          <input className="flex-1 p-3 rounded-xl bg-white/6 text-white" placeholder="contact email" value={email} onChange={e=>setEmail(e.target.value)} />
          <button onClick={add} className="py-3 px-4 bg-green-600 rounded-xl text-white">Add</button>
        </div>

        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-gray-300">No contacts yet</div>
          ) : contacts.map(c => (
            <div key={c.id} className="p-3 bg-white/6 rounded-xl flex justify-between items-center text-white">
              <div>{c.contact_email}</div>
              <div>
                <button onClick={() => {
                  if (!confirm("Delete contact locally?")) return;
                  setContacts(s => s.filter(x => x.id !== c.id));
                }} className="text-red-400">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
