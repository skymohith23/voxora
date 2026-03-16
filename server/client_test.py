import cv2
import requests
import time

# The URL of your running Flask server
URL = "http://127.0.0.1:8000/predict"

cap = cv2.VideoCapture(0)
print("Camera opened. Start signing...")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break

    # 1. Encode image to send over HTTP
    _, img_encoded = cv2.imencode('.jpg', frame)
    files = {'image': ('image.jpg', img_encoded.tobytes(), 'image/jpeg')}

    # 2. Send to Flask server
    try:
        response = requests.post(URL, files=files).json()
        
        # 3. Display the result on the video feed
        pred = response.get('prediction', 'Waiting...')
        conf = response.get('confidence', 0)
        status = response.get('status', '')

        text = f"{pred} ({conf*100:.1f}%)" if status == 'ready' else f"{status}..."
        cv2.putText(frame, text, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    except Exception as e:
        print(f"Error: {e}")

    cv2.imshow('Voxora Real-Time Test', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()