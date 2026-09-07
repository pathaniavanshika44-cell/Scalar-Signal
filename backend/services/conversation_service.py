from sqlalchemy.orm import Session
from datetime import datetime
from models.conversation import Conversation
from models.conversation_member import ConversationMember
from models.user import User
from models.message import Message

def create_direct_conversation(
    db: Session,
    user_id: int,
    contact_user_id: int
):
    # User cannot create a conversation with themselves
    if user_id == contact_user_id:
        raise ValueError("You cannot create a conversation with yourself")

    # Check that the other user exists
    contact_user = (
        db.query(User)
        .filter(User.id == contact_user_id)
        .first()
    )

    if not contact_user:
        raise ValueError("User not found")

    # Check if a direct conversation already exists
    existing_conversation = (
        db.query(Conversation)
        .join(
            ConversationMember,
            Conversation.id == ConversationMember.conversation_id
        )
        .filter(
            Conversation.type == "DIRECT",
            ConversationMember.user_id == user_id
        )
        .all()
    )

    for conversation in existing_conversation:
        members = (
            db.query(ConversationMember)
            .filter(
                ConversationMember.conversation_id == conversation.id
            )
            .all()
        )

        member_ids = {member.user_id for member in members}

        if member_ids == {user_id, contact_user_id}:
            return conversation

    # Create new direct conversation
    conversation = Conversation(
        type="DIRECT"
    )

    db.add(conversation)
    db.flush()

    # Add both users as members
    user_member = ConversationMember(
        conversation_id=conversation.id,
        user_id=user_id,
        is_admin=False
    )

    contact_member = ConversationMember(
        conversation_id=conversation.id,
        user_id=contact_user_id,
        is_admin=False
    )

    db.add(user_member)
    db.add(contact_member)

    db.commit()
    db.refresh(conversation)

    return conversation




def create_group_conversation(
    db: Session,
    user_id: int,
    name: str,
    member_ids: list[int]
):
    # Group name cannot be empty
    if not name.strip():
        raise ValueError("Group name cannot be empty")

    # Remove duplicate member IDs
    member_ids = list(set(member_ids))

    # The creator must be part of the group
    if user_id not in member_ids:
        member_ids.append(user_id)

    # Check that all users exist
    users = (
        db.query(User)
        .filter(User.id.in_(member_ids))
        .all()
    )

    existing_user_ids = {user.id for user in users}

    missing_user_ids = set(member_ids) - existing_user_ids

    if missing_user_ids:
        raise ValueError("One or more users not found")

    # Create group conversation
    conversation = Conversation(
        type="GROUP",
        name=name.strip()
    )

    db.add(conversation)
    db.flush()

    # Add members
    for member_id in member_ids:
        member = ConversationMember(
            conversation_id=conversation.id,
            user_id=member_id,
            is_admin=(member_id == user_id)
        )

        db.add(member)

    db.commit()
    db.refresh(conversation)

    return conversation



def get_conversation_members(
    db: Session,
    conversation_id: int,
    user_id: int
):
    # Check that the conversation exists
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise ValueError("Conversation not found")

    # Check that the requesting user belongs to the conversation
    current_member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
    )

    if not current_member:
        raise ValueError("You are not a member of this conversation")

    members = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id
        )
        .all()
    )

    return [
        {
            "user_id": member.user_id,
            "username": db.query(User)
                .filter(User.id == member.user_id)
                .first()
                .username,
            "display_name": db.query(User)
                .filter(User.id == member.user_id)
                .first()
                .display_name,
            "avatar_url": db.query(User)
                .filter(User.id == member.user_id)
                .first()
                .avatar_url,
            "is_admin": member.is_admin
        }
        for member in members
    ]
    


def add_group_member(
    db: Session,
    conversation_id: int,
    admin_user_id: int,
    user_id: int
):
    # Check that the conversation exists
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise ValueError("Conversation not found")

    # Only groups can have members added
    if conversation.type != "GROUP":
        raise ValueError("Members can only be added to groups")

    # Check that the requester is a member and admin
    admin_member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == admin_user_id
        )
        .first()
    )

    if not admin_member:
        raise ValueError("You are not a member of this group")

    if not admin_member.is_admin:
        raise ValueError("Only group admins can add members")

    # Check that the new user exists
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise ValueError("User not found")

    # Check if user is already a member
    existing_member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
    )

    if existing_member:
        raise ValueError("User is already a member of this group")

    # Add member
    new_member = ConversationMember(
        conversation_id=conversation_id,
        user_id=user_id,
        is_admin=False
    )

    db.add(new_member)

    # Update group activity
    conversation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(new_member)

    return new_member





def remove_group_member(
    db: Session,
    conversation_id: int,
    admin_user_id: int,
    user_id: int
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise ValueError("Conversation not found")

    if conversation.type != "GROUP":
        raise ValueError("Members can only be removed from groups")

    admin_member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == admin_user_id
        )
        .first()
    )

    if not admin_member:
        raise ValueError("You are not a member of this group")

    if not admin_member.is_admin:
        raise ValueError("Only group admins can remove members")

    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
    )

    if not member:
        raise ValueError("User is not a member of this group")

    if member.is_admin:
        raise ValueError("Admins cannot be removed")

    db.delete(member)

    conversation.updated_at = datetime.utcnow()

    db.commit()

    return True





def get_user_conversations(
    db: Session,
    user_id: int
):
    conversations = (
        db.query(Conversation)
        .join(
            ConversationMember,
            Conversation.id == ConversationMember.conversation_id
        )
        .filter(
            ConversationMember.user_id == user_id
        )
        .order_by(
            Conversation.updated_at.desc()
        )
        .all()
    )

    result = []

    for conversation in conversations:
        # Get the latest message
        latest_message = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation.id
            )
            .order_by(
                Message.created_at.desc()
            )
            .first()
        )

        # Determine the name/avatar shown in the sidebar
        if conversation.type == "GROUP":
            name = conversation.name
            avatar_url = None

        else:
            other_member = (
                db.query(ConversationMember)
                .filter(
                    ConversationMember.conversation_id == conversation.id,
                    ConversationMember.user_id != user_id
                )
                .first()
            )

            if other_member:
                other_user = (
                    db.query(User)
                    .filter(User.id == other_member.user_id)
                    .first()
                )

                name = other_user.display_name
                avatar_url = other_user.avatar_url

            else:
                name = "Unknown"
                avatar_url = None

        unread_count = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation.id,
                Message.sender_id != user_id,
                Message.status != "READ"
            )
            .count()
        )

    result.append({
        "id": conversation.id,
        "type": conversation.type,
        "name": name,
        "avatar_url": avatar_url,
        "last_message": (
            latest_message.content
            if latest_message
            else None
        ),
    "updated_at": conversation.updated_at,
    "unread_count": unread_count
})

    return result






def search_user_conversations(
    db: Session,
    user_id: int,
    query: str
):
    query = query.strip()

    if not query:
        return []

    conversations = (
        db.query(Conversation)
        .join(
            ConversationMember,
            Conversation.id == ConversationMember.conversation_id
        )
        .filter(
            ConversationMember.user_id == user_id
        )
        .all()
    )

    results = []

    for conversation in conversations:

        # Group conversation
        if conversation.type == "GROUP":
            if not conversation.name:
                continue

            if query.lower() not in conversation.name.lower():
                continue

            name = conversation.name
            avatar_url = None

        # Direct conversation
        else:
            other_member = (
                db.query(ConversationMember)
                .filter(
                    ConversationMember.conversation_id == conversation.id,
                    ConversationMember.user_id != user_id
                )
                .first()
            )

            if not other_member:
                continue

            other_user = (
                db.query(User)
                .filter(User.id == other_member.user_id)
                .first()
            )

            if not other_user:
                continue

            if (
                query.lower() not in other_user.display_name.lower()
                and query.lower() not in other_user.username.lower()
            ):
                continue

            name = other_user.display_name
            avatar_url = other_user.avatar_url

        latest_message = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation.id
            )
            .order_by(
                Message.created_at.desc()
            )
            .first()
        )

        unread_count = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation.id,
                Message.sender_id != user_id,
                Message.status != "READ"
            )
            .count()
        )

        results.append({
            "id": conversation.id,
            "type": conversation.type,
            "name": name,
            "avatar_url": avatar_url,
            "last_message": (
                latest_message.content
                if latest_message
                else None
            ),
            "updated_at": conversation.updated_at,
            "unread_count": unread_count
        })

    results.sort(
        key=lambda conversation: (
            conversation["updated_at"] is not None,
            conversation["updated_at"]
        ),
        reverse=True
    )

    return results