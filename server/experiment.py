import cv2
import numpy as np
import tensorflow as tf
import json

# 🔹 Load model
<<<<<<< Updated upstream
model = tf.keras.models.load_model("asl_model.h5", compile=False)
=======
model = tf.keras.models.load_model("asl_model.h5")
>>>>>>> Stashed changes

# 🔹 Load labels
with open("labels.json", "r") as f:
    labels = json.load(f)

<<<<<<< Updated upstream
labels = {int(v): k for k, v in labels.items()}

# 🔹 Webcam
cap = cv2.VideoCapture(0)

print("Press ESC to exit")

=======
# reverse mapping (index → label)
labels = {v: k for k, v in labels.items()}

# 🔹 Start webcam
cap = cv2.VideoCapture(0)

>>>>>>> Stashed changes
while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Flip for mirror view
    frame = cv2.flip(frame, 1)

<<<<<<< Updated upstream
    # 🔹 Define ROI (center box)
    h, w, _ = frame.shape
    x1, y1 = int(w * 0.3), int(h * 0.2)
    x2, y2 = int(w * 0.7), int(h * 0.8)

    roi = frame[y1:y2, x1:x2]

    # Draw box
    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)

    # 🔹 Preprocess
    img = cv2.resize(roi, (64, 64))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img = img / 255.0
    img = img.reshape(1, 64, 64, 1)

    # 🔹 Predict
    pred = model.predict(img, verbose=0)
    class_id = np.argmax(pred)
    confidence = np.max(pred)

    label = labels[class_id]

    # 🔹 Display
    cv2.putText(frame, f"{label} ({confidence:.2f})",
                (10, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1, (0, 255, 0), 2)

    cv2.imshow("ASL Detection", frame)

    if cv2.waitKey(1) & 0xFF == 27:
=======
    # Preprocess
    img = cv2.resize(frame, (64, 64))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img = img / 255.0
    img = img.reshape(1, 64, 64, 1)

    # Predict
    pred = model.predict(img, verbose=0)
    class_id = np.argmax(pred)
    confidence = np.max(pred)

    label = labels[class_id]

    # Show result
    cv2.putText(frame, f"{label} ({confidence:.2f})",
                (50, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2)

    cv2.imshow("ASL Detection", frame)

    if cv2.waitKey(1) == 27:  # ESC
>>>>>>> Stashed changes
        break

cap.release()
cv2.destroyAllWindows()