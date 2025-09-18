from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.websockets.connection_manager import ConnectionManager
from app.auth.dependencies import get_current_user_ws

router = APIRouter()
manager = ConnectionManager()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: int,
    current_user = Depends(get_current_user_ws)
):
    await manager.connect(websocket, current_user.id)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle different types of real-time events
            if data["type"] == "chat_message":
                await manager.broadcast({
                    "type": "chat_message",
                    "user": current_user.username,
                    "message": data["message"]
                })
            elif data["type"] == "typing_indicator":
                await manager.broadcast({
                    "type": "typing_indicator",
                    "user": current_user.username,
                    "isTyping": data["isTyping"]
                })
    except WebSocketDisconnect:
        await manager.disconnect(websocket, current_user.id)