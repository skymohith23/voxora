<<<<<<< HEAD
import os
import numpy as np
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input, BatchNormalization
from tensorflow.keras.preprocessing.sequence import pad_sequences

# 1. Setup Labels
DATA_PATH = 'MP_Data'
actions = np.array([d for d in os.listdir(DATA_PATH) if not d.startswith('.')])
label_map = {label:num for num, label in enumerate(actions)}

sequences, labels = [], []
MAX_FRAMES = 30

# 2. Load and Clean Data
for action in actions:
    action_path = os.path.join(DATA_PATH, action)
    video_ids = [v for v in os.listdir(action_path) if not v.startswith('.')]
    for video_id in video_ids:
        res = np.load(os.path.join(action_path, video_id, "sequence.npy"))
        # Standardize length
        if len(res) > MAX_FRAMES:
            res = res[:MAX_FRAMES]
        else:
            res = pad_sequences([res], maxlen=MAX_FRAMES, padding='post', dtype='float32')[0]
        sequences.append(res)
        labels.append(label_map[action])

X = np.array(sequences)
y = to_categorical(labels).astype(int)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)

# 3. Improved Architecture (Stable for Mac Metal)
model = Sequential()
model.add(Input(shape=(30, 258)))
# Switched 'relu' to 'tanh' (Standard for LSTMs) and added BatchNormalization
model.add(LSTM(64, return_sequences=True, activation='tanh'))
model.add(BatchNormalization())
model.add(LSTM(128, return_sequences=True, activation='tanh'))
model.add(Dropout(0.3))
model.add(LSTM(64, return_sequences=False, activation='tanh'))
model.add(BatchNormalization())
model.add(Dense(64, activation='relu'))
model.add(Dense(actions.shape[0], activation='softmax'))

# 4. Compile with a slower Learning Rate
from tensorflow.keras.optimizers import Adam
optimizer = Adam(learning_rate=0.0001) # Slower helps stabilize high loss
model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['categorical_accuracy'])

# 5. Train
model.fit(X_train, y_train, epochs=150, batch_size=16) # Smaller batch size for small data
model.save('emergency_model.keras') # Using the new recommended format
np.save('actions.npy', actions)

print("✅ Refined Model trained and saved as 'emergency_model.keras'")
=======
import numpy as np
import os
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping

# --- CONFIG ---
DATA_PATH = os.path.join('data', 'MP_Data')
# Filter out hidden files like .DS_Store
actions = np.array(sorted([f for f in os.listdir(DATA_PATH) if not f.startswith('.')]))
no_sequences = 30 
sequence_length = 30 

label_map = {label:num for num, label in enumerate(actions)}

sequences, labels = [], []
print("🔄 Loading data with Zero-Padding for short videos...")

for action in actions:
    action_path = os.path.join(DATA_PATH, action)
    sequence_folders = sorted([f for f in os.listdir(action_path) if not f.startswith('.')])
    
    for sequence in sequence_folders[:no_sequences]:
        window = []
        for frame_num in range(sequence_length):
            try:
                # Try to load the frame
                res = np.load(os.path.join(DATA_PATH, action, sequence, f"{frame_num}.npy"))
                window.append(res)
            except FileNotFoundError:
                # Pad with zeros if the video was too short
                window.append(np.zeros(258))
        
        sequences.append(window)
        labels.append(label_map[action])

print(f"✅ Loaded {len(sequences)} sequences across {len(actions)} classes.")

# --- 3. PREPROCESS ---
X = np.array(sequences)
y = to_categorical(labels).astype(int)

# Use 10% for testing to ensure we can include 126 classes in the test set
try:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, stratify=y)
    print("✅ Split data using stratification.")
except ValueError:
    # Fallback if some classes have only 1 video/sequence total
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1)
    print("⚠️ Warning: Could not stratify. Proceeding with standard split.")

# --- 4. BUILD THE LSTM MODEL ---
model = Sequential()
model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(30, 258)))
model.add(BatchNormalization())
model.add(LSTM(128, return_sequences=True, activation='relu'))
model.add(LSTM(64, return_sequences=False, activation='relu'))
model.add(BatchNormalization())
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(Dense(actions.shape[0], activation='softmax'))

model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])

# --- 5. TRAIN ---
print("🚀 Training starting...")
early_stop = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True)

# Training will stop automatically once val_loss stops improving
model.fit(X_train, y_train, epochs=150, batch_size=32, validation_data=(X_test, y_test), callbacks=[early_stop])

# --- 6. SAVE ---
model.save('voxora_model.h5')
print("✨ MODEL SAVED AS voxora_model.h5")
>>>>>>> aec9d655949f5706387b7100bde62e811f3f8dfc
