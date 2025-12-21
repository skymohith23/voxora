// src/components/SignWordBuilder.js
import React, { useEffect, useRef, useState } from "react";

/**
 * SignWordBuilder
 *
 * Props:
 *  - detecting (unused currently) - boolean
 *  - onRecognizedLetter(letter) - optional callback for when a stable new letter is accepted
 *  - onSendSentence(sentence) - optional async callback when user presses Send
 *  - allowImmediateSend - unused (kept for API compatibility)
 *
 * This component exposes `window.__FEED_LETTER(letter)` for quick development/testing.
 * Use feedDetectedLetter to push letters (single chars) or multi-char words.
 */
export default function SignWordBuilder({
  detecting = false,
  onRecognizedLetter = null,
  onSendSentence = null,
  allowImmediateSend = true,
}) {
  const [liveLetter, setLiveLetter] = useState("");
  const [currentLetter, setCurrentLetter] = useState("");
  const [wordBuffer, setWordBuffer] = useState("");
  const [sentence, setSentence] = useState([]);
  const historyRef = useRef([]);
  const stabilityFrames = 3;

  // Feed a detected token (single letter like "A" or multi-letter word)
  async function feedDetectedLetter(letter) {
    const token = letter ? String(letter).trim() : null;

    if (!token) {
      historyRef.current.push(null);
    } else {
      // normalize single-letter tokens to uppercase
      historyRef.current.push(token.length === 1 ? token.toUpperCase() : token);
    }

    // keep sliding window
    if (historyRef.current.length > stabilityFrames) historyRef.current.shift();

    const arr = historyRef.current;
    // require stabilityFrames same non-null tokens OR accept multi-char word immediately
    if (token && token.length > 1) {
      // multi-char word candidate: add to wordBuffer but don't auto-confirm
      setLiveLetter(token);
      setCurrentLetter(token);
      setWordBuffer((w) => (w ? w + " " + token : token));
      historyRef.current = [];
      return;
    }

    if (arr.length === stabilityFrames && arr.every((x) => x && x === arr[0])) {
      const stable = arr[0];
      if (stable && stable !== currentLetter) {
        setCurrentLetter(stable);
        setWordBuffer((w) => (w ? w + stable : stable));
        if (typeof onRecognizedLetter === "function") {
          try {
            onRecognizedLetter(stable);
          } catch {}
        }
      }
      // reset history (prevents immediate duplicates)
      historyRef.current = [];
    }

    setLiveLetter(token || "");
  }

  useEffect(() => {
    // Expose for quick testing / integration
    window.__FEED_LETTER = feedDetectedLetter;
    return () => {
      try {
        delete window.__FEED_LETTER;
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function confirmWord() {
    if (!wordBuffer) return;
    setSentence((s) => [...s, wordBuffer]);
    setWordBuffer("");
    setCurrentLetter("");
    historyRef.current = [];
  }

  function clearWord() {
    setWordBuffer("");
    setCurrentLetter("");
    historyRef.current = [];
  }

  function removeWordAt(i) {
    setSentence((s) => s.filter((_, idx) => idx !== i));
  }

  async function sendSentence() {
    const final = sentence.join(" ").trim();
    if (!final) return alert("No message to send");
    if (typeof onSendSentence === "function") {
      try {
        await onSendSentence(final);
      } catch (e) {
        // swallow errors from caller
      }
    } else {
      alert("onSendSentence not provided. Sentence: " + final);
    }
    setSentence([]);
    setWordBuffer("");
    setCurrentLetter("");
    historyRef.current = [];
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="mb-3">
        <div className="text-sm text-gray-500">Live detection</div>
        <div className="text-2xl font-mono mt-1">{liveLetter || "—"}</div>
      </div>

      <div className="mb-3">
        <div className="text-sm text-gray-500">Stable letter (accepted)</div>
        <div className="text-3xl font-bold mt-1">{currentLetter || "—"}</div>
      </div>

      <div className="mb-3">
        <div className="text-sm text-gray-500">Word being built</div>
        <div className="text-2xl font-semibold mt-1">{wordBuffer || "—"}</div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={confirmWord}
          disabled={!wordBuffer}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          ✔ Confirm Word
        </button>

        <button onClick={clearWord} className="px-4 py-2 bg-gray-300 rounded">
          ✖ Clear Word
        </button>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-500">Sentence (preview)</div>
        <div className="mt-2 p-3 bg-gray-50 border rounded">
          {sentence.length === 0 ? (
            <div className="text-gray-400">No words yet</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sentence.map((w, i) => (
                <div key={i} className="flex items-center gap-2 bg-white border px-3 py-1 rounded">
                  <span>{w}</span>
                  <button onClick={() => removeWordAt(i)} className="text-red-500 text-sm">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={sendSentence} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded">
          📤 Send Sentence
        </button>
      </div>

      {/* hidden test helper */}
      <div style={{ display: "none" }}>
        <button id="__feed_test" onClick={() => feedDetectedLetter("A")}>
          feed A
        </button>
      </div>
    </div>
  );
}
