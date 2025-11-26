from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gtts import gTTS
import uuid
import os
import speech_recognition as sr

app = FastAPI(title="Voxora Backend", version="1.0")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------
# HOME API
# ------------------------------
@app.get("/")
def home():
    return {"message": "Voxora Backend Running Successfully!"}


# ------------------------------
# TEXT TO SPEECH (WORKING)
# ------------------------------
class TTSRequest(BaseModel):
    text: str

@app.post("/tts/")
def text_to_speech(data: TTSRequest):
    filename = f"tts_{uuid.uuid4()}.mp3"
    filepath = f"output/{filename}"

    # Create output folder if missing
    os.makedirs("output", exist_ok=True)

    tts = gTTS(text=data.text, lang="en")
    tts.save(filepath)

    return {
        "message": "Text converted to speech successfully!",
        "audio_url": f"http://127.0.0.1:8000/{filepath}"
    }


# ------------------------------
# SPEECH TO TEXT (NEW FEATURE)
# ------------------------------
@app.post("/stt/")
async def stt(audio: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        temp_path = "temp_audio.wav"
        with open(temp_path, "wb") as f:
            f.write(await audio.read())

        # Initialize recognizer
        r = sr.Recognizer()

        # Read audio file safely
        with sr.AudioFile(temp_path) as source:
            audio_data = r.record(source)

        # Convert speech → text
        text = r.recognize_google(audio_data)

        return {"text": text}

    except Exception as e:
        return {"error": str(e)}


    


# ------------------------------
# STATIC FILE SERVING (FOR TTS AUDIO)
# ------------------------------
from fastapi.staticfiles import StaticFiles
app.mount("/output", StaticFiles(directory="output"), name="output")
