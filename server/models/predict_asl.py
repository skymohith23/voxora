import tensorflow as tf
import numpy as np
from PIL import Image
import os

# ============================
# Load model
# ============================
model_path = "server/asl_model/asl_model.h5"
model = tf.keras.models.load_model(model_path)

# ============================
# Load labels.txt
# ============================
labels_path = "server/asl_model/labels.txt"

with open(labels_path, "r") as f:
    idx_to_class = [line.strip() for line in f.readlines()]

print("Loaded labels:", idx_to_class)

# ============================
# Preprocessing
# ============================
def preprocess_image(img_path):
    img = Image.open(img_path).convert("RGB")
    img = img.resize((64, 64))
    img = np.array(img) / 255.0
    img = np.expand_dims(img, axis=0)  # (1, 64, 64, 3)
    return img


# ============================
# Prediction function
# ============================
def predict(img_path):
    img = preprocess_image(img_path)
    preds = model.predict(img)

    pred_idx = np.argmax(preds)
    confidence = float(preds[0][pred_idx])

    predicted_label = idx_to_class[pred_idx]
    return predicted_label, confidence


# Debug test (REMOVE LATER)
if __name__ == "__main__":
    label, conf = predict("test.jpg")
    print("Predicted:", label, "| Confidence:", conf)
