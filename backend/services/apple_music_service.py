import os
import httpx
from typing import List, Dict, Any

# In a full implementation, you might generate a developer token automatically.
# For now, we assume it's set as an environment variable.
# See: https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens
DEVELOPER_TOKEN = os.environ.get("APPLE_DEVELOPER_TOKEN", "")
API_BASE_URL = "https://api.music.apple.com/v1"

class AppleMusicService:
    def __init__(self, user_token: str):
        if not user_token:
            raise ValueError("An Apple Music user token is required.")
        if not DEVELOPER_TOKEN:
            raise ValueError("Apple Music Developer Token is not configured.")

        self.user_token = user_token
        self.headers = {
            "Authorization": f"Bearer {DEVELOPER_TOKEN}",
            "Music-User-Token": self.user_token,
        }

    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.request(method, f"{API_BASE_URL}{endpoint}", headers=self.headers, **kwargs)
            response.raise_for_status()
            return response.json()

    async def get_user_playlists(self) -> List[Dict[str, Any]]:
        """
        Fetches all of the user's playlists.
        """
        playlists = []
        endpoint = "/me/library/playlists"
        
        while endpoint:
            data = await self._request("GET", endpoint)
            playlists.extend(data.get("data", []))
            endpoint = data.get("next")
            
        return playlists

    async def get_playlist_tracks(self, playlist_id: str) -> List[Dict[str, Any]]:
        """
        Fetches all tracks for a given library playlist ID.
        """
        tracks = []
        # Note: The 'v1/me/library/playlists/{id}/tracks' endpoint might not exist in this exact form.
        # You often have to fetch the playlist first, then get the tracks relationship.
        # This is a simplified representation. The actual implementation might be more complex.
        endpoint = f"/me/library/playlists/{playlist_id}/tracks"
        
        while endpoint:
            data = await self._request("GET", endpoint)
            tracks.extend(data.get("data", []))
            endpoint = data.get("next")
            
        return tracks 