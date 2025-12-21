import os
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV3Large
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau

# -----------------------------
#   SETTINGS
# -----------------------------
DATASET_DIR = r"C:\Users\Admin\voxora\server\datasets\synthetic_asl"   # UPDATE THIS
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 25

# -----------------------------
#   HAND-FOCUSED AUGMENTATION
# -----------------------------
train_datagen = ImageDataGenerator(
    rescale=1./255,
    zoom_range=0.25,
    width_shift_range=0.15,
    height_shift_range=0.15,
    rotation_range=25,
    brightness_range=[0.6, 1.4],
    horizontal_flip=False,
    validation_split=0.15,
)

val_datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.15
)

train_data = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

val_data = val_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

num_classes = len(train_data.class_indices)
print("Detected classes:", train_data.class_indices)

# -----------------------------
#   BUILD MODEL
# -----------------------------
base_model = MobileNetV3Large(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights="imagenet"
)

base_model.trainable = False  # freeze for fast training first

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.3)(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.25)(x)
output = Dense(num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# -----------------------------
#   CALLBACKS
# -----------------------------
checkpoint = ModelCheckpoint(
    "asl_mobilenetv3_best.keras",
    monitor="val_accuracy",
    save_best_only=True,
    verbose=1
)

early_stop = EarlyStopping(
    monitor="val_accuracy",
    patience=5,
    restore_best_weights=True
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.3,
    patience=2,
    min_lr=1e-6
)

# -----------------------------
#   TRAIN FIRST PASS
# -----------------------------
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS,
    callbacks=[checkpoint, early_stop, reduce_lr]
)

# -----------------------------
#   UNFREEZE + FINE-TUNE
# -----------------------------
base_model.trainable = True
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.00003),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

history_ft = model.fit(
    train_data,
    validation_data=val_data,
    epochs=10,
    callbacks=[checkpoint, early_stop, reduce_lr]
)

print("Training Complete!")
