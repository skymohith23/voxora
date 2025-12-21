import tensorflow as tf
import keras
import os

OLD_MODEL = os.path.join("asl_model", "asl_model.h5")
NEW_MODEL = os.path.join("asl_model", "asl_model_fixed")

print("TensorFlow:", tf.__version__)
print("Keras:", keras.__version__)

# Load old model WITHOUT compiling
model = tf.keras.models.load_model(OLD_MODEL, compile=False)

# Save in new SavedModel format (NOT .h5)
model.save(NEW_MODEL)

print("✅ Model successfully re-saved to:", NEW_MODEL)
