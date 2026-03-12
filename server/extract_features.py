import cv2
import numpy as np
import os
import mediapipe as mp
from glob import glob

# --- CONFIG ---
DATASET_PATH = './WLASL_100/train' 
OUTPUT_PATH = './data/MP_Data'
SEQUENCE_LENGTH = 30 
MAX_VIDEOS_PER_CLASS = 50 

# Initialize MediaPipe
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)

def extract_keypoints(results):
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, lh, rh])

class_counters = {}

print("🚀 Starting Hybrid Extraction (Videos + Image Sequences)...")

for root, dirs, files in os.walk(DATASET_PATH):
    # Sort files to ensure temporal order (1.png, 2.png, etc.)
    video_files = sorted([f for f in files if f.lower().endswith(('.mp4', '.avi'))])
    image_files = sorted([f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
    
    label = os.path.basename(root).lower()
    
    # Filter out top-level metadata or non-action folders
    if label.startswith('.') or label in ['train', 'a', 'b', 'c', 'd', 'e'] and not image_files:
        continue

    if label not in class_counters:
        class_counters[label] = 0
    if class_counters[label] >= MAX_VIDEOS_PER_CLASS:
        continue

    # --- CASE 1: FOLDER CONTAINS VIDEOS (WLASL / J / Z) ---
    if video_files:
        print(f"🎬 Processing Video Class: {label.upper()}")
        for video_name in video_files:
            if class_counters[label] >= MAX_VIDEOS_PER_CLASS: break
            
            cap = cv2.VideoCapture(os.path.join(root, video_name))
            save_dir = os.path.join(OUTPUT_PATH, label, str(class_counters[label]))
            os.makedirs(save_dir, exist_ok=True)
            
            f_idx = 0
            while cap.isOpened() and f_idx < SEQUENCE_LENGTH:
                ret, frame = cap.read()
                if not ret: break
                
                image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = holistic.process(image)
                np.save(os.path.join(save_dir, str(f_idx)), extract_keypoints(results))
                f_idx += 1
                
            cap.release()
            class_counters[label] += 1

    # --- CASE 2: FOLDER CONTAINS IMAGE SEQUENCES (A-Y) ---
    elif image_files:
        # We divide the total images by 30 to create multiple training "sequences"
        num_sequences = len(image_files) // SEQUENCE_LENGTH
        
        for seq in range(num_sequences):
            if class_counters[label] >= MAX_VIDEOS_PER_CLASS: break
            
            print(f"📸 Image Seq Class: {label.upper()} (Example {class_counters[label]})")
            save_dir = os.path.join(OUTPUT_PATH, label, str(class_counters[label]))
            os.makedirs(save_dir, exist_ok=True)
            
            start_img = seq * SEQUENCE_LENGTH
            for f_idx in range(SEQUENCE_LENGTH):
                img_path = os.path.join(root, image_files[start_img + f_idx])
                frame = cv2.imread(img_path)
                if frame is None: continue
                
                results = holistic.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                np.save(os.path.join(save_dir, str(f_idx)), extract_keypoints(results))
                
            class_counters[label] += 1

print(f"\n✨ FINAL TOTAL CLASSES: {len(class_counters)}")
alphabet = [k for k in class_counters.keys() if len(k) == 1]
print(f"🔠 Letters Extracted ({len(alphabet)}): {sorted(alphabet)}")