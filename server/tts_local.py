# tts_local.py
import os
import uuid
import pyttsx3
from pydub import AudioSegment

def synthesize_text_to_file(text, output_dir):
    """
    Creates an audio file from text.
    Returns full path to an mp3 file (or wav if mp3 conversion fails).
    """
    os.makedirs(output_dir, exist_ok=True)
    basename = f"tts_{uuid.uuid4().hex[:8]}"
    wav_path = os.path.join(output_dir, basename + ".wav")
    mp3_path = os.path.join(output_dir, basename + ".mp3")

    engine = pyttsx3.init()
    # optional: set voice rate
    engine.setProperty('rate', 150)
    engine.save_to_file(text, wav_path)
    engine.runAndWait()

    # try to convert to mp3 using pydub (which needs ffmpeg on PATH)
    try:
        audio = AudioSegment.from_wav(wav_path)
        audio.export(mp3_path, format="mp3")
        # remove wav if mp3 created
        if os.path.exists(mp3_path):
            os.remove(wav_path)
            return mp3_path
    except Exception:
        pass

    # fallback to wav path if mp3 not available
    return wav_path
