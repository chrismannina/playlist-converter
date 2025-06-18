from fastapi import APIRouter, Request, Depends, Response, HTTPException
from typing import List
import asyncio
import os
import time

from models.playlist import Playlist
from services.spotify_service import SpotifyService
from services.apple_music_service import AppleMusicService
from services.youtube_music_service import YouTubeMusicService

router = APIRouter()

# Simple rate limiting
_request_cache = {}

def check_rate_limit(request: Request, platform: str) -> bool:
    """Simple rate limiting to prevent infinite loops"""
    client_ip = request.client.host
    now = time.time()
    key = f"{client_ip}:{platform}"
    
    if key in _request_cache:
        last_request_time, request_count = _request_cache[key]
        
        # If less than 2 seconds since last request, increment counter
        if now - last_request_time < 2:
            request_count += 1
            _request_cache[key] = (now, request_count)
            
            # If more than 5 requests in 2 seconds, rate limit
            if request_count > 5:
                print(f"⚠️ [RATE LIMIT] Too many requests for {platform} from {client_ip}")
                return False
        else:
            # Reset counter if more than 2 seconds passed
            _request_cache[key] = (now, 1)
    else:
        _request_cache[key] = (now, 1)
    
    return True

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
    headers_file = request.session.get('youtube_music_headers_file')
    if not headers_file:
        raise HTTPException(status_code=401, detail="Not authenticated with YouTube Music")
    
    # Read headers from the temporary file
    if not os.path.exists(headers_file):
        raise HTTPException(status_code=401, detail="YouTube Music authentication expired")
    
    try:
        with open(headers_file, 'r') as f:
            headers_raw = f.read()
        return YouTubeMusicService(headers_raw=headers_raw)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Failed to load YouTube Music authentication: {str(e)}")


# --- Data mapping functions ---

def map_spotify_playlist(p: dict) -> Playlist:
    return Playlist(
        id=p['id'],
        name=p['name'],
        description=p.get('description', ''),
        trackCount=p['tracks']['total'],
        public=p.get('public', True),
        owner=p.get('owner', {}).get('display_name', 'Unknown'),
        images=p.get('images', []),
        platform='spotify'
    )

def map_apple_music_playlist(p: dict) -> Playlist:
    attrs = p.get('attributes', {})
    return Playlist(
        id=p['id'],
        name=attrs.get('name', 'Unknown Playlist'),
        description=attrs.get('description', {}).get('standard', ''),
        trackCount=attrs.get('trackCount', 0),
        public=attrs.get('isPublic', True),
        owner='Apple Music User',
        images=[],
        platform='apple-music'
    )

def map_ytm_playlist(p: dict) -> Playlist:
    return Playlist(
        id=p['playlistId'],
        name=p.get('title', 'Unknown Playlist'),
        description=p.get('description', ''),
        trackCount=p.get('count', 0),
        public=True,
        owner='YouTube Music User',
        images=[],
        platform='youtube-music'
    )

# --- API Endpoints ---

@router.get("/{platform}", response_model=List[Playlist])
async def get_playlists(platform: str, request: Request):
    print(f"🔍 [DEBUG] Playlist request for platform: {platform}")
    
    if not check_rate_limit(request, platform):
        return {"error": "Rate limit exceeded"}
    
    if platform == "spotify":
        print("🎵 [DEBUG] Fetching Spotify playlists...")
        service = get_spotify_service(request)
        playlists_raw = await service.get_user_playlists()
        result = [map_spotify_playlist(p) for p in playlists_raw]
        print(f"✅ [DEBUG] Spotify: Returning {len(result)} playlists")
        return result
        
    elif platform == "apple-music":
        print("🍎 [DEBUG] Fetching Apple Music playlists...")
        service = get_apple_music_service(request)
        playlists_raw = await service.get_user_playlists()
        result = [map_apple_music_playlist(p) for p in playlists_raw]
        print(f"✅ [DEBUG] Apple Music: Returning {len(result)} playlists")
        return result

    elif platform == "youtube-music":
        print("📺 [DEBUG] Fetching YouTube Music playlists...")
        service = get_ytm_service(request)
        # ytmusicapi is sync, run in thread to not block event loop
        playlists_raw = await asyncio.to_thread(service.get_user_playlists)
        result = [map_ytm_playlist(p) for p in playlists_raw]
        print(f"✅ [DEBUG] YouTube Music: Returning {len(result)} playlists")
        return result

    print(f"❌ [DEBUG] Unknown platform: {platform}")
    raise HTTPException(status_code=404, detail="Platform not supported")

@router.get("/{platform}/{playlist_id}/tracks")
async def get_playlist_tracks(platform: str, playlist_id: str, request: Request):
    # Implementation will be similar, getting the service
    # and then calling get_playlist_tracks, followed by mapping.
    return {"message": f"Tracks for {platform} playlist {playlist_id}"}

# Test endpoint for YouTube Music
@router.get("/youtube-music/test")
async def test_youtube_music(request: Request):
    """Test endpoint to verify YouTube Music connectivity"""
    try:
        headers_file = request.session.get('youtube_music_headers_file')
        if not headers_file:
            return {"error": "Not authenticated with YouTube Music", "authenticated": False}
        
        if not os.path.exists(headers_file):
            return {"error": "YouTube Music authentication expired", "authenticated": False}
        
        with open(headers_file, 'r') as f:
            headers_raw = f.read()
        
        service = YouTubeMusicService(headers_raw=headers_raw)
        
        # Test basic connectivity
        auth_result = await asyncio.to_thread(service.test_authentication)
        
        if auth_result:
            # Try to get a small sample of playlists
            try:
                playlists = await asyncio.to_thread(service.get_user_playlists)
                return {
                    "authenticated": True,
                    "connection": "success",
                    "playlist_count": len(playlists) if playlists else 0,
                    "sample_playlist": playlists[0] if playlists else None
                }
            except Exception as e:
                return {
                    "authenticated": True,
                    "connection": "auth_ok_but_playlist_failed",
                    "error": str(e)
                }
        else:
            return {"authenticated": False, "connection": "auth_failed"}
            
    except Exception as e:
        return {"error": f"Test failed: {str(e)}", "authenticated": False} 