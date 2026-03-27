from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime, timezone


# --- 1. User Model ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    hf_token: Optional[str] = Field(default=None)

    # Relationships: A user has many folders and many chats
    folders: List["Folder"] = Relationship(back_populates="user")
    chats: List["Chat"] = Relationship(back_populates="user")


# --- 2. Folder Model ---
class Folder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Foreign Key
    user_id: int = Field(foreign_key="user.id")

    # Relationships: A folder belongs to one user, and has many chats
    user: Optional[User] = Relationship(back_populates="folders")
    chats: List["Chat"] = Relationship(back_populates="folder")


# --- 3. Chat Session Model ---
class Chat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="New Chat")
    chat_type: str = Field(default="test_case")  # "test_case" | "test_script"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Foreign Keys
    user_id: int = Field(foreign_key="user.id")
    folder_id: Optional[int] = Field(default=None, foreign_key="folder.id")

    # Relationships
    user: Optional[User] = Relationship(back_populates="chats")
    folder: Optional[Folder] = Relationship(back_populates="chats")
    messages: List["Message"] = Relationship(back_populates="chat")


# --- 4. Chat History / Messages Model ---
class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    file_name: Optional[str] = Field(default=None)
    file_size: Optional[int] = Field(default=None)

    # Foreign Key
    chat_id: int = Field(foreign_key="chat.id")

    # Relationships: A message belongs to one chat
    chat: Optional[Chat] = Relationship(back_populates="messages")