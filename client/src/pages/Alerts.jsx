import React, { useEffect, useState } from "react";
import { API_BASE, apiGetAlerts } from "../api";

export default function Alerts(){
  const user = JSON.parse(localStorage.getItem("user")||"{}");
  const [alerts,setAlerts] = useState([]);

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/me/alerts/${user.email}`);
      const j = await res.json();
      setAlerts(j.alerts || []);
    } catch(e){}
  }

  useEffect(()=>{ load(); }, []);

  return (
    <div style={{padding:20}}>
      <h3>Alerts</h3>
      <ul>{alerts.map(a => <li key={a.id}>{a.alert_type || a.message} — {a.from_user || a.from}</li>)}</ul>
    </div>
  );
}
