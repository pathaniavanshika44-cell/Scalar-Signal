from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User

from schemas.conversation import (
    CreateDirectConversationRequest,
    CreateGroupConversationRequest,
    AddGroupMemberRequest
)

from schemas.message import SendMessageRequest

from services.conversation_service import (
    create_direct_conversation,
    create_group_conversation,
    get_conversation_members,
    add_group_member,
    remove_group_member,
    get_user_conversations,
    search_user_conversations
)

from services.message_service import (
    send_message,
    get_messages,
    mark_message_delivered,
    mark_message_read,
    mark_conversation_messages_read
)

from utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)


# ---------------------------------------------------------
# Create direct conversation
# ---------------------------------------------------------

@router.post("/direct")
def create_direct_chat(
    request: CreateDirectConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        conversation = create_direct_conversation(
            db=db,
            user_id=current_user.id,
            contact_user_id=request.contact_user_id
        )

        return {
            "message": "Direct conversation ready",
            "conversation": {
                "id": conversation.id,
                "type": conversation.type,
                "name": conversation.name
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ---------------------------------------------------------
# Create group conversation
# ---------------------------------------------------------

@router.post("/group")
def create_group_chat(
    request: CreateGroupConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        conversation = create_group_conversation(
            db=db,
            user_id=current_user.id,
            name=request.name,
            member_ids=request.member_ids
        )

        return {
            "message": "Group conversation created",
            "conversation": {
                "id": conversation.id,
                "type": conversation.type,
                "name": conversation.name
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ---------------------------------------------------------
# Get user's conversations
# ---------------------------------------------------------

@router.get("")
def get_my_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_conversations(
        db=db,
        user_id=current_user.id
    )


# ---------------------------------------------------------
# Search conversations
# ---------------------------------------------------------

@router.get("/search")
def search_conversations(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return search_user_conversations(
        db=db,
        user_id=current_user.id,
        query=q
    )


# ---------------------------------------------------------
# Get conversation members
# ---------------------------------------------------------

@router.get("/{conversation_id}/members")
def get_members(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return get_conversation_members(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ---------------------------------------------------------
# Send message
# ---------------------------------------------------------

@router.post("/{conversation_id}/messages")
def send_new_message(
    conversation_id: int,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        message = send_message(
            db=db,
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=request.content
        )

        return {
            "message": "Message sent successfully",
            "data": {
                "id": message.id,
                "conversation_id": message.conversation_id,
                "sender_id": message.sender_id,
                "content": message.content,
                "status": message.status,
                "created_at": message.created_at,
                "read_at": message.read_at
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ---------------------------------------------------------
# Get messages
# ---------------------------------------------------------

@router.get("/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        messages = get_messages(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id
        )

        return [
            {
                "id": message.id,
                "conversation_id": message.conversation_id,
                "sender_id": message.sender_id,
                "content": message.content,
                "status": message.status,
                "created_at": message.created_at,
                "read_at": message.read_at
            }
            for message in messages
        ]

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ---------------------------------------------------------
# Mark entire conversation as read
# IMPORTANT: This must come BEFORE {message_id}/read
# ---------------------------------------------------------

@router.patch("/{conversation_id}/messages/read")
def mark_conversation_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        count = mark_conversation_messages_read(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id
        )

        return {
            "message": "Conversation marked as read",
            "messages_marked_read": count
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ---------------------------------------------------------
# Mark individual message as delivered
# ---------------------------------------------------------

@router.patch("/{conversation_id}/messages/{message_id}/delivered")
def mark_delivered(
    conversation_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        message = mark_message_delivered(
            db=db,
            message_id=message_id,
            user_id=current_user.id
        )

        # Make sure the message belongs to this conversation
        if message.conversation_id != conversation_id:
            raise ValueError(
                "Message does not belong to this conversation"
            )

        return {
            "message": "Message marked as delivered",
            "data": {
                "id": message.id,
                "conversation_id": message.conversation_id,
                "sender_id": message.sender_id,
                "content": message.content,
                "status": message.status,
                "created_at": message.created_at,
                "read_at": message.read_at
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ---------------------------------------------------------
# Mark individual message as read
# ---------------------------------------------------------

@router.patch("/{conversation_id}/messages/{message_id}/read")
def mark_read(
    conversation_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        message = mark_message_read(
            db=db,
            message_id=message_id,
            user_id=current_user.id
        )

        # Make sure the message belongs to this conversation
        if message.conversation_id != conversation_id:
            raise ValueError(
                "Message does not belong to this conversation"
            )

        return {
            "message": "Message marked as read",
            "data": {
                "id": message.id,
                "conversation_id": message.conversation_id,
                "sender_id": message.sender_id,
                "content": message.content,
                "status": message.status,
                "created_at": message.created_at,
                "read_at": message.read_at
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ---------------------------------------------------------
# Add group member
# ---------------------------------------------------------

@router.post("/{conversation_id}/members")
def add_member(
    conversation_id: int,
    request: AddGroupMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        member = add_group_member(
            db=db,
            conversation_id=conversation_id,
            admin_user_id=current_user.id,
            user_id=request.user_id
        )

        return {
            "message": "Member added successfully",
            "member": {
                "user_id": member.user_id,
                "is_admin": member.is_admin
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ---------------------------------------------------------
# Remove group member
# ---------------------------------------------------------

@router.delete("/{conversation_id}/members/{user_id}")
def remove_member(
    conversation_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        remove_group_member(
            db=db,
            conversation_id=conversation_id,
            admin_user_id=current_user.id,
            user_id=user_id
        )

        return {
            "message": "Member removed successfully"
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )