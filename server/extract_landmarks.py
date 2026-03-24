import cv2
import mediapipe as mp
import os
import numpy as np

# Initialize MediaPipe
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)

def extract_landmarks(frame):
    # Process the frame to find the body "skeleton"
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = holistic.process(image)
    
    # Get Pose (33 points), Left Hand (21 points), and Right Hand (21 points)
    pose = np.array([[res.x, res.y, res.z] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    
    return np.concatenate([pose, lh, rh])

# Define paths
VIDEO_PATH = 'emergency_videos'
DATA_PATH = 'emergency_data'

if not os.path.exists(DATA_PATH):
    os.makedirs(DATA_PATH)

print("Starting landmark extraction...")

for video_file in os.listdir(VIDEO_PATH):
    if not video_file.endswith(".mp4"): continue
    
    cap = cv2.VideoCapture(os.path.join(VIDEO_PATH, video_file))
    all_frames_landmarks = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        
        # Turn current frame into numbers
        landmarks = extract_landmarks(frame)
        all_frames_landmarks.append(landmarks)
        
    cap.release()
    
    # Save as a .npy file (Numerical data)
    file_name = video_file.replace('.mp4', '.npy')
    np.save(os.path.join(DATA_PATH, file_name), np.array(all_frames_landmarks))
    print(f"Finished: {video_file}")

print("Done! Check the 'emergency_data' folder.")