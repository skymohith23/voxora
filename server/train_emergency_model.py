import numpy as np
import os
import json
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

# 1. Setup Labels from your actual JSON data
with open('id_to_word.json', 'r') as f:
    id_to_word = json.load(f)

# Auto-create the actions list based on what is actually in your data
actions = np.unique(list(id_to_word.values()))
label_map = {label:num for num, label in enumerate(actions)}
print(f"Training for these words: {actions}")

# 2. Load and Fix Data
sequences, labels = [], []
DATA_PATH = 'emergency_data'

print("Loading data...")
for npy_file in os.listdir(DATA_PATH):
    # Only process .npy files
    if not npy_file.endswith('.npy'): continue
    
    video_id = npy_file.split('.')[0]
    
    # Check if this video_id exists in our map
    if video_id not in id_to_word:
        continue
        
    try:
        res = np.load(os.path.join(DATA_PATH, npy_file))
        
        # SAFETY CHECK: Skip empty files
        if res.size == 0 or len(res.shape) < 2:
            continue
            
        # Standardize to 30 frames (Pad or Trim)
        if len(res) >= 30:
            sequences.append(res[:30]) 
        else:
            pad = np.zeros((30 - len(res), res.shape[1]))
            sequences.append(np.concatenate([res, pad]))
        
        # Get the word name and convert to its number (index)
        word_label = id_to_word[video_id]
        labels.append(label_map[word_label])
        
    except Exception as e:
        print(f"Error loading {npy_file}: {e}")
        continue

# 3. Check if we actually have data
if len(sequences) == 0:
    print("❌ ERROR: No valid sequences found in 'emergency_data'. Are the .npy files empty?")
else:
    # 4. Prepare for Training
    X = np.array(sequences)
    y = to_categorical(labels).astype(int)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.05)

    # 5. Build the LSTM Model
    model = Sequential()
    # input_shape is (30 frames, number of landmarks)
    model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(30, X.shape[2])))
    model.add(Dropout(0.2)) 
    model.add(LSTM(128, return_sequences=False, activation='relu'))
    model.add(Dropout(0.2))
    model.add(Dense(64, activation='relu'))
    model.add(Dense(len(actions), activation='softmax'))

    model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])

    # 6. Train
    print(f"Starting Training on {len(X)} valid samples...")
    model.fit(X_train, y_train, epochs=200)

    # 7. Save the Brain
    model.save('emergency_model.h5')
    print("✅ Success! Model saved as emergency_model.h5")