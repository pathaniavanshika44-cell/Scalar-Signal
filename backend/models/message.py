from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime

from database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id"),
        nullable=False
    )

    sender_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    content = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        default="SENT"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    read_at = Column(
        DateTime,
        nullable=True
    )