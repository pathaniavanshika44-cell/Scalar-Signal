from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(
        self,
        conversation_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []

        self.active_connections[conversation_id].append(websocket)

    def disconnect(
        self,
        conversation_id: int,
        websocket: WebSocket
    ):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].remove(websocket)

            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]

    async def broadcast(
        self,
        conversation_id: int,
        message: dict
    ):
        connections = self.active_connections.get(
            conversation_id,
            []
        )

        for connection in connections:
            await connection.send_json(message)


manager = ConnectionManager()