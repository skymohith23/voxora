// client/src/components/InAppCall.js
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER = ""; // empty uses same origin; if server on different port use "http://localhost:5000"

export default function InAppCall({ username }) {
  const localVideo = useRef();
  const remoteVideo = useRef();
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const [target, setTarget] = useState("");

  useEffect(() => {
    const socket = io(SERVER || "/", { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("identify", { username });
    });

    socket.on("incoming_call", async (data) => {
      const { from, offer } = data;
      const accept = window.confirm(`Incoming call from ${from}. Accept?`);
      if (!accept) {
        return;
      }
      await startLocalStream();
      const pc = createPeerConnection();
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("call_answer", { to: from, from: username, answer });
    });

    socket.on("call_answered", async (data) => {
      const { from, answer } = data;
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(answer);
      }
    });

    socket.on("ice_candidate", (data) => {
      const { candidate } = data;
      if (pcRef.current && candidate) {
        pcRef.current.addIceCandidate(candidate).catch(console.error);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [username]);

  const startLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.current.srcObject = stream;
    return stream;
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("ice_candidate", { to: target, from: username, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      remoteVideo.current.srcObject = e.streams[0];
    };

    // add local tracks
    const localStream = localVideo.current.srcObject;
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }
    return pc;
  };

  const callUser = async () => {
    if (!target) {
      alert("Enter username to call");
      return;
    }
    await startLocalStream();
    const pc = createPeerConnection();
    // add tracks now that we have local stream
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("call_offer", { to: target, from: username, offer: pc.localDescription });
  };

  return (
    <div>
      <h3>In-app call</h3>
      <div>
        <input placeholder="username to call" value={target} onChange={e=>setTarget(e.target.value)} />
        <button onClick={callUser}>Call</button>
      </div>
      <div style={{display:"flex",gap:10,marginTop:10}}>
        <video ref={localVideo} autoPlay muted style={{width:200,border:"1px solid #ccc"}} />
        <video ref={remoteVideo} autoPlay style={{width:200,border:"1px solid #ccc"}} />
      </div>
    </div>
  );
}
