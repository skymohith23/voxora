# signaling.py
from websocket_manager import manager

class SignalingManager:
    def __init__(self, manager):
        self.manager = manager

    async def relay(self, from_user, to_user, kind, data):
        # message structure delivered to target
        payload = {"from": from_user, "kind": kind, "data": data}
        # if target connected via WebSocket, send
        if self.manager.is_connected(to_user):
            self.manager.send_json_to_user(to_user, payload)
            return True
        return False
