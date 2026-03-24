import json
import os

# Load your emergency list
with open('emergency_list.json', 'r') as f:
    emergency_data = json.load(f)

# Create a map of Video ID -> Word
id_to_word = {}
for entry in emergency_data:
    word = entry['gloss']
    for instance in entry['instances']:
        id_to_word[str(instance['video_id'])] = word

# Save this map for the training script
with open('id_to_word.json', 'w') as f:
    json.dump(id_to_word, f)

print("Label map created! Ready for training.")