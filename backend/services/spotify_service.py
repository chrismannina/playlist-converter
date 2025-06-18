import os
import asyncio
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from models.auth import SpotifyToken, SpotifyUser

class SpotifyService:
    def __init__(self, auth_token: dict = None):
        self.scope = "playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private"
        
        # TEMPORARY FIX: Hardcoding the correct redirect URI to bypass environment issues.
        redirect_uri = "http://localhost:8000/auth/spotify/callback"

        self.sp_oauth = SpotifyOAuth(
            client_id=os.environ["SPOTIFY_CLIENT_ID"],
            client_secret=os.environ["SPOTIFY_CLIENT_SECRET"],
            redirect_uri=redirect_uri,
            scope=self.scope,
        )

        if auth_token:
            self.client = spotipy.Spotify(auth=auth_token['access_token'])
        else:
            self.client = None

    def get_authorize_url(self, state: str) -> str:
        return self.sp_oauth.get_authorize_url(state=state)

    async def get_access_token(self, code: str) -> dict:
        # Run the synchronous spotipy call in a thread to avoid blocking
        token_info = await asyncio.to_thread(
            self.sp_oauth.get_access_token, code, check_cache=False
        )
        return token_info

    async def get_current_user(self) -> SpotifyUser:
        if not self.client:
            raise Exception("Spotify client not initialized.")
        # Run the synchronous spotipy call in a thread to avoid blocking
        user_data = await asyncio.to_thread(self.client.current_user)
        return SpotifyUser(**user_data)

    async def get_user_playlists(self):
        if not self.client:
            raise Exception("Spotify client not initialized.")
        
        # Run the synchronous spotipy call in a thread to avoid blocking
        results = await asyncio.to_thread(self.client.current_user_playlists)
        
        playlists = []
        while results:
            playlists.extend(results['items'])
            if results['next']:
                # The 'next' method also makes a network request
                results = await asyncio.to_thread(self.client.next, results)
            else:
                results = None
        
        # Here we would map the raw data to a Pydantic model for consistency
        return playlists

    async def get_playlist_tracks(self, playlist_id: str):
        if not self.client:
            raise Exception("Spotify client not initialized.")
        
        # Run the synchronous spotipy call in a thread to avoid blocking
        results = await asyncio.to_thread(self.client.playlist_tracks, playlist_id)

        tracks = []
        while results:
            tracks.extend(results['items'])
            if results['next']:
                # The 'next' method also makes a network request
                results = await asyncio.to_thread(self.client.next, results)
            else:
                results = None
        
        # Here we would map the raw data to a Pydantic model for consistency
        return tracks 