import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import json
import threading
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- 1. MODEL PATHS ---
ALPHABET_MODEL_PATH = "server/alphabets_asl_model.h5"
EMERGENCY_MODEL_PATH = "emergency_model.keras"
GENERAL_TFLITE_PATH = "model.tflite"
GENERAL_LABEL_PATH = "sign_to_prediction_index_map.json"
ACTIONS_PATH = "actions.npy" # For Emergency Words

# --- 2. LOAD ALL MODELS ---
try:
    # 1. Alphabet (Static Hand)
    alphabet_model = load_model(ALPHABET_MODEL_PATH)
    alphabet_labels = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','del','nothing','space']
    
    # 2. Emergency (LSTM/Sequence)
    emergency_model = load_model(EMERGENCY_MODEL_PATH)
    emergency_actions = np.load(ACTIONS_PATH)
    
    # 3. General (TFLite)
    with open(GENERAL_LABEL_PATH, 'r') as f:
        general_label_map = json.load(f)
        gen_index_to_word = {int(v): k for k, v in general_label_map.items()}
    
    os.environ['TF_LITE_DISABLE_XNNPACK'] = '1'
    interpreter = tf.lite.Interpreter(model_path=GENERAL_TFLITE_PATH)
    interpreter.allocate_tensors()
    gen_input_details = interpreter.get_input_details()
    gen_output_details = interpreter.get_output_details()
    
    print("✅ All 3 Models Loaded Successfully!")
except Exception as e:
    print(f"❌ Critical Load Error: {e}")

# --- 3. LANDMARK EXTRACTION UTILITIES ---
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)

def get_landmarks_from_frame(frame):
    results = holistic.process(frame)
    if not results: return None, None
    
    # Extraction for TFLite (General Model)
    def get_coords(res, num_pts):
        if res and res.landmark:
            return np.array([[lm.x, lm.y, lm.z] for lm in res.landmark], dtype=np.float32)
        return np.zeros((num_pts, 3), dtype=np.float32)

    face = get_coords(results.face_landmarks, 468)
    l_hand = get_coords(results.left_hand_landmarks, 21)
    pose = get_coords(results.pose_landmarks, 33)
    r_hand = get_coords(results.right_hand_landmarks, 21)
    
    tflite_landmarks = np.concatenate([face, l_hand, pose, r_hand], axis=0)
    
    # Extraction for Keras (Emergency Model - Pose+Hands Flattened)
    def get_flattened(res, num_pts, dims=3):
        if res and res.landmark:
            return np.array([[lm.x, lm.y, lm.z] for lm in res.landmark]).flatten()
        return np.zeros(num_pts * dims)
    
    # Adjust this line if your emergency model uses different dims (e.g. includes visibility)
    emer_pose = get_flattened(results.pose_landmarks, 33)
    emer_lh = get_flattened(results.left_hand_landmarks, 21)
    emer_rh = get_flattened(results.right_hand_landmarks, 21)
    keras_landmarks = np.concatenate([emer_pose, emer_lh, emer_rh])
    
    return tflite_landmarks, keras_landmarks, results

# --- 4. PREDICTION LOGIC ---
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # User selection from Frontend: "WORD" or "ALPHABET"
        mode = request.form.get('mode', 'WORD').upper() 
        files = request.files.getlist('images')
        
        if not files: return jsonify({"error": "No frames"}), 400

        tflite_sequence = []
        keras_sequence = []
        raw_frames = []

        # Process frames
        for f in files:
            img = cv2.imdecode(np.frombuffer(f.read(), np.uint8), cv2.IMREAD_COLOR)
            if img is not None:
                raw_frames.append(img)
                rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                tf_l, ker_l, results = get_landmarks_from_frame(rgb_img)
                
                if tf_l is not None:
                    tflite_sequence.append(tf_l)
                    keras_sequence.append(ker_l)

        if not tflite_sequence:
            return jsonify({"prediction": "NO HANDS SEEN"})

        # --- BRANCH A: ALPHABET MODE ---
        if mode == "ALPHABET":
            # Use the last frame for static alphabet detection
            # Alphabet models usually expect a 200x200 image or hand-only landmarks
            # Assuming your .h5 model is an image-based CNN:
            last_frame = cv2.resize(raw_frames[-1], (200, 200)) / 255.0
            res = alphabet_model.predict(np.expand_dims(last_frame, axis=0), verbose=0)[0]
            letter = alphabet_labels[np.argmax(res)]
            return jsonify({"prediction": letter, "confidence": float(np.max(res)), "type": "alphabet"})

        # --- BRANCH B: WORD MODE (Hierarchical) ---
        else:
            # 1. Try Emergency Model First (Priority)
            # Ensure sequence length matches (e.g., 30 frames)
            emer_input = np.expand_dims(keras_sequence[-30:], axis=0)
            emer_res = emergency_model.predict(emer_input, verbose=0)[0]
            emer_conf = np.max(emer_res)
            emer_word = emergency_actions[np.argmax(emer_res)]

            # If Emergency word is confident, return it immediately
            if emer_conf > 0.85:
                return jsonify({"prediction": emer_word.upper(), "confidence": float(emer_conf), "type": "emergency"})

            # 2. Fallback to General Model (TFLite)
            # TFLite model usually takes 1 frame or a specific batch
            interpreter.set_tensor(gen_input_details[0]['index'], np.expand_dims(tflite_sequence[-1], axis=0))
            interpreter.invoke()
            gen_res = np.squeeze(interpreter.get_tensor(gen_output_details[0]['index']))
            
            # Apply Softmax to TFLite output
            gen_probs = np.exp(gen_res - np.max(gen_res))
            gen_probs /= gen_probs.sum()
            
            gen_idx = np.argmax(gen_probs)
            gen_word = gen_index_to_word.get(gen_idx, "Unknown").upper()
            gen_conf = float(gen_probs[gen_idx])

            return jsonify({
                "prediction": gen_word if gen_conf > 0.4 else "LISTENING...",
                "confidence": gen_conf,
                "type": "general"
            })

    except Exception as e:
        print(f"❌ Server Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, threaded=True)