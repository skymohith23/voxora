# server/utils_notify.py
import smtplib
from email.message import EmailMessage
from config import (SMS_SMTP_HOST, SMS_SMTP_PORT, SMS_SMTP_USER,
                    SMS_SMTP_PASS, SMS_GATEWAY_EMAIL)

def send_email_to_gateway(subject: str, body: str, gateway: str = None):
    """Optional fallback: send email to SMS gateway address (carrier gateway).
    Only used if configured. gateway looks like '1234567890@txt.att.net'."""
    gateway_addr = gateway or SMS_GATEWAY_EMAIL
    if not gateway_addr:
        return False, "No gateway configured"

    msg = EmailMessage()
    msg["From"] = SMS_SMTP_USER
    msg["To"] = gateway_addr
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        with smtplib.SMTP(SMS_SMTP_HOST, SMS_SMTP_PORT) as s:
            s.starttls()
            s.login(SMS_SMTP_USER, SMS_SMTP_PASS)
            s.send_message(msg)
        return True, "Sent"
    except Exception as e:
        return False, str(e)
