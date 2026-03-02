import os
import numpy as np
import json
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Input, Dropout
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical

# 1. Load the labels we just created
with open('label_map.json', 'r') as f:
    label_map = json.load(f)

DATA_PATH = "/Users/Shared/Data_Input/Processed_Landmarks"
actions = list(label_map.keys())

sequences, labels = [], []
print("📂 Loading .npy files into memory...")

for action in actions:
    action_path = os.path.join(DATA_PATH, action)
    # Get all .npy files in this category
    files = [f for f in os.listdir(action_path) if f.endswith('.npy')]
    for npy_file in files:
        res = np.load(os.path.join(action_path, npy_file))
        sequences.append(res)
        labels.append(label_map[action])

X = np.array(sequences)
y = to_categorical(labels).astype(int)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.05, random_state=42)

# 2. Build the Model
model = Sequential([
    Input(shape=(30, 258)),
    LSTM(64, return_sequences=True, activation='tanh'),
    LSTM(128, return_sequences=True, activation='tanh'),
    LSTM(64, return_sequences=False, activation='tanh'),
    Dense(64, activation='relu'),
    Dense(32, activation='relu'),
    Dense(len(actions), activation='softmax')
])

model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])

# 3. M4-Friendly Training
# We add EarlyStopping to prevent overheating/overtraining
early_callback = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
checkpoint = ModelCheckpoint('asl_model.h5', monitor='val_categorical_accuracy', save_best_only=True)

print(f"🚀 Training on {len(X)} samples across {len(actions)} classes...")
model.fit(X_train, y_train, epochs=100, batch_size=32, 
          validation_data=(X_test, y_test), 
          callbacks=[checkpoint, early_callback])

print("✅ Training complete! Model saved as 'asl_model.h5'")