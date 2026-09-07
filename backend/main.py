from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect

from jose import JWTError, jwt

from database import Base, engine, SessionLocal

from models.user import User
from models.contact import Contact
from models.conversation import Conversation
from models.conversation_member import ConversationMember
from models.message import Message

from routes.auth import router as auth_router
from routes.contacts import router as contacts_router
from routes.conversations import router as conversations_router

from services.websocket_manager import manager
from services.message_service import send_message

from utils.auth_dependency import get_current_user
from utils.jwt import SECRET_KEY, ALGORITHM


app = FastAPI(title="Scalar Signal API")

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(contacts_router)
app.include_router(conversations_router)


@app.get("/")
def root():
    return {"message": "Scalar Signal API is running"}


@app.get("/auth/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "display_name": current_user.display_name,
        "phone": current_user.phone,
        "avatar_url": current_user.avatar_url
    }


@app.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    token: str
):
    db = SessionLocal()

    try:
        # Validate JWT
        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM]
            )

            user_id = payload.get("sub")

            if user_id is None:
                await websocket.close(code=1008)
                return

            user_id = int(user_id)

        except (JWTError, ValueError):
            await websocket.close(code=1008)
            return

        # Check that user belongs to conversation
        member = (
            db.query(ConversationMember)
            .filter(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id == user_id
            )
            .first()
        )

        if not member:
            await websocket.close(code=1008)
            return

        await manager.connect(
            conversation_id,
            websocket
        )

        while True:
            data = await websocket.receive_json()

            event_type = data.get("type")

            # Typing indicator
            if event_type == "typing":
                await manager.broadcast(
                    conversation_id,
                    {
                        "type": "typing",
                        "user_id": user_id,
                        "is_typing": data.get("is_typing", False)
                    }
                )
                continue

            # Message
            content = data.get("content")

            if not content:
                continue

            try:
                message = send_message(
                    db=db,
                    conversation_id=conversation_id,
                    sender_id=user_id,
                    content=content
                )

                await manager.broadcast(
                    conversation_id,
                    {
                        "id": message.id,
                        "conversation_id": message.conversation_id,
                        "sender_id": message.sender_id,
                        "content": message.content,
                        "status": message.status,
                        "created_at": message.created_at.isoformat(),
                        "read_at": message.read_at
                    }
                )

            except ValueError:
                continue

    except WebSocketDisconnect:
        manager.disconnect(
            conversation_id,
            websocket
        )

    finally:
        db.close()