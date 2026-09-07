from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from models.user import User

pwd_hash = PasswordHash.recommended()

FIXED_OTP = "123456"


def register_user(
    db: Session,
    username: str,
    phone: str | None,
    password: str,
    display_name: str,
    avatar_url: str | None,
    otp: str
):
    if otp != FIXED_OTP:
        raise ValueError("Invalid OTP")

    existing_user = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if existing_user:
        raise ValueError("Username already exists")

    if phone:
        existing_phone = (
            db.query(User)
            .filter(User.phone == phone)
            .first()
        )

        if existing_phone:
            raise ValueError("Phone number already registered")

    user = User(
        username=username,
        phone=phone,
        password_hash=pwd_hash.hash(password),
        display_name=display_name,
        avatar_url=avatar_url
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

def login_user(
    db: Session,
    username: str,
    password: str
):
    user = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if not user:
        raise ValueError("Invalid username or password")

    if not pwd_hash.verify(password, user.password_hash):
        raise ValueError("Invalid username or password")

    return user