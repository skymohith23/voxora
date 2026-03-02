import os
import json
from pathlib import Path

DATA_PATH = Path("/Users/Shared/Data_Input/Processed_Landmarks")
actions = sorted([d.name for d in DATA_PATH.iterdir() if d.is_dir()])
label_map = {label: num for num, label in enumerate(actions)}

with open('label_map.json', 'w') as f:
    json.dump(label_map, f)

print(f"✅ Created label_map.json with {len(actions)} classes.")