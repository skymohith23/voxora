import os
SOURCE_DIR = "/Users/mohithachar/Desktop/ASL_Data/Organized_Videos"
if not os.path.exists(SOURCE_DIR):
    print("❌ FOLDER NOT FOUND: Check the path spelling.")
else:
    files = [f for root, dirs, files in os.walk(SOURCE_DIR) for f in files if f.endswith('.mp4')]
    print(f"✅ SUCCESS! Total MP4s found: {len(files)}")
