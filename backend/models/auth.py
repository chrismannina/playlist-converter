from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class SpotifyToken(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: int

class AppleMusicToken(BaseModel):
    user_token: str
    expires_at: int

class YouTubeMusicAuth(BaseModel):
    authenticated: bool
    expires_at: int

class AuthStatus(BaseModel):
    spotify: bool
    apple_music: bool = Field(..., alias='appleMusic')
    youtube_music: bool = Field(..., alias='youtubeMusic')

class SpotifyUser(BaseModel):
    id: str
    display_name: str
    email: Optional[str] = None

class UserInfo(BaseModel):
    spotify: Optional[SpotifyUser] = None

class AuthStatusResponse(BaseModel):
    status: AuthStatus
    userInfo: UserInfo

class YouTubeMusicHeaders(BaseModel):
    headers: Dict[str, Any] 