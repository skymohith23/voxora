import json
import os
import requests

# 1. Load your filtered list
with open('emergency_list.json', 'r') as f:
    emergency_data = json.load(f)

# 2. Create a folder to save videos
if not os.path.exists('emergency_videos'):
    os.makedirs('emergency_videos')

print("Starting download...")

for entry in emergency_data:
    word = entry['gloss']
    for instance in entry['instances']:
        video_id = instance['video_id']
        url = instance['url']
        
        # Define file path
        file_path = f"emergency_videos/{video_id}.mp4"
        
        if not os.path.exists(file_path):
            try:
                print(f"Downloading {word} (ID: {video_id})...")
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    with open(file_path, 'wb') as f:
                        f.write(response.content)
            except Exception as e:
                print(f"Could not download {video_id}: {e}")

print("Download process finished!")