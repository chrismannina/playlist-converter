import os
import time
import asyncio
from fastapi import APIRouter, Request, Response, Depends
from starlette.responses import RedirectResponse
import httpx
from uuid import uuid4

from services.spotify_service import SpotifyService
from services.apple_music_service import AppleMusicService
from services.youtube_music_service import YouTubeMusicService
from models.auth import AuthStatusResponse, AuthStatus, UserInfo, YouTubeMusicHeaders

router = APIRouter()

# In a real app, this should be a long, random, secret string
# and loaded from environment variables
SESSION_SECRET_KEY = os.environ.get("SESSION_SECRET_KEY", "your-super-secret-key")

# Placeholder for Spotipy client
# sp_oauth = ...

# Spotify OAuth endpoints
@router.get('/spotify')
async def spotify_login(request: Request):
    state = str(uuid4())
    request.session['spotify_state'] = state
    spotify_service = SpotifyService()
    auth_url = spotify_service.get_authorize_url(state=state)
    return RedirectResponse(auth_url)


@router.get('/spotify/callback')
async def spotify_callback(request: Request, response: Response, code: str, state: str):
    try:
        session_state = request.session.pop('spotify_state', None)
        if not session_state or state != session_state:
            return Response(content="State mismatch", status_code=400)
        
        spotify_service = SpotifyService()
        token_info = await spotify_service.get_access_token(code)
        request.session['spotify_token'] = token_info
        
        # Get user info
        user_spotify_service = SpotifyService(auth_token=token_info)
        user = await user_spotify_service.get_current_user()
        request.session['spotify_user'] = user.dict()
        
        return RedirectResponse(url=os.environ.get("FRONTEND_URL", "http://localhost:3000") + "?platform=spotify&status=success")
    except Exception as e:
        print(f"Spotify callback error: {e}")
        import traceback
        traceback.print_exc()
        return Response(content=f"Authentication failed: {str(e)}", status_code=500)


# Apple Music authentication
@router.post('/apple-music')
async def apple_music_login(request: Request, user_token: dict):
    # The frontend sends us the user token obtained from MusicKit JS
    token = user_token.get('userToken')
    if not token:
        return Response(content="Missing user token", status_code=400)

    request.session['apple_music_token'] = {
        "user_token": token,
        # Give it a reasonable expiry time, e.g., 6 months, as user tokens are long-lived
        "expires_at": int(time.time()) + (180 * 24 * 60 * 60)
    }
    return {"success": True, "message": "Apple Music authenticated successfully"}


# YouTube Music authentication
@router.post('/youtube-music')
async def youtube_music_login(request: Request, headers_data: dict):
    print(f"[DEBUG] YouTube Music login attempt: {headers_data.keys()}")
    
    headers_raw = headers_data.get('headers_raw')
    if not headers_raw:
        print("[DEBUG] Missing headers_raw")
        return Response(content="Missing headers_raw", status_code=400)

    print(f"[DEBUG] Headers received, length: {len(headers_raw)}")
    
    try:
        ytm_service = YouTubeMusicService(headers_raw=headers_raw)
        print("[DEBUG] YouTubeMusicService created successfully")
        
        # Run synchronous test_authentication in a thread to avoid blocking
        auth_result = await asyncio.to_thread(ytm_service.test_authentication)
        print(f"[DEBUG] Authentication test result: {auth_result}")
        
        if not auth_result:
            print("[DEBUG] Authentication test failed")
            return Response(content="Invalid YouTube Music headers", status_code=401)
    except Exception as e:
        print(f"[DEBUG] Error initializing YouTube Music service: {e}")
        import traceback
        traceback.print_exc()
        return Response(content="Failed to initialize YouTube Music service", status_code=500)

    print("[DEBUG] Setting session data")
    
    # Test with minimal data first - store headers in a file instead of session
    import tempfile
    import os
    
    # Create a temp file to store headers
    temp_dir = tempfile.gettempdir()
    headers_file = os.path.join(temp_dir, f"ytm_headers_{int(time.time())}.txt")
    
    with open(headers_file, 'w') as f:
        f.write(headers_raw)
    
    print(f"[DEBUG] Stored headers in temp file: {headers_file}")
    
    # Store only essential data in session
    request.session['youtube_music_headers_file'] = headers_file
    request.session['youtube_music_auth'] = {
        "authenticated": True,
        "expires_at": int(time.time()) + (24 * 60 * 60 * 7) # 1 week
    }
    
    # Explicitly save/commit the session
    print(f"[DEBUG] Session keys after setting: {list(request.session.keys())}")
    print(f"[DEBUG] YouTube auth data just set: {request.session.get('youtube_music_auth')}")
    print(f"[DEBUG] Headers file path stored: {request.session.get('youtube_music_headers_file')}")
    
    print("[DEBUG] Session data set, returning success")
    return {"success": True, "message": "YouTube Music authenticated successfully"}


# Check authentication status
@router.get('/status', response_model=AuthStatusResponse)
async def get_status(request: Request):
    now = int(time.time())
    
    print(f"[DEBUG] Checking auth status. Session keys: {list(request.session.keys())}")
    
    spotify_authed = 'spotify_token' in request.session and request.session['spotify_token'].get('expires_at', 0) > now
    apple_authed = 'apple_music_token' in request.session and request.session['apple_music_token'].get('expires_at', 0) > now
    
    # Debug YouTube Music auth check
    youtube_auth_data = request.session.get('youtube_music_auth')
    print(f"[DEBUG] YouTube auth data: {youtube_auth_data}")
    
    if youtube_auth_data:
        expires_at = youtube_auth_data.get('expires_at', 0)
        print(f"[DEBUG] YouTube expires_at: {expires_at}, now: {now}, valid: {expires_at > now}")
    
    youtube_authed = 'youtube_music_auth' in request.session and request.session['youtube_music_auth'].get('expires_at', 0) > now
    
    print(f"[DEBUG] Auth status - Spotify: {spotify_authed}, Apple: {apple_authed}, YouTube: {youtube_authed}")
    
    user_info = UserInfo(
        spotify=request.session.get('spotify_user')
    )
    
    status = AuthStatus(
        spotify=spotify_authed,
        appleMusic=apple_authed,
        youtubeMusic=youtube_authed
    )
    
    return AuthStatusResponse(status=status, userInfo=user_info)


# Logout endpoints
@router.post('/logout/{platform}')
async def logout(request: Request, platform: str):
    session_keys = {
        'spotify': ['spotify_token', 'spotify_user'],
        'apple-music': ['apple_music_token'],
        'youtube-music': ['youtube_music_headers_file', 'youtube_music_auth']
    }
    
    if platform in session_keys:
        for key in session_keys[platform]:
            if key in request.session:
                del request.session[key]
                
    return {"success": True, "message": f"Logged out from {platform}"} 