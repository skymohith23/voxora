from fastapi import APIRouter
from fastapi.responses import FileResponse
from gtts import gTTS
import uuid
import os

router = APIRouter()

@router.post("/tts")
def text_to_speech(text: str):
    filename = f"{uuid.uuid4()}.mp3"
    tts = gTTS(text=text, lang="en")
    filepath = f"audio/{filename}"

    # Ensure folder exists
    os.makedirs("audio", exist_ok=True)

    tts.save(filepath)

    return {"audio_url": f"/audio/{filename}"}
