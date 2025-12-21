# fix_labels.py
import os
from pathlib import Path

# Path to your REAL training folder
train_dir = Path(r"D:\ASL_DATASET\Train_Alphabet")

if not train_dir.exists():
    print("❌ ERROR: Training folder does NOT exist at:", train_dir)
    exit()

# Get class folders sorted alphabetically (this is exactly how Keras orders classes)
classes = sorted([d.name for d in train_dir.iterdir() if d.is_dir()])

print("Found class folders:")
for i, c in enumerate(classes):
    print(i, c)

# Write labels_correct.txt into server/asl_model
out_path = Path("asl_model") / "labels_correct.txt"
out_path.write_text("\n".join(classes), encoding="utf-8")

print("\n✔ labels_correct.txt generated at:", out_path)
print("Compare it with existing labels.txt and replace if needed.")
