# model_sms.py
import sqlite3
from datetime import datetime
import os
import json

def init_db(db_path):
    create = not os.path.exists(db_path)
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user TEXT,
        to_user TEXT,
        message TEXT,
        type TEXT,
        created_at TEXT,
        delivered INTEGER DEFAULT 0
    )
    """)
    conn.commit()
    conn.close()

def create_emergency_event(db_path, from_user, to_user, message, evt_type="alert"):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("INSERT INTO events (from_user, to_user, message, type, created_at) VALUES (?, ?, ?, ?, ?)",
              (from_user, to_user, message, evt_type, datetime.utcnow().isoformat()))
    conn.commit()
    event_id = c.lastrowid
    conn.close()
    return event_id

def get_new_events(db_path, user=None, last_id=0):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    if user:
        c.execute("SELECT id, from_user, to_user, message, type, created_at FROM events WHERE id > ? AND (to_user = ? OR to_user IS NULL) ORDER BY id ASC", (last_id, user))
    else:
        c.execute("SELECT id, from_user, to_user, message, type, created_at FROM events WHERE id > ? ORDER BY id ASC", (last_id,))
    rows = c.fetchall()
    conn.close()
    events = []
    for r in rows:
        events.append({
            "id": r[0],
            "from_user": r[1],
            "to_user": r[2],
            "message": r[3],
            "type": r[4],
            "created_at": r[5]
        })
    return events
