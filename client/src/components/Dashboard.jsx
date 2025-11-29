import React, { useState, useEffect } from "react";

export default function Dashboard({ user }) {
  const [lastId, setLastId] = useState(0);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // poll every 3 seconds
    const id = setInterval(async () => {
      const res = await fetch(`http://127.0.0.1:5000/api/emergency/poll?user=${user}&last_id=${lastId}`);
      const data = await res.json();
      if (data.events && data.events.length) {
        setEvents(prev => [...prev, ...data.events]);
        setLastId(data.events[data.events.length - 1].id);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [lastId, user]);

  const triggerEmergency = async () => {
    const payload = { from_user: user, to_user: null, message: "I need help", type: "call" };
    await fetch("http://127.0.0.1:5000/api/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    alert("Emergency sent (in-app)");
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <button onClick={triggerEmergency}>Trigger Emergency (in-app)</button>
      <h3>Events</h3>
      <ul>
        {events.map(e => (
          <li key={e.id}><b>{e.type}</b> from {e.from_user} at {e.created_at}: {e.message}</li>
        ))}
      </ul>
    </div>
  );
}
