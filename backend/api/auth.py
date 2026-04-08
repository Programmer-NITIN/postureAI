"""
Authentication API Routes

Handles user registration, login (email/password), and Google OAuth.
Returns JWT tokens for authenticated sessions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel, EmailStr
from typing import Optional

from backend.database.connection import get_db
from backend.database.models import User
from backend.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_google_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ── Request / Response Schemas ──────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    id_token: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    picture: Optional[str]
    role: str
    created_at: Optional[str]


# ── Routes ──────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: DBSession = Depends(get_db)):
    """Register a new user with email and password."""
    # Check if user already exists
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    if len(body.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name or body.email.split("@")[0],
        role="patient",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email, user.role)
    return AuthResponse(access_token=token, user=user.to_dict())


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: DBSession = Depends(get_db)):
    """Login with email and password."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    token = create_access_token(user.id, user.email, user.role)
    return AuthResponse(access_token=token, user=user.to_dict())


@router.post("/google", response_model=AuthResponse)
def google_auth(body: GoogleAuthRequest, db: DBSession = Depends(get_db)):
    """
    Authenticate via Google OAuth.
    
    Flow:
    1. Frontend obtains a Google ID token via Google Sign-In
    2. Frontend sends the ID token to this endpoint
    3. Backend verifies the token with Google
    4. Backend creates or retrieves the user
    5. Backend returns a JWT access token
    """
    google_info = verify_google_token(body.id_token)

    # Check if user exists by Google ID or email
    user = db.query(User).filter(
        (User.google_id == google_info["google_id"]) |
        (User.email == google_info["email"])
    ).first()

    if user:
        # Update Google info if not set
        if not user.google_id:
            user.google_id = google_info["google_id"]
        if not user.picture and google_info.get("picture"):
            user.picture = google_info["picture"]
        if not user.name and google_info.get("name"):
            user.name = google_info["name"]
        db.commit()
        db.refresh(user)
    else:
        # Create new user from Google info
        user = User(
            email=google_info["email"],
            name=google_info.get("name", ""),
            picture=google_info.get("picture", ""),
            google_id=google_info["google_id"],
            role="patient",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id, user.email, user.role)
    return AuthResponse(access_token=token, user=user.to_dict())


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return current_user.to_dict()
