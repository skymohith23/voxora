# server/models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    # store socket id for realtime delivery
    socket_id = db.Column(db.String(200), nullable=True)

class EmergencyContact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    contact_username = db.Column(db.String(120), nullable=False)  # username of contact who uses app
    # optional fallback phone/email for email-to-sms
    fallback = db.Column(db.String(200), nullable=True)

class EmergencyEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    message = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
