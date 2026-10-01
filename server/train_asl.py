import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import json
import os

# 🔹 FIXED DATASET PATH (IMPORTANT)
DATASET_PATH = "datasets/asl_alphabet/asl_alphabet_train"

# 🔹 Image settings
IMG_SIZE = (64, 64)
BATCH_SIZE = 64

# 🔹 Check dataset exists
if not os.path.exists(DATASET_PATH):
    raise ValueError(f"❌ Dataset path not found: {DATASET_PATH}")

# 🔹 Debug: list folders (to ensure correct structure)
print("\n📂 Checking dataset folders...")
folders = os.listdir(DATASET_PATH)
print("Found folders:", folders)

if len(folders) < 10:
    raise ValueError("❌ Dataset structure looks wrong. Expected multiple class folders (A-Z etc.)")

# 🔹 Data preprocessing
datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2
)

# 🔹 Train generator
train_gen = datagen.flow_from_directory(
    DATASET_PATH,
    target_size=IMG_SIZE,
    color_mode="grayscale",
    class_mode="categorical",
    batch_size=BATCH_SIZE,
    subset="training"
)

# 🔹 Validation generator
val_gen = datagen.flow_from_directory(
    DATASET_PATH,
    target_size=IMG_SIZE,
    color_mode="grayscale",
    class_mode="categorical",
    batch_size=BATCH_SIZE,
    subset="validation"
)

# 🔹 Get number of classes
num_classes = len(train_gen.class_indices)

print("\n✅ Classes detected:")
print(train_gen.class_indices)
print("✅ Total classes:", num_classes)

# 🔹 Safety check (prevents previous bug)
if num_classes <= 1:
    raise ValueError("❌ Only 1 class detected. Fix dataset path!")

# 🔹 Save label mapping
with open("labels.json", "w") as f:
    json.dump(train_gen.class_indices, f)

print("💾 labels.json saved")

# 🔹 Model
model = models.Sequential([
    layers.Input(shape=(64, 64, 1)),

    layers.Conv2D(32, (3,3), activation='relu'),
    layers.MaxPooling2D(2,2),

    layers.Conv2D(64, (3,3), activation='relu'),
    layers.MaxPooling2D(2,2),

    layers.Conv2D(128, (3,3), activation='relu'),
    layers.MaxPooling2D(2,2),

    layers.Flatten(),

    layers.Dense(128, activation='relu'),
    layers.Dropout(0.4),

    # 🔥 Correct output layer
    layers.Dense(num_classes, activation='softmax')
])

# 🔹 Compile
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("\n🚀 Starting training...\n")

# 🔹 Train
model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=10
)

# 🔹 Save model
model.save("asl_model.h5")

print("\n✅ Training complete. Model saved as asl_model.h5")