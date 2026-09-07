from sqlalchemy.orm import Session
from datetime import datetime

from models.message import Message
from models.conversation_member import ConversationMember
from models.conversation import Conversation


def send_message(
    db: Session,
    conversation_id: int,
    sender_id: int,
    content: str
):
    # Check that the conversation exists
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise ValueError("Conversation not found")

    # Check that the sender belongs to the conversation
    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            # Prevents users from sending messages to conversations
            # they are not members of.
            ConversationMember.user_id == sender_id
        )
        .first()
    )

    if not member:
        raise ValueError("You are not a member of this conversation")

    # Prevent empty messages
    if not content.strip():
        raise ValueError("Message cannot be empty")

    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content.strip(),
        status="SENT"
    )

    db.add(message)

    # Flush the message so database-generated fields,
    # especially created_at, are available before updating
    # the conversation.
    db.flush()

    # Update conversation activity
    conversation.updated_at = message.created_at

    db.commit()
    db.refresh(message)

    return message


def get_messages(
    db: Session,
    conversation_id: int,
    user_id: int
):
    # Check that the user belongs to the conversation
    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
    )

    if not member:
        raise ValueError("You are not a member of this conversation")

    messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id
        )
        .order_by(
            Message.created_at.asc()
        )
        .all()
    )

    return messages


def mark_message_delivered(
    db: Session,
    message_id: int,
    user_id: int
):
    message = (
        db.query(Message)
        .filter(Message.id == message_id)
        .first()
    )

    if not message:
        raise ValueError("Message not found")

    # Sender cannot mark their own message as delivered
    if message.sender_id == user_id:
        raise ValueError(
            "You cannot mark your own message as delivered"
        )

    # Check that the user belongs to the conversation
    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == message.conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
    )

    if not member:
        raise ValueError(
            "You are not a member of this conversation"
        )

    message.status = "DELIVERED"

    db.commit()
    db.refresh(message)

    return message


def mark_message_read(
    db: Session,
    message_id: int,
    user_id: int
):
    message = (
        db.query(Message)
        .filter(Message.id == message_id)
        .first()
    )

    if not message:
        raise ValueError("Message not found")

    # Sender cannot mark their own message as read
    if message.sender_id == user_id:
        raise ValueError(
            "You cannot mark your own message as read"
        )

    # Check that the user belongs to the conversation
    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == message.conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
    )

    if not member:
        raise ValueError(
            "You are not a member of this conversation"
        )

    message.status = "READ"
    message.read_at = datetime.utcnow()

    db.commit()
    db.refresh(message)

    return message







def mark_conversation_messages_read(
    db: Session,
    conversation_id: int,
    user_id: int
):
    # Check that the user belongs to the conversation
    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
    )

    if not member:
        raise ValueError(
            "You are not a member of this conversation"
        )

    messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
            Message.status != "READ"
        )
        .all()
    )

    now = datetime.utcnow()

    for message in messages:
        message.status = "READ"
        message.read_at = now

    db.commit()

    return len(messages)