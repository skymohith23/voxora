import json
import os
import shutil
from pathlib import Path

# 1. Your Specialist List
target_words = ['help', 'doctor', 'sick', 'police', 'hospital', 'hurt', 'stop', 'emergency', 'fire']

# 2. Correct Path to your JSON
json_path = 'archive/WLASL_v0.3.json'

# 3. Setup Folders
# We will search the entire 'server' directory for the videos
SEARCH_DIR = '.'
TARGET_DIR = 'emergency_subset'
os.makedirs(TARGET_DIR, exist_ok=True)

# 4. Load the index
with open(json_path, 'r') as f:
    data = json.load(f)

# Create a map of ALL video files available on your disk for speed
print("Scanning disk for video files... (this may take a minute)")
video_pool = {}
for path in Path(SEARCH_DIR).rglob('*.mp4'):
    video_pool[path.name] = path

# 5. Copy matching videos
count = 0
for entry in data:
    gloss = entry['gloss'].lower()
    if gloss in target_words:
        print(f"Checking videos for: {gloss}")
        for instance in entry['instances']:
            video_id = instance['video_id']
            video_filename = f"{video_id}.mp4"
            
            if video_filename in video_pool:
                src = video_pool[video_filename]
                dst = os.path.join(TARGET_DIR, video_filename)
                shutil.copy(src, dst)
                count += 1

print(f"\n✅ Success! Found and moved {count} videos to '{TARGET_DIR}'.")
