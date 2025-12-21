// src/components/SignCameraWordBuilder.js
import React, { useRef, useState } from "react";
import SignCamera from "./SignCamera";

/**
 * Simple wrapper that uses SignCamera and builds a linear sentence string.
 *
 * Props:
 *  - onSentenceChange(sentenceString)
 */
export default function SignCameraWordBuilder({ onSentenceChange }) {
  const [sentence, setSentence] = useState("");
  const lastAppendedRef = useRef(null);

  function appendLetter(letter) {
    const newSentence = sentence + letter;
    setSentence(newSentence);
    onSentenceChange && onSentenceChange(newSentence);
    lastAppendedRef.current = letter;
  }

  function backspace() {
    const newSentence = sentence.slice(0, -1);
    setSentence(newSentence);
    onSentenceChange && onSentenceChange(newSentence);
    lastAppendedRef.current = null;
  }

  function clearSentence() {
    setSentence("");
    onSentenceChange && onSentenceChange("");
    lastAppendedRef.current = null;
  }

  return (
    <div className="mt-4">
      <SignCamera
        onRecognizedText={(letter) => {
          if (!letter) return;

          const token = String(letter).toLowerCase();

          // guard against rapid immediate duplicates
          if (lastAppendedRef.current && lastAppendedRef.current.toLowerCase() === token) {
            return;
          }

          if (token === "space") {
            appendLetter(" ");
            return;
          }

          if (/^[a-z]$/.test(token)) {
            appendLetter(token.toUpperCase());
            return;
          }

          // if recognizer returns a full word, append it with a space
          if (token.length > 1) {
            // separate words by space
            appendLetter((sentence && !sentence.endsWith(" ") ? " " : "") + token);
            return;
          }
        }}
      />

      <div className="mt-4 flex gap-3">
        <button onClick={backspace} className="bg-gray-600 text-white px-4 py-2 rounded">
          ⌫ Backspace
        </button>

        <button onClick={clearSentence} className="bg-red-500 text-white px-4 py-2 rounded">
          Clear
        </button>
      </div>

      <div className="mt-4 p-3 border rounded bg-gray-50">
        <strong>Current message:</strong>
        <div className="mt-2 text-lg">{sentence || "—"}</div>
      </div>
    </div>
  );
}
