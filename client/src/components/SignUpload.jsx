import React, { useState } from "react";
import axios from "axios";

export default function SignUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert("Select a file first");
    const fd = new FormData();
    fd.append("file", file);

    const res = await axios.post("http://127.0.0.1:5000/api/sign", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setResult(res.data);
  }

  return (
    <div className="card">
      <h2>Upload sign image</h2>
      <form onSubmit={handleUpload}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Detect</button>
      </form>
      {result && (
        <div className="result">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
