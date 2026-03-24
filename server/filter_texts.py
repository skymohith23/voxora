
import json

# Load the map
with open('WLASL_v0.3.json', 'r') as f:
    data = json.load(f)

# Your target emergency words
emergency_words = [
    'danger', 'help', 'hurt', 'hospital', 'emergency', 
    'sick', 'doctor', 'police', 'thief', 
    'pain', 'medicine', 'ambulance' # Added these just in case
]
# Filter to get only these words
filtered_data = [item for item in data if item['gloss'] in emergency_words]

# Print how many videos you found
for entry in filtered_data:
    print(f"Word: {entry['gloss']} | Samples: {len(entry['instances'])}")

# Save this small list to a new file
with open('emergency_list.json', 'w') as f:
    json.dump(filtered_data, f, indent=4)