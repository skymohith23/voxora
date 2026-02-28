import tensorflow as tf
import os

# 1. Define the architecture manually (MobileNetV2 + Your Dense layers)
def build_clean_model():
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), 
        include_top=False, 
        weights=None # We don't need imagenet weights
    )
    model = tf.keras.Sequential([
        base_model,
        tf.keras.layers.GlobalAveragePooling2D(),
        # Add your specific layers here. 
        # Based on your error, it seems you have a Dense layer right after the base
        tf.keras.layers.Dense(256, activation='relu'), 
        tf.keras.layers.Dense(5, activation='softmax') # Assuming 5 classes (Hello, Help, etc.)
    ])
    return model

print("🛠️ Building fresh model shell...")
model = build_clean_model()

# 2. Load ONLY the weights from your broken H5 file
# This avoids loading the broken configuration
h5_path = os.path.join('asl_model', 'asl_model.h5')

try:
    print(f"📥 Injecting weights from {h5_path}...")
    model.load_weights(h5_path, by_name=True, skip_mismatch=True)

    # 3. Convert the clean model
    print("🚀 Converting to TFLite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()

    with open('asl_model.tflite', 'wb') as f:
        f.write(tflite_model)

    print("\n✅ SUCCESS! asl_model.tflite is created.")
except Exception as e:
    print(f"❌ Weight injection failed: {e}")
    print("This usually means your model layers have different names or counts.")