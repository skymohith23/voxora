import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import json
import threading
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- 1. SETTINGS & PATHS ---
MODEL_PATH = "model.tflite"
LABEL_PATH = "sign_to_prediction_index_map.json"

try:
    with open(LABEL_PATH, 'r') as f:
        label_map = json.load(f)
        index_to_word = {int(v): k for k, v in label_map.items()}
    print(f"✅ Loaded {len(index_to_word)} labels.")
    
    # --- LABEL MAP CHECK ---
    # Run this to see exactly how 'help' is spelled in your JSON
    help_keys = [k for k in label_map.keys() if 'hel' in k.lower()]
    print(f"🔍 Label Map Check: Found keys similar to 'help': {help_keys}")
    
except Exception as e:
    print(f"❌ Label Load Error: {e}")

try:
    os.environ['TF_LITE_DISABLE_XNNPACK'] = '1'
    interpreter = tf.lite.Interpreter(
        model_path=MODEL_PATH,
        experimental_delegates=None,
        num_threads=4
    )
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    print(f"✅ Model Loaded! XNNPack Hard-Disabled.")
except Exception as e:
    print(f"❌ Model Load Error: {e}")

mp_lock = threading.Lock()
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(
    static_image_mode=False, 
    model_complexity=1,       
    smooth_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# --- 2. LANDMARK EXTRACTION ---
def extract_landmarks(frame):
    try:
        with mp_lock:
            results = holistic.process(frame)
        
        if not results:
            return None

        def get_coords(res, num_pts):
            if res and res.landmark:
                return np.array([[lm.x, lm.y, lm.z] for lm in res.landmark], dtype=np.float32)
            return np.zeros((num_pts, 3), dtype=np.float32)

        face = get_coords(results.face_landmarks, 468)
        l_hand = get_coords(results.left_hand_landmarks, 21)
        pose = get_coords(results.pose_landmarks, 33)
        r_hand = get_coords(results.right_hand_landmarks, 21)

        landmarks = np.concatenate([face, l_hand, pose, r_hand], axis=0)

        mask = np.any(landmarks != 0, axis=1)
        if np.any(mask):
            mean = np.mean(landmarks[mask], axis=0)
            std = np.std(landmarks[mask], axis=0)
            landmarks[mask] = (landmarks[mask] - mean) / (std + 1e-6)

        return landmarks
    except Exception as e:
        print(f"⚠️ MediaPipe Error: {e}")
        return None

# --- 3. PREDICTION ENDPOINT ---
PRIORITY_WORDS = ["HELP", "SICK", "POLICE", "HURT", "HOSPITAL", "DOCTOR", "EMERGENCY", "STOP", "FIRE", "TELEPHONE", "AMBULANCE"]
BOOST_THRESHOLD = 0.08  # Lowered slightly to capture boosted signals
NORMAL_THRESHOLD = 0.45 

@app.route('/predict', methods=['POST'])
def predict():
    try:
        files = request.files.getlist('images')
        if not files: 
            return jsonify({"error": "No frames received"}), 400

        predictions = []
        frames_processed = 0
        
        for i in range(0, len(files), 3):
            f = files[i]
            img = cv2.imdecode(np.frombuffer(f.read(), np.uint8), cv2.IMREAD_COLOR)
            if img is not None:
                rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                landmarks = extract_landmarks(rgb_img)
                if landmarks is not None:
                    input_data = np.expand_dims(landmarks, axis=0)
                    interpreter.set_tensor(input_details[0]['index'], input_data)
                    interpreter.invoke()
                    predictions.append(np.squeeze(interpreter.get_tensor(output_details[0]['index'])))
                    frames_processed += 1

        if frames_processed == 0:
            return jsonify({"prediction": "NO HANDS SEEN", "confidence": 0})

        # Calculate raw probabilities
        avg_prediction = np.mean(predictions, axis=0)
        exp_preds = np.exp(avg_prediction - np.max(avg_prediction))
        probabilities = exp_preds / exp_preds.sum()

        # --- ENHANCED EMERGENCY LOGIC ---
        # 1. Identify indices
        help_idx = next((int(v) for k, v in label_map.items() if k.upper() == "HELP"), None)
        police_idx = next((int(v) for k, v in label_map.items() if k.upper() == "POLICE"), None)

        # 2. Apply "The Help Boost" 
        # If the model thinks it's HELP even a little bit, we amplify it
        if help_idx is not None:
            # Check raw before boost for tracking
            raw_help = probabilities[help_idx]
            probabilities[help_idx] *= 3.0 # Stronger 300% boost
            # Re-normalize so they still sum to 1
            probabilities /= probabilities.sum()
            print(f"🚨 TARGET TRACKING | RAW HELP: {raw_help:.6f} | BOOSTED HELP: {probabilities[help_idx]:.6f}")

        # 3. Get New Top 5 after boost
        top_indices = np.argsort(probabilities)[-5:][::-1]
        top_candidates = [(index_to_word.get(i).upper(), float(probabilities[i])) for i in top_indices]
        
        print(f"📊 DEBUG | Adjusted Top 5: {top_candidates}")

        # --- FINAL DECISION ---
        final_word, final_conf = top_candidates[0]
        triggered_priority = False

        # Look for priority words in the boosted top 5
        for word, conf in top_candidates:
            if word in PRIORITY_WORDS and conf > BOOST_THRESHOLD:
                final_word, final_conf = word, conf
                triggered_priority = True
                break

        # Result logic
        threshold = BOOST_THRESHOLD if triggered_priority else NORMAL_THRESHOLD
        
        if final_conf >= threshold:
            result = final_word
            print(f"🤖 RESULT: {final_word} ({final_conf:.4f}) [Priority: {triggered_priority}]")
        else:
            result = "LISTENING..."

        return jsonify({
            "prediction": result, 
            "confidence": final_conf, 
            "is_priority": triggered_priority
        })

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, threaded=True)