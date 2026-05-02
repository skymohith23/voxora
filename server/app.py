import cv2
import mediapipe as mp
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sock import Sock
import os
import json
from datetime import datetime
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

app = Flask(__name__)
CORS(app)
sock = Sock(app)

# --- CONFIG ---
# Ensure this matches the renamed file in D:\voxora\server\
MODEL_PATH = r"D:\voxora\server\asl_alphabet.task"

# In-memory storage (Resets when server restarts)
emergency_db = {}
messages_db = {}
active_calls = {}
existing_users = ["skymohith23@gmail.com", "deepthi23venkatesh@gmail.com", "test@voxora.com", "admin@voxora.com"]

# --- INITIALIZE MEDIAPIPE GESTURE RECOGNIZER ---
try:
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.GestureRecognizerOptions(base_options=base_options)
    recognizer = vision.GestureRecognizer.create_from_options(options)
    print("✅ Professional ASL Recognizer Loaded (using .task API).")
except Exception as e:
    print(f"❌ Initialization Error: {e}")
    recognizer = None

# --- AUTH ROUTES ---

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email', '').lower().strip()
    
    if email not in existing_users:
        existing_users.append(email)
        print(f"📝 New User Registered: {email}")
        
    return jsonify({
        "status": "success",
        "user": {"email": email, "name": email.split('@')[0].capitalize()},
        "access_token": "mock_token_new_user"
    }), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').lower().strip()
    
    if email in existing_users:
        print(f"✅ Login Successful: {email}")
        return jsonify({
            "status": "success",
            "userExists": True,
            "user": {
                "email": email,
                "name": email.split('@')[0].capitalize()
            },
            "access_token": "mock_token_2026"
        }), 200
    
    print(f"❌ Login Failed: {email} not in existing_users")
    return jsonify({"status": "error", "message": "User not found in database"}), 401

# --- EMERGENCY CONTACTS (Universal Key Fix) ---

@app.route('/emergency/contacts', methods=['GET', 'POST'])
def handle_contacts():
    if request.method == 'GET':
        u = request.args.get('user_email', '').lower().strip()
        
        # 1. Get the list of emails YOU added
        my_contacts_emails = emergency_db.get(u, [])
        
        # 2. Format the list
        formatted = []
        for email in my_contacts_emails:
            formatted.append({
                "name": email.split('@')[0].capitalize(),
                "email": email,
                "status": "online"  # Added for UI compatibility
            })
            
        print(f"🔍 {u} requested contacts. Sending {len(formatted)} contacts.")
        
        # 3. Return all possible keys to ensure the app UI picks it up
        return jsonify({
            "status": "success",
            "who_added_me": formatted,      # Key used in your GET logic
            "contacts": formatted,          # Common frontend key
            "emergency_contacts": formatted # Descriptive key
        })
    
    # POST Logic
    data = request.json
    user_email = data.get('user_email', '').lower().strip()
    contact_email = data.get('contact_email', '').lower().strip()

    if not user_email or not contact_email:
        return jsonify({"status": "error", "message": "Missing email"}), 400

    # Ensure the contact is recognized as an existing user
    if contact_email not in existing_users:
        existing_users.append(contact_email)
        print(f"💡 Added {contact_email} to existing_users to allow linking")

    if user_email not in emergency_db:
        emergency_db[user_email] = []
    
    if contact_email not in emergency_db[user_email]:
        emergency_db[user_email].append(contact_email)
    
    print(f"☎️ Emergency Contact Linked: {user_email} -> {contact_email}")
    return jsonify({"status": "success"}), 201

# --- SIGN PREDICTION ---

@app.route('/predict', methods=['POST'])
def predict():
    try:
        file = request.files['image']
        nparr = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        result = recognizer.recognize(mp_image)

        if not result.gestures:
            return jsonify({"status": "no_hand"}), 200

        prediction = result.gestures[0][0].category_name
        print(f"✅ Predicted: {prediction}")
        return jsonify({"status": "success", "prediction": prediction})
    except Exception as e:
        print(f"❌ Prediction Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 200

# --- MESSAGING ---

@app.route('/emergency/send-text', methods=['POST'])
def send_text():
    data = request.json
    s = data.get('sender_email', '').lower().strip()
    r = data.get('to_user', '').lower().strip()
    m = data.get('message', '')

    chat_key = "_".join(sorted([s, r]))
    if chat_key not in messages_db:
        messages_db[chat_key] = []
        
    new_msg = {"sender": s, "text": m, "time": datetime.now().strftime("%I:%M %p")}
    messages_db[chat_key].append(new_msg)
    
    print(f"📩 Message Saved: {s} -> {r}")
    return jsonify({"status": "success", "message": new_msg}), 201

@app.route('/emergency/get-messages', methods=['GET'])
def get_messages():
    s = request.args.get('sender_email', '').lower().strip()
    r = request.args.get('to_user', '').lower().strip()
    chat_key = "_".join(sorted([s, r]))
    return jsonify(messages_db.get(chat_key, []))

# --- WEBSOCKET ---

@sock.route('/ws/call/<user_email>')
def call_socket(ws, user_email):
    u = user_email.lower().strip()
    active_calls[u] = ws
    print(f"📞 {u} connected to WebSocket.")
    try:
        while True:
            data = ws.receive()
            if not data: break
            msg = json.loads(data)
            target = msg.get('to_user', '').lower().strip()
            if target in active_calls:
                active_calls[target].send(json.dumps({
                    "type": msg.get('type'),
                    "content": msg.get('text') or msg.get('content'),
                    "sender": u
                }))
    except Exception as e:
        print(f"🔌 WebSocket error for {u}: {e}")
    finally:
        active_calls.pop(u, None)
        print(f"🛑 {u} disconnected.")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, threaded=True)