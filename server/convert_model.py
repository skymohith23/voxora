import tensorflow as tf
import os

# Use the .h5 version instead
model_path = os.path.join('asl_model', 'asl_model.h5')

print(f"Loading H5 model from: {model_path}")

# Load the model
model = tf.keras.models.load_model(model_path)

# Use the TFLite converter with the 'from_keras_model' method
# but we'll add a setting to allow 'Custom Ops' if your model uses them
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT] # This makes it faster on mobile
converter.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS, # enable TensorFlow Lite ops.
    tf.lite.OpsSet.SELECT_TF_OPS # enable TensorFlow ops if TFLite doesn't support them.
]

tflite_model = converter.convert()

# Save it
with open('asl_model.tflite', 'wb') as f:
    f.write(tflite_model)

print("Success! asl_model.tflite is ready.")