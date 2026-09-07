from pydantic import BaseModel


class AddContactRequest(BaseModel):
    contact_user_id: int