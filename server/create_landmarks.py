import cv2
import numpy as np
import os
import mediapipe as mp
import json

# 1. Setup MediaPipe
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# 2. Setup Paths
DATA_PATH = 'MP_Data'
SOURCE_PATH = 'emergency_subset'
JSON_PATH = 'archive/WLASL_v0.3.json'

# 3. Create a Map of VideoID -> Word
with open(JSON_PATH, 'r') as f:
    index_data = json.load(f)

label_map = {}
for entry in index_data:
    gloss = entry['gloss'].lower()
    for inst in entry['instances']:
        label_map[str(inst['video_id'])] = gloss

# 4. Processing Function
def extract_keypoints(results):
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, lh, rh])

# 5. Loop through your 64 videos
print(f"Starting extraction from {SOURCE_PATH}...")

for video_file in os.listdir(SOURCE_PATH):
    if not video_file.endswith('.mp4'): continue
    
    video_id = video_file.split('.')[0]
    word = label_map.get(video_id, "unknown")
    
    cap = cv2.VideoCapture(os.path.join(SOURCE_PATH, video_file))
    sequence = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        
        # Make detections
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = holistic.process(image)
        
        # Extract keypoints
        keypoints = extract_keypoints(results)
        sequence.append(keypoints)
    
    cap.release()
    
    # Save the sequence
    target_dir = os.path.join(DATA_PATH, word, video_id)
    os.makedirs(target_dir, exist_ok=True)
    np.save(os.path.join(target_dir, 'sequence.npy'), np.array(sequence))
    print(f"Processed: {word} ({video_id})")

print("\n✅ All 64 videos converted to AI skeletons!")
