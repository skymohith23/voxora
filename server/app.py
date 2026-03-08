import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import collections
import json
import threading

app = Flask(__name__)
CORS(app)

# --- 1. CONFIGURATION & MODEL LOADING ---
MODEL_PATH_H5 = "asl_model.h5"
LABEL_MAP_PATH = r"D:\voxora\VoxoraMobile\src\models\label_map.json"

print("⏳ Attempting to load Keras model from disk...")
# Load it once, globally.
model = tf.keras.models.load_model(MODEL_PATH_H5)
print("✅ SUCCESS: Keras Model is now in memory.")

try:
    with open(LABEL_MAP_PATH, 'r') as f:
        label_map = json.load(f)
    actions = [k for k, v in sorted(label_map.items(), key=lambda item: item[1])]
    print(f"✅ Loaded {len(actions)} labels: {actions}")
except Exception as e:
    print(f"❌ Label Load Error: {e}")
    actions = []

# --- 2. MEDIAPIPE SETUP ---
mp_lock = threading.Lock()
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(static_image_mode=True, min_detection_confidence=0.5)
sequence = collections.deque(maxlen=30)

def extract_keypoints(results):
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, lh, rh])

@app.route('/predict', methods=['POST'])
def predict():
    global sequence 
    
    file = request.files.get('image')
    if not file: return jsonify({"error": "No image"}), 400

    nparr = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    with mp_lock:
        results = holistic.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    
    keypoints = extract_keypoints(results)
    sequence.append(keypoints)
    
    current_len = len(sequence)

    if current_len == 30:
        try:
            input_data = np.expand_dims(list(sequence), axis=0)
            res = model.predict(input_data, verbose=0)[0]
            
            res_index = np.argmax(res)
            word = actions[res_index]
            conf = float(res[res_index])
            
            # --- NEW LOGIC: Only show if AI is confident ---
            if conf > 0.6:  # 60% Confidence Threshold
                print(f"🔮 PREDICTION: {word} ({conf*100:.1f}%)")
                result_text = word
            else:
                # If not confident, we return "..." or "Signing..."
                result_text = "..." 
            
            sequence.clear() # Reset for next sign
            
            return jsonify({
                "prediction": result_text, 
                "confidence": conf, 
                "status": "ready"
            })
        except Exception as e:
            sequence.clear()
            return jsonify({"status": "error", "message": str(e)})

    return jsonify({"prediction": "Waiting...", "status": "buffering"})

# Mock routes for your mobile app's other needs
@app.route('/login', methods=['POST'])
def login(): return jsonify({"access_token": "token"}), 200

@app.route('/me', methods=['GET'])
def get_me(): return jsonify({"name": "User"}), 200

@app.route('/emergency/contacts', methods=['GET'])
def get_contacts(): return jsonify({"my_emergency_contact": {"name": "Support"}}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)