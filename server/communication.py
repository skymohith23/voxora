# communication.py
import sqlite3
import os
import time
from pathlib import Path

def init_db(db_path):
    first = not os.path.exists(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at INTEGER,
        emergency_contact_id TEXT
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user TEXT,
        to_user TEXT,
        message TEXT,
        created_at INTEGER
    )
    """)
    conn.commit()
    conn.close()

def create_user(db_path, user_id, name=""):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("INSERT OR IGNORE INTO users (id, name, created_at) VALUES (?, ?, ?)", (user_id, name, int(time.time())))
    conn.commit()
    conn.close()

def get_user_by_id(db_path, user_id):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id, name, created_at, emergency_contact_id FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "created_at": row[2], "emergency_contact_id": row[3]}

def get_user_by_email(db_path, email):
    # here user ids are emails in our simple system
    return get_user_by_id(db_path, email)

def set_emergency_contact(db_path, user_id, contact_id):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("UPDATE users SET emergency_contact_id = ? WHERE id = ?", (contact_id, user_id))
    conn.commit()
    conn.close()

def create_alert(db_path, from_user, to_user, message):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("INSERT INTO alerts (from_user, to_user, message, created_at) VALUES (?, ?, ?, ?)",
                (from_user, to_user, message, int(time.time())))
    alert_id = cur.lastrowid
    conn.commit()
    conn.close()
    return alert_id
