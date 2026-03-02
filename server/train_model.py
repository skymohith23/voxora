import tensorflow as tf
from tensorflow.keras import layers, models
from pathlib import Path
import os
import sys

# Ensure your specific venv path is recognized
sys.path.append("/Users/mohithachar/Desktop/voxora/venv/lib/python3.11/site-packages")
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

DATA_DIR = Path.home() / "Desktop/ASL_Data/merged_training_set"

def train():
    print("📂 Loading dataset and applying Augmentation...")
    
    # 1. Load Data with Augmentation
    # We add a small horizontal flip because ASL can be tricky with hand orientations
    train_ds = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR, validation_split=0.2, subset="training", seed=123,
        image_size=(224, 224), batch_size=32)
    
    val_ds = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR, validation_split=0.2, subset="validation", seed=123,
        image_size=(224, 224), batch_size=32)

    class_names = train_ds.class_names
    num_classes = len(class_names)
    
    with open('labels.txt', 'w') as f:
        f.write('\n'.join(class_names))

    # 2. Advanced Model Architecture
    # We include Data Augmentation directly in the model layers
    data_augmentation = tf.keras.Sequential([
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.1),
    ])

    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False, weights='imagenet')
    
    # PHASE 1: Freeze the base model
    base_model.trainable = False

    model = models.Sequential([
        layers.Input(shape=(224, 224, 3)),
        data_augmentation,
        layers.Rescaling(1./127.5, offset=-1),
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.3), # Increased dropout to prevent overfitting
        layers.Dense(num_classes, activation='softmax')
    ])

    # Initial Compile
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("\n🚀 PHASE 1: Warm-up training (5 Epochs)")
    model.fit(train_ds, validation_data=val_ds, epochs=5)

    # PHASE 2: Fine-Tuning
    # We unfreeze the base_model and train with a VERY small learning rate
    print("\n🔓 Unfreezing model for Fine-Tuning...")
    base_model.trainable = True
    
    # We re-compile with a much lower learning rate (10x smaller)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    print("🚀 PHASE 2: Fine-Tuning (10 Epochs) - This is where accuracy jumps!")
    model.fit(train_ds, validation_data=val_ds, epochs=10)

    # 4. Export to TFLite
    print("\n📦 Converting to TFLite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    # Optimize for mobile size and speed
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    
    with open('asl_model.tflite', 'wb') as f:
        f.write(tflite_model)
    
    print(f"🎉 SUCCESS: High-accuracy model saved as 'asl_model.tflite'")

if __name__ == "__main__":
    train()