// client/src/pages/EmergencyText.js
import React, { useEffect, useRef, useState } from "react";
import SignCamera from "../components/SignCamera";
import SignWordBuilder from "../components/SignWordBuilder";
import { apiSendEmergencyText, apiMe } from "../api";

export default function EmergencyText() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [toEmail, setToEmail] = useState("");
  const [word, setWord] = useState("");
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    async function load() {
      if (!user?.user_id) return;
      try {
        const r = await apiMe(user.user_id);
        setContacts(r.data.emergency_contacts || []);
        if ((r.data.emergency_contacts || []).length) setToEmail(r.data.emergency_contacts[0].contact_email);
      } catch {}
    }
    load();
  }, [user?.user_id]);

  async function send() {
    if (!toEmail) return alert("Select contact");
    const text = word.trim();
    if (!text) return alert("No message");
    try {
      await apiSendEmergencyText(user.email, toEmail, text);
      alert("Sent: " + text);
      setWord("");
    } catch (e) {
      alert("Send failed");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130426] via-[#2a005d] to-[#1a0b3a] p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-4">Emergency Text</h1>

        <div className="bg-white/5 p-4 rounded-2xl mb-4">
          <SignCamera onRecognizedText={(ltr) => {
            // send letters into word builder helper
            window.__FEED_LETTER && window.__FEED_LETTER(ltr);
          }} captureInterval={700} />
        </div>

        <SignWordBuilder onSendSentence={(s) => setWord(s)} />

        <div className="mt-4 p-4 bg-white/6 rounded-xl text-white">
          <div className="mb-3">
            <label className="text-sm text-gray-300">Send to</label>
            <select className="w-full p-2 rounded-md bg-white/6 text-white mt-1"
              value={toEmail} onChange={(e) => setToEmail(e.target.value)}>
              <option value="">Pick contact</option>
              {contacts.map(c => <option key={c.id} value={c.contact_email}>{c.contact_email}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <div className="text-sm text-gray-300">Preview</div>
            <div className="mt-2 text-lg text-white">{word || "—"}</div>
          </div>

          <button onClick={send} className="w-full py-3 bg-purple-600 rounded-xl text-white font-semibold">Send as Emergency Text</button>
        </div>
      </div>
    </div>
  );
}
