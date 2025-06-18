from ytmusicapi import YTMusic
import ytmusicapi
import tempfile
import os

class YouTubeMusicService:
    def __init__(self, headers_raw: str = None, auth_file: str = None):
        if auth_file and os.path.exists(auth_file):
            # Use existing auth file
            self.client = YTMusic(auth_file)
        elif headers_raw:
            # Convert raw headers to browser auth format using ytmusicapi setup
            try:
                # Create a temporary auth file using ytmusicapi setup
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
                    temp_path = temp_file.name
                
                # Use ytmusicapi setup to create proper auth file
                auth_config = ytmusicapi.setup(filepath=temp_path, headers_raw=headers_raw)
                
                # Initialize client with the generated auth file
                self.client = YTMusic(temp_path)
                
                # Clean up temp file
                os.unlink(temp_path)
                
            except Exception as e:
                print(f"Error setting up YouTube Music authentication: {e}")
                self.client = None
        else:
            self.client = None

    def test_authentication(self):
        """
        A simple way to test if the provided headers are valid
        by making a light request.
        """
        if not self.client:
            return False
        try:
            self.client.get_library_playlists(limit=1)
            return True
        except Exception as e:
            print(f"YouTube Music auth test failed: {e}")
            return False

    async def get_user_playlists(self):
        if not self.client:
            raise Exception("YouTube Music client not initialized.")
        
        # This is a synchronous library, so we call it directly.
        # If this becomes a performance bottleneck, we can run it
        # in a thread pool executor.
        playlists = self.client.get_library_playlists()
        
        # Here we would map the raw data to a Pydantic model for consistency
        return playlists

    async def get_playlist_tracks(self, playlist_id: str):
        if not self.client:
            raise Exception("YouTube Music client not initialized.")
            
        playlist = self.client.get_playlist(playlist_id)
        
        # Here we would map the raw data to a Pydantic model for consistency
        return playlist['tracks'] 