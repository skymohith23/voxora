# main.py
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr

from jose import jwt, JWTError
from passlib.context import CryptContext

import speech_recognition as sr
from gtts import gTTS

# -----------------------
# DATABASE (SQLAlchemy)
# -----------------------
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./voxora.db"

# 🔐 YOU CHOSE TO KEEP THIS SECRET KEY
SECRET_KEY = "change-me-to-a-random-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)

# -----------------------
# PASSWORD HASHING
# -----------------------

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str):
    if len(password) > 128:
        raise ValueError("Password too long")
    return pwd_context.hash(password)


# -----------------------
# JWT HELPERS
# -----------------------

def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# -----------------------
# FASTAPI SETUP
# -----------------------

app = FastAPI(title="Voxora Backend", version="1.1-fixed")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("output", exist_ok=True)
os.makedirs("temp", exist_ok=True)

app.mount("/output", StaticFiles(directory="output"), name="output")


# -----------------------
# Pydantic Models
# -----------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    name: Optional[str]
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TTSRequest(BaseModel):
    text: str


# -----------------------
# DB Dependency
# -----------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------
# AUTH HELPERS
# -----------------------

def get_user_by_email(db, email):
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db, email, password):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# OAuth2 token extraction
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(401, "Invalid authentication token")

    email = payload.get("sub")
    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(401, "User not found")

    return user


# -----------------------
# ROUTES
# -----------------------

@app.get("/")
def root():
    return {"message": "Voxora Backend Running Successfully!"}


# -----------------------
# REGISTER
# -----------------------
@app.post("/register", status_code=201)
def register(req: RegisterRequest, db=Depends(get_db)):

    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 chars")

    existing = get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(400, "Email already registered")

    hashed = get_password_hash(req.password)

    user = User(email=req.email, name=req.name, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully", "email": user.email, "user_id": user.id}


# -----------------------
# LOGIN
# -----------------------
@app.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db=Depends(get_db)):
    user = authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(401, "Incorrect email or password")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
from fastapi.security import OAuth2PasswordRequestForm

@app.post("/swagger-login", response_model=TokenResponse)
def swagger_login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    email = form_data.username  # Swagger sends username instead of email
    password = form_data.password

    user = authenticate_user(db, email, password)
    if not user:
        raise HTTPException(401, "Incorrect email or password")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


# -----------------------
# PROFILE
# -----------------------
@app.get("/me")
def get_profile(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "created_at": user.created_at,
    }


# -----------------------
# TEXT → SPEECH
# -----------------------
@app.post("/tts/")
def tts(text: str = Form(...), user: User = Depends(get_current_user)):

    if not text.strip():
        raise HTTPException(400, "Text cannot be empty")

    filename = f"tts_{uuid.uuid4()}.mp3"
    path = os.path.join("output", filename)

    tts = gTTS(text=text, lang="en")
    tts.save(path)

    return FileResponse(path, media_type="audio/mpeg", filename=filename)


# -----------------------
# SPEECH → TEXT
# -----------------------
@app.post("/stt/")
async def speech_to_text(audio: UploadFile = File(...), user: User = Depends(get_current_user)):
    temp_path = os.path.join("temp", f"{uuid.uuid4()}_{audio.filename}")

    with open(temp_path, "wb") as f:
        f.write(await audio.read())

    r = sr.Recognizer()
    try:
        with sr.AudioFile(temp_path) as source:
            audio_data = r.record(source)
        text = r.recognize_google(audio_data)
        return {"text": text}

    except Exception as e:
        raise HTTPException(400, f"STT error: {str(e)}")

    finally:
        try:
            os.remove(temp_path)
        except:
            pass


# -----------------------
# SIGN DETECTION (placeholder until you give model)
# -----------------------
@app.post("/detect-sign/")
async def detect_sign(video: UploadFile = File(...), user: User = Depends(get_current_user)):

    video_path = os.path.join("temp", f"video_{uuid.uuid4()}_{video.filename}")
    with open(video_path, "wb") as f:
        f.write(await video.read())

    return {
        "detected_text": "Hello (placeholder)",
        "file_saved": video_path
    }


# -----------------------
# REFRESH TOKEN
# -----------------------
@app.post("/refresh-token", response_model=TokenResponse)
def refresh(user: User = Depends(get_current_user)):
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
