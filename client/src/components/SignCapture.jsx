import React, { useState } from "react";

export default function SignCapture() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const upload = async () => {
    if (!file) return alert("Choose a file first");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("http://127.0.0.1:5000/api/sign-detect", {
      method: "POST",
      body: form
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div>
      <h2>Detect Sign (demo)</h2>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={upload}>Upload & Detect</button>
      {result && (
        <div>
          <h3>Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
