import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model

# 1. Load the model and your word list
model = load_model('emergency_model.h5')
# MUST be in the same order as the training script!
actions = np.array(['danger', 'doctor', 'emergency', 'help', 'hospital', 'hurt', 'medicine', 'police', 'sick', 'thief'])

# 2. Setup MediaPipe
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)

def extract_landmarks(results):
    pose = np.array([[res.x, res.y, res.z] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, lh, rh])

# 3. Real-time Detection Variables
sequence = []
sentence = []
threshold = 0.7 # Only show result if the AI is > 70% sure

cap = cv2.VideoCapture(0) # 0 is usually the default webcam
while cap.isOpened():
    ret, frame = cap.read()
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = holistic.process(image)
    
    # Extract landmarks and add to our 30-frame sequence
    landmarks = extract_landmarks(results)
    sequence.append(landmarks)
    sequence = sequence[-30:] # Keep only the last 30 frames
    
    if len(sequence) == 30:
        # Predict!
        res = model.predict(np.expand_dims(sequence, axis=0))[0]
        action = actions[np.argmax(res)]
        
        # Only show if confidence is high
        if res[np.argmax(res)] > threshold:
            print(f"Detected: {action} ({res[np.argmax(res)]*100:.2f}%)")
            cv2.putText(frame, action, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)

    cv2.imshow('Emergency Sign Detection', frame)
    if cv2.waitKey(10) & 0xFF == ord('q'): # Press 'q' to exit
        break

cap.release()
cv2.destroyAllWindows()