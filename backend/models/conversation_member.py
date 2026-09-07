from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean
from datetime import datetime

from database import Base


class ConversationMember(Base):
    __tablename__ = "conversation_members"

    id = Column(Integer, primary_key=True, index=True)

    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    joined_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    is_admin = Column(
        Boolean,
        default=False
    )