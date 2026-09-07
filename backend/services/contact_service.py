from sqlalchemy.orm import Session

from models.contact import Contact
from models.user import User


def add_contact(
    db: Session,
    user_id: int,
    contact_user_id: int
):
    # User cannot add themselves
    if user_id == contact_user_id:
        raise ValueError("You cannot add yourself as a contact")

    # Check that the contact user exists
    contact_user = (
        db.query(User)
        .filter(User.id == contact_user_id)
        .first()
    )

    if not contact_user:
        raise ValueError("User not found")

    # Check if contact already exists
    existing_contact = (
        db.query(Contact)
        .filter(
            Contact.user_id == user_id,
            Contact.contact_user_id == contact_user_id
        )
        .first()
    )

    if existing_contact:
        raise ValueError("Contact already exists")

    contact = Contact(
        user_id=user_id,
        contact_user_id=contact_user_id
    )

    db.add(contact)
    db.commit()
    db.refresh(contact)

    return contact



def get_contacts(
    db: Session,
    user_id: int
):
    contacts = (
        db.query(Contact)
        .filter(Contact.user_id == user_id)
        .all()
    )

    return [
        {
            "id": contact.contact.id,
            "username": contact.contact.username,
            "display_name": contact.contact.display_name,
            "phone": contact.contact.phone,
            "avatar_url": contact.contact.avatar_url,
            "is_online": contact.contact.is_online,
            "last_seen": contact.contact.last_seen
        }
        for contact in contacts
    ]
    
    
    

def search_users(
    db: Session,
    query: str
):
    query = query.strip()

    if not query:
        return []

    users = (
        db.query(User)
        .filter(
            (User.username.ilike(f"%{query}%")) |
            (User.display_name.ilike(f"%{query}%")) |
            (User.phone.ilike(f"%{query}%"))
        )
        .limit(20)
        .all()
    )

    return [
        {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "phone": user.phone,
            "avatar_url": user.avatar_url,
            "is_online": user.is_online
        }
        for user in users
    ]