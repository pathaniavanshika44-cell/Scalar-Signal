from pydantic import BaseModel


class RegisterRequest(BaseModel):
    username: str
    phone: str | None = None
    password: str
    display_name: str
    avatar_url: str | None = None
    otp: str


class LoginRequest(BaseModel):
    username: str
    password: str