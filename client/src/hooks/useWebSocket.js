import { useEffect, useRef } from "react";
import { API_BASE } from "../api";

export default function useWebSocket(email, onMessage) {
  const wsRef = useRef(null);

  useEffect(() => {
    if (!email) return;
    const url = `${API_BASE.replace(/^http/, "ws")}/ws/alerts/${encodeURIComponent(email)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => console.log("WS connected", url);
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        onMessage && onMessage(data);
      } catch (e) { console.warn("ws parse", e); }
    };
    ws.onerror = (e) => console.warn("ws error", e);
    ws.onclose = () => console.log("WS closed");

    return () => {
      try { ws.close(); } catch {}
    };
  }, [email, onMessage]);

  const send = (obj) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(obj));
      }
    } catch (e) { console.warn("ws send error", e); }
  };

  return { send };
}
