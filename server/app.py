import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sock import Sock
import os
import json
from collections import deque
from datetime import datetime

app = Flask(__name__)
CORS(app)
sock = Sock(app)

# --- CONFIG (Updated to Dynamic Relative Paths) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "asl_model.h5")
LABELS_PATH = os.path.join(BASE_DIR, "labels.json")

# --- 1. BUILD MODEL ---
def build_model(num_classes=29):
    model = tf.keras.models.Sequential([
        tf.keras.layers.Input(shape=(64, 64, 1)),
        tf.keras.layers.Conv2D(32, (3,3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2,2),
        tf.keras.layers.Conv2D(64, (3,3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2,2),
        tf.keras.layers.Conv2D(128, (3,3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2,2),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    return model

# --- 2. LOAD LABELS ---
classes = []
try:
    if os.path.exists(LABELS_PATH):
        with open(LABELS_PATH, "r") as f:
            l_data = json.load(f)
        classes = [k for k, v in sorted(l_data.items(), key=lambda item: item[1])]
        print(f"✅ Labels Loaded: {len(classes)} classes.")
    else:
        raise FileNotFoundError
except:
    classes = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ") + ['del', 'nothing', 'space']
    print("⚠️ Warning: labels.json not found. Using default A-Z fallback.")

# --- 3. INITIALIZE MODEL ---
model = build_model(num_classes=len(classes))
try:
    model.load_weights(MODEL_PATH)
    print("✅ ASL Model loaded successfully.")
except Exception as e:
    print(f"❌ Error loading model: {e}")

# --- HELPERS & DB ---
user_stability_buffer = {} 
messages_db = {}
active_calls = {}
existing_users = ["skymohith23@gmail.com", "deepthi23venkatesh@gmail.com", "test@voxora.com", "admin@voxora.com"]

emergency_db = {
    "skymohith23@gmail.com": ["deepthi23venkatesh@gmail.com", "test@voxora.com"],
    "deepthi23venkatesh@gmail.com": ["skymohith23@gmail.com", "test@voxora.com"],
    "test@voxora.com": ["skymohith23@gmail.com", "deepthi23venkatesh@gmail.com"]
}

# --- ASL PREDICTION ROUTE ---
@app.route('/predict', methods=['POST'])
def predict():
    try:
        user_email = request.form.get('user_email', 'default_user')
        file = request.files['image']
        
        nparr = np.frombuffer(file.read(), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        img = cv2.resize(frame, (64, 64))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        img = img / 255.0
        img = img.reshape(1, 64, 64, 1).astype('float32')

        preds = model.predict(img, verbose=0)
        pred_idx = np.argmax(preds)
        confidence = float(np.max(preds))
        raw_char = classes[pred_idx]

        if user_email not in user_stability_buffer:
            user_stability_buffer[user_email] = deque(maxlen=3)
        user_stability_buffer[user_email].append(raw_char)
        
        buff = list(user_stability_buffer[user_email])
        if len(buff) >= 2 and buff[-1] == buff[-2]:
            final = buff[-1]
        else:
            final = "..."

        if final == "nothing": final = "waiting..."

        print(f"🧠 {user_email} detected: {final} ({confidence*100:.1f}%)")
        return jsonify({"status": "success", "prediction": final})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 200

# --- AUTH ROUTES ---
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').lower().strip()
    if email in existing_users:
        return jsonify({
            "status": "success",
            "user": {"email": email, "name": email.split('@')[0].capitalize()},
            "access_token": "token_" + email
        }), 200
    return jsonify({"status": "error", "message": "User not found"}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email', '').lower().strip()
    if email not in existing_users: existing_users.append(email)
    return jsonify({"status": "success", "access_token": "token_" + email}), 201

# --- CONTACTS & MESSAGES ---
@app.route('/emergency/contacts', methods=['GET', 'POST'])
def handle_contacts():
    if request.method == 'GET':
        u = request.args.get('user_email', '').lower().strip()
        my_list = [{"name": e.split('@')[0].capitalize(), "email": e} for e in emergency_db.get(u, [])]
        return jsonify({"who_added_me": my_list, "contacts": my_list})
    
    data = request.json
    u, c = data.get('user_email', '').lower().strip(), data.get('contact_email', '').lower().strip()
    if u not in emergency_db: emergency_db[u] = []
    if c not in emergency_db[u]: emergency_db[u].append(c)
    return jsonify({"status": "success"}), 201

@app.route('/emergency/send-text', methods=['POST'])
def send_text():
    data = request.json
    s, r, m = data.get('sender_email'), data.get('to_user'), data.get('message')
    chat_key = "_".join(sorted([s.lower(), r.lower()]))
    if chat_key not in messages_db: messages_db[chat_key] = []
    new_msg = {"sender": s, "text": m, "time": datetime.now().strftime("%I:%M %p")}
    messages_db[chat_key].append(new_msg)
    return jsonify({"status": "success", "message": new_msg}), 201

@app.route('/emergency/get-messages', methods=['GET'])
def get_messages():
    s = request.args.get('sender_email', '').lower().strip()
    r = request.args.get('to_user', '').lower().strip()
    chat_key = "_".join(sorted([s, r]))
    return jsonify(messages_db.get(chat_key, []))

# --- WEBSOCKET SIGNALING ENGINE ---
@sock.route('/ws/call/<user_email>')
def call_socket(ws, user_email):
    u = user_email.lower().strip()
    active_calls[u] = ws
    print(f"🔌 WebSocket Connected: {u} | Active Users: {list(active_calls.keys())}")
    
    try:
        while True:
            data = ws.receive()
            if not data: 
                break
                
            msg = json.loads(data)
            target = msg.get('to_user', '').lower().strip()
            msg_type = msg.get('type', 'call_signal')
            
            # Drop self-addressed frames
            if target == u:
                continue

            # Drop unsupported signal types
            if msg_type not in ["initiate_call", "call_ended", "voice_broadcast", "speech_result"]:
                continue

            speech_text = msg.get('text') or msg.get('content') or ""

            if msg_type in ["voice_broadcast", "speech_result"]:
                print(f"🎙️ Relaying Voice [{u} -> {target}]: '{speech_text}'")
            else:
                print(f"📡 Forwarding Call Signal: {u} -> {target} [{msg_type}]")
            
            if target in active_calls:
                target_ws = active_calls[target]
                payload = {
                    "type": msg_type,
                    "sender": u,
                    "mode": msg.get('mode', 'talk')
                }
                if speech_text:
                    payload["text"] = speech_text
                    payload["content"] = speech_text

                target_ws.send(json.dumps(payload))
            else:
                print(f"⚠️ Target {target} not connected in active_calls.")
                ws.send(json.dumps({
                    "type": "user_offline",
                    "message": f"User {target} is currently unreachable."
                }))
    except Exception as e:
        print(f"⚠️ WebSocket disconnect for {u}: {e}")
    finally:
        active_calls.pop(u, None)
        print(f"🔌 WebSocket Disconnected: {u}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, threaded=True)