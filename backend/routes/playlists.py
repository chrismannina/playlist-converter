from fastapi import APIRouter, Request, Depends, Response, HTTPException
from typing import List
import asyncio

from models.playlist import Playlist
from services.spotify_service import SpotifyService
from services.apple_music_service import AppleMusicService
from services.youtube_music_service import YouTubeMusicService

router = APIRouter()

# --- Dependency functions for authentication ---

def get_spotify_service(request: Request) -> SpotifyService:
    token_info = request.session.get('spotify_token')
    if not token_info:
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify")
    return SpotifyService(auth_token=token_info)

def get_apple_music_service(request: Request) -> AppleMusicService:
    token_info = request.session.get('apple_music_token')
    if not token_info:
        raise HTTPException(status_code=401, detail="Not authenticated with Apple Music")
    return AppleMusicService(user_token=token_info['user_token'])

def get_ytm_service(request: Request) -> YouTubeMusicService:
    headers = request.session.get('youtube_music_headers')
    if not headers:
        raise HTTPException(status_code=401, detail="Not authenticated with YouTube Music")
    return YouTubeMusicService(headers=headers)


# --- Data mapping functions ---

def map_spotify_playlist(p: dict) -> Playlist:
    return Playlist(
        id=p['id'],
        title=p['name'],
        description=p.get('description'),
        track_count=p['tracks']['total'],
        source='spotify'
    )

def map_apple_music_playlist(p: dict) -> Playlist:
    attrs = p.get('attributes', {})
    return Playlist(
        id=p['id'],
        title=attrs.get('name'),
        description=attrs.get('description', {}).get('standard'),
        track_count=attrs.get('trackCount', 0),
        source='apple-music'
    )

def map_ytm_playlist(p: dict) -> Playlist:
    return Playlist(
        id=p['playlistId'],
        title=p['title'],
        description=p.get('description'),
        track_count=p.get('count', 0),
        source='youtube-music'
    )

# --- API Endpoints ---

@router.get("/{platform}", response_model=List[Playlist])
async def get_playlists(platform: str, request: Request):
    if platform == "spotify":
        service = get_spotify_service(request)
        playlists_raw = await service.get_user_playlists()
        return [map_spotify_playlist(p) for p in playlists_raw]
        
    elif platform == "apple-music":
        service = get_apple_music_service(request)
        playlists_raw = await service.get_user_playlists()
        return [map_apple_music_playlist(p) for p in playlists_raw]

    elif platform == "youtube-music":
        service = get_ytm_service(request)
        # ytmusicapi is sync, run in thread to not block event loop
        playlists_raw = await asyncio.to_thread(service.get_user_playlists)
        return [map_ytm_playlist(p) for p in playlists_raw]

    raise HTTPException(status_code=404, detail="Platform not supported")

@router.get("/{platform}/{playlist_id}/tracks")
async def get_playlist_tracks(platform: str, playlist_id: str, request: Request):
    # Implementation will be similar, getting the service
    # and then calling get_playlist_tracks, followed by mapping.
    return {"message": f"Tracks for {platform} playlist {playlist_id}"} 