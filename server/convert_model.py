import tensorflow as tf

# 1. Load the .h5 model
model = tf.keras.models.load_model('voxora_model.h5')

# 2. Convert to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
# Fix for LSTM: TFLite needs to allow "Select TF Ops" for complex layers like LSTM
converter.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS, 
    tf.lite.OpsSet.SELECT_TF_OPS
]
converter._experimental_lower_tensor_list_ops = False

tflite_model = converter.convert()

# 3. Save it
with open('voxora_model.tflite', 'wb') as f:
    f.write(tflite_model)

print("✨ Model successfully converted to voxora_model.tflite!")