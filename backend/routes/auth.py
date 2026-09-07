from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import RegisterRequest, LoginRequest
from services.auth_service import register_user, login_user
from utils.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    try:
        user = register_user(
            db=db,
            username=request.username,
            phone=request.phone,
            password=request.password,
            display_name=request.display_name,
            avatar_url=request.avatar_url,
            otp=request.otp
        )

        return {
            "message": "Registration successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "phone": user.phone,
                "avatar_url": user.avatar_url
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
        
@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    try:
        user = login_user(
            db=db,
            username=request.username,
            password=request.password
        )
        access_token = create_access_token(user.id)
        return {
            "message": "Login successful",
            "access_token": access_token,
            "user": {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "phone": user.phone,
            "avatar_url": user.avatar_url
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )