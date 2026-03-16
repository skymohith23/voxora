import cv2
import mediapipe as mp
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import threading
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- 1. BiLSTM WITH ATTENTION ARCHITECTURE ---
class VoxoraBiLSTM(nn.Module):
    def __init__(self, input_size=81, hidden_size=128, num_layers=2, num_classes=2000):
        super(VoxoraBiLSTM, self).__init__()
        self.lstm = nn.LSTM(
            input_size, 
            hidden_size, 
            num_layers, 
            batch_first=True, 
            bidirectional=True
        )
        # Attention Layer to match lstm.yaml
        self.attention = nn.Linear(hidden_size * 2, 1)
        self.fc = nn.Linear(hidden_size * 2, num_classes)

    def forward(self, x):
        # x: (Batch, Time, Features)
        lstm_out, _ = self.lstm(x) 
        
        # Calculate Attention Weights
        attn_weights = F.softmax(self.attention(lstm_out), dim=1)
        context = torch.sum(attn_weights * lstm_out, dim=1)
        
        out = self.fc(context)
        return out

# --- 2. INITIALIZATION ---
app = Flask(__name__)
CORS(app)
model = None
class_to_word = {}
mp_lock = threading.Lock()

mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(static_image_mode=False, min_detection_confidence=0.5)

CHECKPOINT_PATH = r"D:\voxora\openhands_model\wlasl\lstm\epoch=109-step=49059.ckpt"
LABEL_MAP_PATH = r"D:\voxora\openhands_model\splits\asl2000.json"

try:
    with open(LABEL_MAP_PATH, 'r') as f:
        data = json.load(f)
        for entry in data:
            class_to_word[len(class_to_word)] = entry['gloss']
    print(f"✅ Loaded {len(class_to_word)} labels.")
except Exception as e:
    print(f"⚠️ Label map failed: {e}")

try:
    model = VoxoraBiLSTM(input_size=81, hidden_size=128, num_layers=2, num_classes=2000)
    checkpoint = torch.load(CHECKPOINT_PATH, map_location='cpu')
    state_dict = checkpoint.get('state_dict', checkpoint)
    
    # Clean keys for manual loading
    new_state_dict = {}
    for k, v in state_dict.items():
        name = k.replace("model.", "").replace("encoder.", "").replace("decoder.", "")
        new_state_dict[name] = v
        
    model.load_state_dict(new_state_dict, strict=False)
    model.eval()
    print("✅ Model with Attention Loaded Successfully!")
except Exception as e:
    print(f"❌ Error Building Model: {e}")

# --- 3. LANDMARK EXTRACTION (minimal_27 mapping) ---
def extract_landmarks(frame):
    results = holistic.process(frame)
    
    def get_specific_pts(res, indices):
        pts = []
        if res and res.landmark:
            for idx in indices:
                if idx < len(res.landmark):
                    l = res.landmark[idx]
                    # Try raw coordinates first (no mirror flip yet to isolate the issue)
                    pts.append([l.x, l.y, l.z])
                else: pts.append([0.0, 0.0, 0.0])
        else: pts = [[0.0, 0.0, 0.0]] * len(indices)
        return pts

    pose_idx = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16]
    hand_idx = [0, 2, 4, 5, 8, 9, 12, 20]

    l_hand = get_specific_pts(results.left_hand_landmarks, hand_idx)
    r_hand = get_specific_pts(results.right_hand_landmarks, hand_idx)
    pose = get_specific_pts(results.pose_landmarks, pose_idx)
    
    # Combined points
    all_pts = np.array(l_hand + r_hand + pose) 

    # --- WRIST RELATIVE NORMALIZATION ---
    # Most models focus on hand movement relative to the hand's own origin
    # l_wrist is l_hand[0] (index 0), r_wrist is r_hand[0] (index 8)
    l_wrist = all_pts[0]
    r_wrist = all_pts[8]

    # If hands are present, center hands on their own wrists
    # If not, center everything on the nose (pose[0] -> index 16)
    center = all_pts[16] 
    
    normalized = (all_pts - center) 
    # Flatten without scaling to see if raw motion triggers higher confidence
    return normalized.flatten().astype(np.float32)

# --- 4. PREDICT ---
@app.route('/predict', methods=['POST'])
def predict():
    if model is None: return jsonify({"error": "Offline"}), 500
    files = request.files.getlist('images')
    if not files: return jsonify({"error": "No data"}), 400

    sequence_data = [extract_landmarks(cv2.cvtColor(cv2.imdecode(np.frombuffer(f.read(), np.uint8), cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)) for f in files if f]

    while len(sequence_data) < 20: # Ensure min length for LSTM
        sequence_data.append(sequence_data[-1] if sequence_data else np.zeros(81))

    input_tensor = torch.from_numpy(np.array(sequence_data, dtype=np.float32)).unsqueeze(0)

    with mp_lock:
        with torch.no_grad():
            output = model(input_tensor)
            probs = F.softmax(output, dim=-1)
            conf, idx = torch.max(probs, dim=-1)
            conf, idx = conf.item(), idx.item()

    # Diagnostics
    top5_prob, top5_idx = torch.topk(probs, 5)
    print(f"\n--- Top Guess: {class_to_word.get(idx, '???')} ({conf:.2f}) ---")

    word = class_to_word.get(idx, "UNKNOWN") if conf > 0.35 else "LISTENING..."
    return jsonify({"prediction": word.upper(), "confidence": conf})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, threaded=True)