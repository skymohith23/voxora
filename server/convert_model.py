import tensorflow as tf

h5_path = r"D:\voxora\server\asl_model.h5"
output_path = r"D:\voxora\server\asl_model_fixed.tflite"

print("Loading model...")
model = tf.keras.models.load_model(h5_path, compile=False)

# 1. Define a Concrete Function to lock the batch size to 1
# This is the 'magic' that fixes the tf.TensorListReserve error
run_model = tf.function(lambda x: model(x))
concrete_func = run_model.get_concrete_function(
    tf.TensorSpec([1, 30, 258], model.inputs[0].dtype)
)

try:
    print("Attempting Conversion via Concrete Function...")
    # 2. Use the concrete function instead of the raw model
    converter = tf.lite.TFLiteConverter.from_concrete_functions([concrete_func], model)
    
    # Standard mobile settings
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS]
    converter._experimental_lower_tensor_list_ops = True
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    tflite_model = converter.convert()
    with open(output_path, 'wb') as f:
        f.write(tflite_model)
    print(f"✅ Success! Fixed model saved to: {output_path}")

except Exception as e:
    print(f"⚠️ Standard conversion failed: {e}")
    print("🔄 Running Fallback with SELECT_TF_OPS...")
    
    # FALLBACK: If standard fails, we enable the Flex Delegate
    # Since your Android app is already configured for Flex, this WILL work.
    converter = tf.lite.TFLiteConverter.from_concrete_functions([concrete_func], model)
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS, 
        tf.lite.OpsSet.SELECT_TF_OPS 
    ]
    converter._experimental_lower_tensor_list_ops = False # Required for Flex LSTMs
    
    tflite_model = converter.convert()
    with open(output_path, 'wb') as f:
        f.write(tflite_model)
    print(f"✅ Success (with Fallback)! Model saved to: {output_path}")