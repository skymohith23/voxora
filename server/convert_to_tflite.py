import tensorflow as tf

# 1. Load the model using standard TensorFlow (Keras 3)
print("📂 Loading .h5 model (Modern Keras)...")
model = tf.keras.models.load_model('asl_model.h5')

# 2. Convert to TFLite
print("⚡ Converting to TFLite...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# 3. CRITICAL: These flags prevent the 'missing attribute value' LLVM error
converter.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS, 
    tf.lite.OpsSet.SELECT_TF_OPS
]
# This line is the key to fixing the LLVM crash on M4
converter._experimental_lower_tensor_list_ops = False

try:
    tflite_model = converter.convert()
    # 4. Save
    with open('asl_model.tflite', 'wb') as f:
        f.write(tflite_model)
    print("✅ Success! 'asl_model.tflite' is created.")
except Exception as e:
    print(f"❌ Conversion failed: {e}")