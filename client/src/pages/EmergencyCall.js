// client/src/pages/EmergencyCall.js
import React, { useEffect, useState } from "react";
import SignCamera from "../components/SignCamera";
import SignWordBuilder from "../components/SignWordBuilder";
import { apiMe, apiLoginCall } from "../api";

/**
 * NOTE:
 * This page is a UI scaffold for the emergency call flow.
 * Actual WebRTC signalling and audio piping will be integrated later.
 */
export default function EmergencyCall() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      if (!user?.user_id) return;
      try {
        const r = await apiMe(user.user_id);
        setContacts(r.data.emergency_contacts || []);
      } catch (e) { }
    }
    load();
  }, [user?.user_id]);

  async function startCall() {
    if (!selected) return alert("Pick a contact");
    try {
      await apiLoginCall(user.email, selected.contact_email);
      setInCall(true);
    } catch {
      alert("Call request failed");
    }
  }

  function endCall() {
    // TODO: tear down WebRTC when implemented
    setInCall(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130426] via-[#2a005d] to-[#1a0b3a] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-4">Emergency Call</h1>

        {!inCall ? (
          <>
            <div className="mb-4">
              <label className="text-sm text-gray-300">Select emergency contact</label>
              <div className="mt-2 flex flex-col gap-3">
                {contacts.length === 0 && <div className="text-gray-300">No contacts — add from Contacts</div>}
                {contacts.map(c => (
                  <div key={c.id}
                       onClick={() => setSelected(c)}
                       className={`p-3 rounded-lg cursor-pointer ${selected?.id === c.id ? "bg-purple-700/60" : "bg-white/6"} text-white`}>
                    {c.contact_email}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={startCall} className="w-full py-3 bg-red-600 rounded-xl text-white font-semibold">Start Emergency Call</button>
          </>
        ) : (
          <>
            <div className="bg-white/5 rounded-2xl p-3 mb-3">
              <div className="text-sm text-gray-300">Connected with</div>
              <div className="text-white text-lg font-semibold">{selected?.contact_email}</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 mb-3">
              <SignCamera onRecognizedText={(ltr) => {
                // convert sign -> text -> TTS will be wired later
                window.__FEED_LETTER && window.__FEED_LETTER(ltr);
              }} captureInterval={700} />
            </div>

            <SignWordBuilder onSendSentence={(s) => setMessage(s)} />

            <div className="mt-4">
              <div className="mb-3 text-white">Live message (sent as TTS when integrated):</div>
              <div className="p-3 bg-white/6 rounded-lg text-white">{message || "—"}</div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={endCall} className="py-3 bg-red-600 rounded-xl text-white font-semibold">End Call</button>
              <button onClick={() => alert("Mute/unmute (not implemented)")} className="py-3 bg-white/6 rounded-xl text-white">Mute</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
