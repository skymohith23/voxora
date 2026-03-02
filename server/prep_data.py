import cv2
import os
import zipfile
import shutil
import numpy as np
from pathlib import Path

# NEW ROBUST PATH LOGIC
# This finds the Desktop regardless of iCloud settings
BASE_DIR = Path(os.path.expanduser("~/Desktop"))
CITIZEN_ZIP = BASE_DIR / "asl-citizen.zip"
ALPHABET_ZIP = BASE_DIR / "asl-alphabet.zip"
OUTPUT_DIR = BASE_DIR / "ASL_Data" / "merged_training_set"

IMG_SIZE = (224, 224)

def stream_extract():
    # Ensure the output directory structure exists
    if not (BASE_DIR / "ASL_Data").exists():
        os.makedirs(BASE_DIR / "ASL_Data")
    
    if OUTPUT_DIR.exists(): shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    # Process Zips
    for zip_path in [CITIZEN_ZIP, ALPHABET_ZIP]:
        if not zip_path.exists():
            # If still not found, let's print the actual path it's looking at to debug
            print(f"❌ Still can't find: {zip_path}")
            continue
            
        print(f"🚀 Found {zip_path.name}! Processing...")
        with zipfile.ZipFile(zip_path, 'r') as z:
            # Code to extract and resize as before...
            files = [f for f in z.namelist() if f.endswith(('.mp4', '.jpg', '.png'))]
            for f_path in files:
                label = f_path.split('/')[-1].split('_')[0].upper()
                if len(label) > 1 and not f_path.endswith('.mp4'): continue
                
                target_folder = OUTPUT_DIR / label
                os.makedirs(target_folder, exist_ok=True)

                if f_path.endswith('.mp4'):
                    z.extract(f_path, "temp")
                    cap = cv2.VideoCapture(f"temp/{f_path}")
                    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                    for i in range(5):
                        cap.set(cv2.CAP_PROP_POS_FRAMES, int((total/5)*i))
                        ret, frame = cap.read()
                        if ret:
                            frame = cv2.resize(frame, IMG_SIZE)
                            cv2.imwrite(str(target_folder / f"vid_{Path(f_path).stem}_{i}.jpg"), frame)
                    cap.release()
                else:
                    data = z.read(f_path)
                    nparr = np.frombuffer(data, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if img is not None:
                        img = cv2.resize(img, IMG_SIZE)
                        cv2.imwrite(str(target_folder / Path(f_path).name), img)

    if os.path.exists("temp"): shutil.rmtree("temp")
    print(f"✅ Setup Complete! Data ready at: {OUTPUT_DIR}")

if __name__ == "__main__":
    stream_extract()
