import json

# Path to your extracted index file
json_path = '/Users/mohithachar/Desktop/voxora/server/archive/WLASL_v0.3.json'

with open(json_path, 'r') as f:
    data = json.load(f)

# Words you want to check
target_words = ['help', 'sick', 'police', 'hurt', 'hospital', 'doctor', 'emergency', 'stop', 'fire', 'telephone', 'ambulance']

for entry in data:
    gloss = entry['gloss'].lower()
    if gloss in target_words:
        print(f"Word: {gloss}")
        print(f"Number of instances: {len(entry['instances'])}")
        print("-" * 20)
