from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.contact import AddContactRequest
from services.contact_service import (
    add_contact,
    get_contacts,
    search_users
)
from utils.auth_dependency import get_current_user


router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.post("/add")
def add_new_contact(
    request: AddContactRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        contact = add_contact(
            db=db,
            user_id=current_user.id,
            contact_user_id=request.contact_user_id
        )

        return {
            "message": "Contact added successfully",
            "contact_id": contact.id,
            "contact_user_id": contact.contact_user_id
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
        
@router.get("")
def get_my_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_contacts(
        db=db,
        user_id=current_user.id
    )
    
    
    
@router.get("/search")
def search_contacts(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return search_users(
        db=db,
        query=q
    )