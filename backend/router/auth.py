from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
import bcrypt
from pydantic import BaseModel
from dependency import get_db_session
from model import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class UserAuth(BaseModel):
    username: str
    password: str


# --- ENDPOINTS ---
@router.get("/")
def health_check():
    return {"health": "OK"}


@router.post("/register", status_code=201)
def sign_up(user_data: UserAuth, session: Session = Depends(get_db_session)):
    # Check if user exists
    statement = select(User).where(User.username == user_data.username)
    if session.exec(statement).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create User
    hashed_pwd = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(username=user_data.username, hashed_password=hashed_pwd)

    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {
        "message": "User created",
        "user_id": new_user.id,
        "username": new_user.username,
    }


@router.post("/login")
def login(user_data: UserAuth, session: Session = Depends(get_db_session)):
    statement = select(User).where(User.username == user_data.username)
    user = session.exec(statement).first()

    if not user or not bcrypt.checkpw(
        user_data.password.encode(), user.hashed_password.encode()
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "user_id": user.id,
        "username": user.username,
        "hf_token": user.hf_token
    }
