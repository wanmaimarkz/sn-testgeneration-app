from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from dependency import get_db_session, get_rag_collection
from model import Folder, Chat, Message

router = APIRouter(prefix="/api/folders", tags=["Folders"])


class FolderCreate(BaseModel):
    name: str
    user_id: int


@router.post("/")
def create_folder(folder_in: FolderCreate, session: Session = Depends(get_db_session)):
    db_folder = Folder(name=folder_in.name, user_id=folder_in.user_id)
    session.add(db_folder)
    session.commit()
    session.refresh(db_folder)
    return db_folder


@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    session: Session = Depends(get_db_session),
    collection=Depends(get_rag_collection),
):
    # 1. Verify folder exists
    folder = session.get(Folder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # 2. Find all chats inside this folder
    statement = select(Chat).where(Chat.folder_id == folder_id)
    chats = session.exec(statement).all()

    # 3. Cascade Delete: Chats, Messages, and Vectors
    for chat in chats:
        # A. Delete Messages
        msg_statement = select(Message).where(Message.chat_id == chat.id)
        messages = session.exec(msg_statement).all()
        for msg in messages:
            session.delete(msg)

        # B. Delete Vectors in ChromaDB
        collection.delete(where={"chat_id": str(chat.id)})

        # C. Delete Chat
        session.delete(chat)

    # 4. Delete the Folder from SQLite
    session.delete(folder)
    session.commit()

    return {
        "message": f"Folder {folder_id} deleted successfully.",
        "chats_deleted": len(chats),
    }
