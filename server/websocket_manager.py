# websocket_manager.py
from typing import Dict
from fastapi import WebSocket
import json

class WebSocketManager:
    def __init__(self):
        # mapping user_id -> websocket
        self.user_sockets: Dict[str, WebSocket] = {}
        # also track raw WebSocket objects (non-user) for video stream connections
        self.raw_sockets = set()

    async def connect_ws(self, ws: WebSocket):
        await ws.accept()
        self.raw_sockets.add(ws)

    def disconnect_ws(self, ws: WebSocket):
        try:
            self.raw_sockets.remove(ws)
        except KeyError:
            pass

    async def connect_user(self, ws: WebSocket, user_id: str):
        await ws.accept()
        self.user_sockets[user_id] = ws

    def disconnect_user(self, user_id: str):
        ws = self.user_sockets.pop(user_id, None)
        # nothing else to do

    def is_connected(self, user_id: str) -> bool:
        return user_id in self.user_sockets

    def send_json_to_user(self, user_id: str, obj):
        ws = self.user_sockets.get(user_id)
        if not ws:
            return False
        # schedule send (caller will await send in main)
        import asyncio
        asyncio.create_task(ws.send_json(obj))
        return True

manager = WebSocketManager()
