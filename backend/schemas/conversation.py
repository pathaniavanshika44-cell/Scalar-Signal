from pydantic import BaseModel


class CreateDirectConversationRequest(BaseModel):
    contact_user_id: int


class CreateGroupConversationRequest(BaseModel):
    name: str
    member_ids: list[int]


class AddGroupMemberRequest(BaseModel):
    user_id: int