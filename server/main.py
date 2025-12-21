# main.py
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse

from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, String, DateTime, create_engine, Table, MetaData
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from passlib.context import CryptContext
from jose import jwt, JWTError

from gtts import gTTS
import time


# ---------------------------
# CONFIG
# ---------------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_FILE = os.path.join(BASE_DIR, "database.db")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SECRET_KEY = os.getenv("VOXORA_SECRET", "change_this_in_prod_123456")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day


# ---------------------------
# DATABASE
# ---------------------------
engine = create_engine(f"sqlite:///{DB_FILE}", connect_args={"check_same_thread": False})
metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", String, primary_key=True),
    Column("email", String, unique=True, nullable=False),
    Column("name", String, nullable=False),
    Column("hashed_password", String, nullable=False),
    Column("emergency_contact_id", String, nullable=True),
    Column("created_at", DateTime, nullable=False),
)

alerts = Table(
    "alerts",
    metadata,
    Column("id", String, primary_key=True),
    Column("from_user", String, nullable=False),
    Column("to_user", String, nullable=False),
    Column("message", String, nullable=False),
    Column("created_at", DateTime, nullable=False),
)

metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# ---------------------------
# PASSWORD & AUTH
# ---------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def truncate_password(p: str) -> str:
    """bcrypt can't handle >72 byte passwords."""
    return p[:72]


def get_password_hash(password: str) -> str:
    return pwd_context.hash(truncate_password(password))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(truncate_password(plain), hashed)


def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ---------------------------
# FASTAPI + OPENAPI FIX
# ---------------------------
app = FastAPI(title="Voxora Backend", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = app.openapi_schema = app.openapi()

    # Add security scheme
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}

    if "securitySchemes" not in openapi_schema["components"]:
        openapi_schema["components"]["securitySchemes"] = {}

    openapi_schema["components"]["securitySchemes"]["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
    }

    # Attach security scheme to ALL routes by default
    openapi_schema["security"] = [{"BearerAuth": []}]

    return openapi_schema



# ---------------------------
# MODELS
# ---------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = "no-name"
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class EmergencyContactRequest(BaseModel):
    contact_email: EmailStr


class EmergencyTextRequest(BaseModel):
    to_user: str
    message: str


# ---------------------------
# DB HELPERS
# ---------------------------
def db_get_user_by_email(db, email: str):
    r = db.execute(users.select().where(users.c.email == email)).fetchone()
    return dict(r) if r else None


def db_get_user_by_id(db, uid: str):
    r = db.execute(users.select().where(users.c.id == uid)).fetchone()
    return dict(r) if r else None


def db_create_user(db, email: str, name: str, hashed: str):
    now = datetime.utcnow()
    db.execute(
        users.insert().values(
            id=email,
            email=email,
            name=name,
            hashed_password=hashed,
            created_at=now,
        )
    )
    db.commit()
    return email


def db_set_emergency_contact(db, user_id: str, contact_id: str):
    db.execute(users.update().where(users.c.id == user_id).values(emergency_contact_id=contact_id))
    db.commit()


def db_create_alert(db, sender: str, receiver: str, msg: str):
    alert_id = str(uuid.uuid4())
    now = datetime.utcnow()
    db.execute(
        alerts.insert().values(
            id=alert_id,
            from_user=sender,
            to_user=receiver,
            message=msg,
            created_at=now,
        )
    )
    db.commit()
    return alert_id


# ---------------------------
# AUTH DEPENDENCY
# ---------------------------
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    uid = payload.get("sub")
    db = SessionLocal()
    user = db_get_user_by_id(db, uid)
    db.close()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------------------------
# ROUTES
# ---------------------------
@app.get("/ping")
def ping():
    return {"ok": True, "msg": "pong"}


@app.post("/register", status_code=201)
def register(req: RegisterRequest):
    db = SessionLocal()
    try:
        if db_get_user_by_email(db, req.email):
            raise HTTPException(400, "Email already registered")
        hashed = get_password_hash(req.password)
        uid = db_create_user(db, req.email, req.name, hashed)
        return {"message": "registered", "user_id": uid}
    finally:
        db.close()


@app.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    db = SessionLocal()
    try:
        user = db_get_user_by_email(db, req.email)
        if not user or not verify_password(req.password, user["hashed_password"]):
            raise HTTPException(401, "Incorrect email or password")
        token = create_access_token({"sub": user["id"]})
        return {"access_token": token}
    finally:
        db.close()


@app.post("/swagger-login", response_model=TokenResponse)
def swagger_login(form: OAuth2PasswordRequestForm = Depends()):
    db = SessionLocal()
    try:
        user = db_get_user_by_email(db, form.username)
        if not user or not verify_password(form.password, user["hashed_password"]):
            raise HTTPException(401, "Incorrect credentials")
        token = create_access_token({"sub": user["id"]})
        return {"access_token": token}
    finally:
        db.close()


@app.get("/me")
def me(current=Depends(get_current_user)):
    return {
        "id": current["id"],
        "email": current["email"],
        "name": current["name"],
        "emergency_contact_id": current.get("emergency_contact_id"),
    }


@app.post("/me/set-emergency-contact")
def set_emergency_contact(body: EmergencyContactRequest, current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        target = db_get_user_by_email(db, body.contact_email)
        if not target:
            raise HTTPException(404, "Contact not found")
        db_set_emergency_contact(db, current["id"], target["id"])
        return {"ok": True}
    finally:
        db.close()


@app.post("/emergency/send-text")
def send_text(body: EmergencyTextRequest, current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        target = db_get_user_by_id(db, body.to_user)
        if not target:
            raise HTTPException(404, "Recipient not found")
        alert_id = db_create_alert(db, current["id"], body.to_user, body.message)
        return {"ok": True, "alert_id": alert_id}
    finally:
        db.close()


@app.post("/emergency/send-voice")
def send_voice(body: EmergencyTextRequest, current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        target = db_get_user_by_id(db, body.to_user)
        if not target:
            raise HTTPException(404, "Recipient not found")

        filename = f"tts_{uuid.uuid4().hex}.mp3"
        path = os.path.join(OUTPUT_DIR, filename)

        gTTS(text=body.message, lang="en").save(path)
        url = f"/output/{filename}"

        alert_id = db_create_alert(db, current["id"], body.to_user, f"[voice] {body.message}")

        return {"ok": True, "alert_id": alert_id, "mp3_url": url}
    finally:
        db.close()


# ---------------------------
# MAIN ENTRY
# ---------------------------
if __name__ == "__main__":
    import uvicorn
    print("Running Voxora backend on http://127.0.0.1:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
