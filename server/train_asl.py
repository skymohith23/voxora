import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import json

# 🔹 Dataset path (CHANGE if needed)
DATASET_PATH = "/Users/mohithachar/Desktop/voxora/server/datasets/asl_alphabet"

# 🔹 Image settings
IMG_SIZE = (64, 64)
BATCH_SIZE = 64

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
    subset="training"
)

# 🔹 Validation generator
val_gen = datagen.flow_from_directory(
    DATASET_PATH,
    target_size=IMG_SIZE,
    color_mode="grayscale",
    class_mode="categorical",
    subset="validation"
)

# 🔹 Automatically detect classes (IMPORTANT FIX)
num_classes = len(train_gen.class_indices)
print("Classes found:", train_gen.class_indices)
print("Total classes:", num_classes)

# 🔹 Save class mapping (VERY IMPORTANT for inference later)
with open("labels.json", "w") as f:
    json.dump(train_gen.class_indices, f)

# 🔹 Model (stable CNN)
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

    layers.Dense(num_classes, activation='softmax')
])

# 🔹 Compile
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 🔹 Train
model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=10
)

# 🔹 Save model
model.save("asl_model.h5")

print("✅ Training complete. Model saved as asl_model.h5")