import cv2
import mediapipe as mp
import numpy as np
import os

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1)
mp_draw = mp.solutions.drawing_utils

X = []
y = []

label = input("Enter label (A-Z): ").upper()

cap = cv2.VideoCapture(0)

print("Press SPACE to capture, ESC to exit")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        for handLms in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, handLms, mp_hands.HAND_CONNECTIONS)

            data = []
            for lm in handLms.landmark:
                data.extend([lm.x, lm.y, lm.z])

            cv2.putText(frame, f"Label: {label}", (50,50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

    cv2.imshow("Collect Data", frame)

    key = cv2.waitKey(1)

    if key == 32:  # SPACE
        if result.multi_hand_landmarks:
            X.append(data)
            y.append(ord(label) - 65)
            print("Captured sample!")

    if key == 27:  # ESC
        break

np.save("X.npy", np.array(X))
np.save("y.npy", np.array(y))

cap.release()
cv2.destroyAllWindows()