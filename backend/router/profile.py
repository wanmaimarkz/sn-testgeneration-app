from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from dependency import get_db_session
from model import User
from passlib.context import CryptContext

router = APIRouter(prefix="/api/profile", tags=["Profile"])

# Use the same hashing context as your auth router
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- SCHEMAS ---
class UsernameUpdate(BaseModel):
    user_id: int
    new_username: str


class PasswordUpdate(BaseModel):
    user_id: int
    current_password: str
    new_password: str


# --- ENDPOINTS ---


@router.patch("/username")
def change_username(data: UsernameUpdate, session: Session = Depends(get_db_session)):
    # 1. Verify user exists
    user = session.get(User, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Check if new username is already taken by someone else
    statement = select(User).where(User.username == data.new_username)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username is already taken")

    # 3. Update and save
    user.username = data.new_username
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"message": "Username updated successfully", "new_username": user.username}


@router.patch("/password")
def change_password(data: PasswordUpdate, session: Session = Depends(get_db_session)):
    # 1. Verify user exists
    user = session.get(User, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Verify current password is correct
    if not pwd_context.verify(data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password",
        )

    # 3. Hash new password, update, and save
    user.hashed_password = pwd_context.hash(data.new_password)
    session.add(user)
    session.commit()

    return {"message": "Password updated successfully"}
