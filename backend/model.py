from sqlmodel import SQLModel, Field
from typing import Optional
import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str = Field(max_length=30)

# # Example for future Chat History
# class ChatHistory(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     user_id: int = Field(foreign_key="user.id")
#     role: str # "user" or "assistant"
#     content: str
#     timestamp: datetime = Field(default_factory=datetime.datetime.now(datetime.UTC))