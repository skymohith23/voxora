# sign_detection.py
import cv2
import mediapipe as mp
import numpy as np
import base64
import tempfile
from pathlib import Path

mp_hands = mp.solutions.hands

def detect_sign_from_b64(b64_image: str) -> str:
    """
    Accepts a base64-encoded image (data only, no data:prefix).
    Runs MediaPipe Hands and returns a very simple text result (demo).
    Replace with your trained classifier by extracting landmarks and predicting.
    """
    try:
        imgdata = base64.b64decode(b64_image)
        tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        tmp.write(imgdata)
        tmp.flush()
        tmp_path = tmp.name
        tmp.close()
        image = cv2.imread(tmp_path)
        if image is None:
            return "could not read image"
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        with mp_hands.Hands(static_image_mode=True, max_num_hands=2) as hands:
            results = hands.process(image_rgb)
            if not results.multi_hand_landmarks:
                return "no hand detected"
            n = len(results.multi_hand_landmarks)
            # Placeholder mapping — return demo text
            return f"{n} hand(s) detected — demo phrase"
    except Exception as e:
        return f"error: {str(e)}"
