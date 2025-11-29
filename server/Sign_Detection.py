# Sign_Detection.py
import cv2
import mediapipe as mp
import numpy as np

mp_hands = mp.solutions.hands

def detect_sign_from_file(image_path):
    """
    Simple placeholder sign detection using MediaPipe hands landmarks:
    - If no hand detected -> label "none"
    - If 1 hand + many fingers extended -> return "wave" (example)
    This is a placeholder; replace with your trained classifier later.
    Returns (label, confidence)
    """
    image = cv2.imread(image_path)
    if image is None:
        return ("error_no_image", 0.0)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    with mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5) as hands:
        results = hands.process(image_rgb)
        if not results.multi_hand_landmarks:
            return ("no_hand", 0.9)
        landmarks = results.multi_hand_landmarks[0].landmark
        # crude heuristic: count how many fingertips are up (index, middle, ring, pinky, thumb)
        tips_ids = [4, 8, 12, 16, 20]
        wrist_y = landmarks[0].y
        count_up = 0
        for tip in tips_ids:
            if landmarks[tip].y < landmarks[tip - 2].y:  # very rough
                count_up += 1
        if count_up >= 4:
            return ("open_hand", 0.95)
        elif count_up == 0:
            return ("fist", 0.9)
        else:
            # as example, map counts to labels
            return (f"{count_up}_fingers", 0.8)
