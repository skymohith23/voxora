import os
import shutil
from pathlib import Path

# Path to your messy folder
source_dir = Path.home() / "Desktop/ASL_Data/merged_training_set"
target_dir = Path.home() / "Desktop/ASL_Data/Organized_Videos"
os.makedirs(target_dir, exist_ok=True)

print("🚚 Organizing videos by word (No-Extension Mode)...")

all_files = os.listdir(source_dir)
count = 0

for file in all_files:
    # Skip hidden system files like .DS_Store
    if file.startswith('.'): continue
    
    file_path = source_dir / file
    # Only process if it's a file, not a folder
    if os.path.isfile(file_path):
        try:
            # Logic: split by dash, take the last part as the word
            if "-" in file:
                word = file.split("-")[-1].strip().upper()
                
                word_folder = target_dir / word
                os.makedirs(word_folder, exist_ok=True)
                
                # Move the file (even without extension)
                shutil.move(file_path, word_folder / file)
                count += 1
                
                if count % 1000 == 0:
                    print(f"✅ Moved {count} files...")
        except Exception as e:
            print(f"❌ Error moving {file}: {e}")

print(f"🎉 SUCCESS! Moved {count} files to 'Organized_Videos'.")
