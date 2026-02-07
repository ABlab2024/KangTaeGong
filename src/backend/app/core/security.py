from datetime import datetime, timedelta
from typing import Any, Union
import hashlib
import bcrypt
from jose import jwt
from app.core.config import settings

ALGORITHM = "HS256"

def _prehash_password(password: str) -> bytes:
    """
    bcrypt는 72바이트 이상의 비밀번호를 처리할 수 없습니다.
    SHA-256으로 먼저 해싱하여 64자 hex 문자열로 변환 후 bytes로 반환합니다.
    """
    return hashlib.sha256(password.encode('utf-8')).hexdigest().encode('utf-8')

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    password_bytes = _prehash_password(plain_password)
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    password_bytes = _prehash_password(password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')
