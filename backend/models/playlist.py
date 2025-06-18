from pydantic import BaseModel, Field
from typing import List, Optional

class Track(BaseModel):
    id: str
    title: str
    artist: str
    album: Optional[str] = None
    duration_ms: int = Field(..., alias="durationMs")

class Playlist(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    track_count: int = Field(..., alias="trackCount")
    source: str # e.g., "spotify", "apple-music", "youtube-music"

class PlaylistDetails(Playlist):
    tracks: List[Track] 