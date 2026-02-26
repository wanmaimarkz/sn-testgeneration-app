from fastapi import APIRouter, Depends
from sqlmodel import Session
from pydantic import BaseModel
from dependency import get_db_session
from model import Folder

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
