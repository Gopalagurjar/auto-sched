from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from pydantic import BaseModel

import models
import schemas

# ✅ FIX: import from utils (NOT from auth itself)
from utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_db
)

from utils.email import send_reset_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ---------------- REQUEST SCHEMAS ----------------
class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "student"


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ---------------- LOGIN ----------------
@router.post("/login", response_model=schemas.Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(
        models.User.username == login_data.username
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_access_token({"sub": user.username})

    faculty_id = None
    if user.role == "faculty":
        faculty = db.query(models.Faculty).filter(
            models.Faculty.email == user.email
        ).first()
        faculty_id = faculty.id if faculty else None

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "faculty_id": faculty_id,
        "student_group_id": user.student_group_id
    }


# ---------------- REGISTER ----------------
@router.post("/register", response_model=schemas.UserOut)
def register(user_data: RegisterRequest, db: Session = Depends(get_db)):

    existing = db.query(models.User).filter(
        (models.User.username == user_data.username) |
        (models.User.email == user_data.email)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ---------------- FORGOT PASSWORD ----------------
@router.post("/forgot-password")
def forgot_password(
    email: str,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):

    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        return {"message": "If email exists, reset link sent"}

    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.email == email
    ).delete()

    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)

    reset_token = models.PasswordResetToken(
        email=email,
        token=token,
        expires_at=expires
    )

    db.add(reset_token)
    db.commit()

    if background_tasks:
        background_tasks.add_task(send_reset_email, email, token)
    else:
        send_reset_email(email, token)

    return {"message": "Reset link sent"}


# ---------------- RESET PASSWORD ----------------
@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):

    token_entry = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == request.token,
        models.PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not token_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(models.User).filter(
        models.User.email == token_entry.email
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user.hashed_password = get_password_hash(request.new_password)

    db.delete(token_entry)
    db.commit()

    return {"message": "Password reset successful"}
