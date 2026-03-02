import cv2
import mediapipe as mp
import numpy as np
import os
from pathlib import Path
from tqdm import tqdm

# --- VERIFIED PATHS ---
SOURCE_DIR = Path("/Users/Shared/Data_Input/Organized_Videos")
OUTPUT_DIR = Path("/Users/Shared/Data_Input/Processed_Landmarks")
SEQUENCE_LENGTH = 30 

def extract_landmarks_from_images(folder_path, holistic):
    # Numerical sort to ensure frames are in the right order (0, 1, 2...)
    image_files = sorted([f for f in folder_path.iterdir() if f.suffix.lower() in ['.jpg', '.jpeg']])
    
    if len(image_files) < 5: # Skip folders that are too short
        return None

    # Pick exactly 30 frames (uniformly distributed)
    indices = np.linspace(0, len(image_files) - 1, SEQUENCE_LENGTH, dtype=int)
    sampled_files = [image_files[i] for i in indices]
    
    sequence_data = []

    for img_path in sampled_files:
        img = cv2.imread(str(img_path))
        if img is None: continue
        
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = holistic.process(img_rgb)
        
        # Landmark Extraction (Pose: 132, LH: 63, RH: 63)
        pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(132)
        lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(63)
        rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(63)
        
        sequence_data.append(np.concatenate([pose, lh, rh]))

    return np.array(sequence_data) if len(sequence_data) == SEQUENCE_LENGTH else None

if __name__ == "__main__":
    tasks = []
    
    print(f"🔍 Scanning Categories in {SOURCE_DIR}...")
    
    # Check if we can even see the subfolders
    categories = [d for d in SOURCE_DIR.iterdir() if d.is_dir() and not d.name.startswith('.')]
    
    for category_dir in categories:
        # Find folders ending in .MP4 (which contain the JPEGs)
        for video_folder in category_dir.iterdir():
            if video_folder.is_dir() and not video_folder.name.startswith('.'):
                save_path = OUTPUT_DIR / category_dir.name / (video_folder.name + ".npy")
                if not save_path.exists():
                    save_path.parent.mkdir(parents=True, exist_ok=True)
                    tasks.append((video_folder, save_path))

    if not tasks:
        print("❌ No new tasks found. Double check the folder structure!")
    else:
        print(f"🚀 Found {len(tasks)} sequences. Powering up M4 Neural Engine...")
        mp_holistic = mp.solutions.holistic
        with mp_holistic.Holistic(static_image_mode=True, model_complexity=1) as holistic:
            for folder_path, s_path in tqdm(tasks, desc="Processing"):
                res = extract_landmarks_from_images(folder_path, holistic)
                if res is not None:
                    np.save(s_path, res)

    print("\n✅ Done!")