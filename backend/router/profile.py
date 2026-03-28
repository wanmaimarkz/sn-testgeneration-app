from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from dependency import get_db_session
from model import User
import bcrypt

router = APIRouter(prefix="/profile", tags=["Profile"])


# --- SCHEMAS ---
class UsernameUpdate(BaseModel):
    user_id: int
    new_username: str


class PasswordUpdate(BaseModel):
    user_id: int
    current_password: str
    new_password: str

class HFTokenUpdate(BaseModel):
    user_id: int
    hf_token: str
    hf_endpoint_url: Optional[str] = None


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
    if not bcrypt.checkpw(
        data.current_password.encode(), user.hashed_password.encode()
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password",
        )

    # 3. Hash new password, update, and save
    user.hashed_password = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt())
    session.add(user)
    session.commit()

    return {"message": "Password updated successfully"}


@router.patch("/hf-token")
def update_hf_token(data: HFTokenUpdate, session: Session = Depends(get_db_session)):
    user = session.get(User, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hf_token = data.hf_token
    if data.hf_endpoint_url:
        user.hf_endpoint_url = data.hf_endpoint_url
    session.add(user)
    session.commit()
    return {"message": "Hugging Face settings saved successfully"}


@router.delete("/hf-token")
def remove_hf_token(user_id: int, session: Session = Depends(get_db_session)):
    """Remove only the HuggingFace API token from the user account."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hf_token = None
    session.add(user)
    session.commit()
    return {"message": "HuggingFace token removed successfully"}


@router.delete("/hf-endpoint")
def remove_hf_endpoint(user_id: int, session: Session = Depends(get_db_session)):
    """Remove only the HuggingFace Inference Endpoint URL from the user account."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hf_endpoint_url = None
    session.add(user)
    session.commit()
    return {"message": "HuggingFace endpoint URL removed successfully"}