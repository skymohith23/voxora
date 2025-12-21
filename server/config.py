# server/config.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# SQLite DB path
SQLALCHEMY_DATABASE_URI = f"sqlite:///{BASE_DIR / 'voxora.db'}"

# Optional SMTP settings (for fallback email-to-SMS). Fill or leave blank.
SMS_SMTP_HOST = os.environ.get("SMS_SMTP_HOST", "")
SMS_SMTP_PORT = int(os.environ.get("SMS_SMTP_PORT", "587") or "587")
SMS_SMTP_USER = os.environ.get("SMS_SMTP_USER", "")
SMS_SMTP_PASS = os.environ.get("SMS_SMTP_PASS", "")
SMS_GATEWAY_EMAIL = os.environ.get("SMS_GATEWAY_EMAIL", "")  # optional e.g. 1234@txt.att.net

SECRET_KEY = os.environ.get("VOXORA_SECRET_KEY", "change-me-secret")
