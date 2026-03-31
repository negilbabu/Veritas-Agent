"""
Auth API routes
POST /auth/register       — register with email + password
POST /auth/login          — login, returns JWT
GET  /auth/verify         — verify email token from link
POST /auth/google         — exchange Google ID token for Veritas JWT
GET  /auth/me             — get current user profile (requires JWT)
PATCH /auth/me/password   — change password (email users only)
PATCH /auth/me/retention  — update data retention preference (GDPR)
DELETE /auth/me           — GDPR right to erasure: delete all user data
"""
import os
import uuid
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.services.database import (
    get_user_by_email, get_user_by_id, create_user,
    delete_user_data, SessionLocal, User
)
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_short_token, decode_token
)
from app.core.email import (
    send_verification_email, send_welcome_email,
    send_password_changed_email
)
from app.utils import log

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class RetentionRequest(BaseModel):
    data_retention_days: str  # "30" | "90" | "365" | "never"


# ── Dependency: get current user from Bearer token ────────────────────────────

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("purpose"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_verified_user(user: User = Depends(get_current_user)):
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    return user


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register")
async def register(body: RegisterRequest):
    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
     
    if len(body.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Password is too long (max 72 bytes)")
   
    if get_user_by_email(body.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = create_user(
        email=body.email,
        name=body.name,
        password_hash=hash_password(body.password),
        provider="email",
    )

    verify_token = create_short_token(user.id, purpose="verify_email", expires_hours=24)
    send_verification_email(body.email, body.name, verify_token)

    return {"message": "Registration successful. Please check your email to verify your account."}


@router.get("/verify")
async def verify_email(token: str):
    payload = decode_token(token)
    if not payload or payload.get("purpose") != "verify_email":
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == payload["sub"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.is_verified:
            return {"message": "Email already verified", "already_verified": True}
        user.is_verified = True
        db.commit()
        db.refresh(user)
    finally:
        db.close()

    send_welcome_email(user.email, user.name or "there")
    access_token = create_access_token(user.id, user.email)
    return {
        "message": "Email verified successfully",
        "access_token": access_token,
        "user": {"id": user.id, "email": user.email, "name": user.name, "provider": user.provider},
    }


@router.post("/login")
async def login(body: LoginRequest):
    user = get_user_by_email(body.email)
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(body.password, user.password_hash or ""):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    token = create_access_token(user.id, user.email)
    return {
        "access_token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "provider": user.provider,
            "data_retention_days": user.data_retention_days,
        },
    }

@router.post("/google")
async def google_auth(body: GoogleAuthRequest):
    """
    Verifies a Google ID token from the frontend.
    Uses google-auth library if GOOGLE_CLIENT_ID is configured,
    otherwise returns 501.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google auth not configured on this server")

    # Lazy import — only fails if google-auth is not installed AND this endpoint is hit
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="google-auth package not installed. Add 'google-auth' to requirements.txt"
        )

    try:
        # We use clock_skew=10 to account for time differences between 
        # your local machine and Google's servers.
        info = google_id_token.verify_oauth2_token(
            body.id_token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")

    google_id = info["sub"]
    email     = info["email"]
    name      = info.get("name", email.split("@")[0])

    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.google_id == google_id) | (User.email == email)
        ).first()

        if not user:
            # Create a new user if they don't exist'
            print("---------------USER NEW_____________________")
            user = create_user(email=email, name=name, provider="google", google_id=google_id)
            send_welcome_email(email, name)
        elif not user.google_id:
            print("---------------USER EXISTING_____________________")

            # Link Google ID to existing email account if not already linked
            user.google_id   = google_id
            user.is_verified = True
            db.commit()
            db.refresh(user)
    finally:
        db.close()
 
    token = create_access_token(user.id, user.email)
    return {
        "access_token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "provider": user.provider,
            "data_retention_days": user.data_retention_days,
        },
    }


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "provider": user.provider,
        "is_verified": user.is_verified,
        "data_retention_days": user.data_retention_days,
        "created_at": user.created_at.isoformat(),
    }


@router.patch("/me/password")
async def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_verified_user),
):
    if user.provider != "email":
        raise HTTPException(status_code=403, detail="Password change not available for Google accounts")
    if not verify_password(body.current_password, user.password_hash or ""):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="New password must be at least 8 characters")

    db = SessionLocal()
    try:
        db_user = db.query(User).filter(User.id == user.id).first()
        db_user.password_hash = hash_password(body.new_password)
        db.commit()
    finally:
        db.close()

    send_password_changed_email(user.email, user.name or "there")
    return {"message": "Password updated successfully"}


@router.patch("/me/retention")
async def update_retention(
    body: RetentionRequest,
    user: User = Depends(get_current_verified_user),
):
    allowed = {"30", "90", "365", "never"}
    if body.data_retention_days not in allowed:
        raise HTTPException(status_code=422, detail=f"Must be one of: {allowed}")

    db = SessionLocal()
    try:
        db_user = db.query(User).filter(User.id == user.id).first()
        db_user.data_retention_days = body.data_retention_days
        db.commit()
    finally:
        db.close()

    return {"message": "Data retention preference updated", "data_retention_days": body.data_retention_days}


@router.delete("/me")
async def delete_account(user: User = Depends(get_current_verified_user)):
    """GDPR Art.17 — Right to Erasure."""
    user_id = user.id

    # Delete Qdrant vectors
    try:
        from qdrant_client.http import models as qmodels
        from app.services.vector_db import vector_service
        vector_service.client.delete(
            collection_name=vector_service.collection_name,
            points_selector=qmodels.FilterSelector(
                filter=qmodels.Filter(
                    must=[qmodels.FieldCondition(
                        key="user_id",
                        match=qmodels.MatchValue(value=user_id)
                    )]
                )
            )
        )
    except Exception as e:
        log.error(f"[GDPR] Qdrant purge failed: {e}")

    delete_user_data(user_id)
    return {"message": "Your account and all associated data have been permanently deleted."}