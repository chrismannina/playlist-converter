const axios = require('axios');

class SpotifyService {
  constructor(tokens) {
    this.tokens = tokens;
    this.baseURL = 'https://api.spotify.com/v1';
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Spotify authentication expired');
      }
      throw error;
    }
  }

  async getUserPlaylists() {
    const playlists = [];
    let url = '/me/playlists?limit=50';

    while (url) {
      const response = await this.makeRequest(url);
      playlists.push(...response.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        trackCount: playlist.tracks.total,
        public: playlist.public,
        owner: playlist.owner.display_name,
        images: playlist.images,
        platform: 'spotify'
      })));

      url = response.next ? response.next.replace(this.baseURL, '') : null;
    }

    return playlists;
  }

  async getPlaylistTracks(playlistId) {
    const tracks = [];
    let url = `/playlists/${playlistId}/tracks?limit=50&fields=items(track(id,name,artists,album,external_ids,duration_ms,preview_url)),next`;

    while (url) {
      const response = await this.makeRequest(url);
      
      const validTracks = response.items
        .filter(item => item.track && item.track.id) // Filter out null tracks
        .map(item => ({
          id: item.track.id,
          name: item.track.name,
          artists: item.track.artists.map(artist => artist.name),
          album: item.track.album.name,
          duration: item.track.duration_ms,
          isrc: item.track.external_ids?.isrc,
          previewUrl: item.track.preview_url,
          platform: 'spotify',
          originalData: item.track
        }));

      tracks.push(...validTracks);
      url = response.next ? response.next.replace(this.baseURL, '') : null;
    }

    return tracks;
  }

  async searchTrack(query, isrc = null) {
    try {
      let searchQuery;
      
      if (isrc) {
        // Search by ISRC first (most accurate)
        searchQuery = `isrc:${isrc}`;
      } else {
        // Fallback to text search
        searchQuery = query;
      }

      const response = await this.makeRequest(`/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`);
      
      if (response.tracks.items.length > 0) {
        return response.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artists: track.artists.map(artist => artist.name),
          album: track.album.name,
          duration: track.duration_ms,
          isrc: track.external_ids?.isrc,
          platform: 'spotify',
          confidence: isrc ? 1.0 : this.calculateConfidence(query, track)
        }));
      }

      return [];
    } catch (error) {
      console.error('Spotify search error:', error);
      return [];
    }
  }

  calculateConfidence(query, track) {
    // Simple confidence calculation based on string similarity
    const queryLower = query.toLowerCase();
    const trackString = `${track.name} ${track.artists.map(a => a.name).join(' ')} ${track.album.name}`.toLowerCase();
    
    const words = queryLower.split(' ');
    const matches = words.filter(word => trackString.includes(word)).length;
    
    return matches / words.length;
  }

  async createPlaylist(name, description = '', isPublic = false) {
    try {
      const userResponse = await this.makeRequest('/me');
      const userId = userResponse.id;

      const playlistData = {
        name,
        description,
        public: isPublic
      };

      const playlist = await this.makeRequest(`/users/${userId}/playlists`, 'POST', playlistData);
      return playlist;
    } catch (error) {
      console.error('Error creating Spotify playlist:', error);
      throw error;
    }
  }

  async addTracksToPlaylist(playlistId, trackIds) {
    try {
      const uris = trackIds.map(id => `spotify:track:${id}`);
      
      // Spotify allows max 100 tracks per request
      const chunks = [];
      for (let i = 0; i < uris.length; i += 100) {
        chunks.push(uris.slice(i, i + 100));
      }

      const results = [];
      for (const chunk of chunks) {
        const response = await this.makeRequest(`/playlists/${playlistId}/tracks`, 'POST', {
          uris: chunk
        });
        results.push(response);
      }

      return results;
    } catch (error) {
      console.error('Error adding tracks to Spotify playlist:', error);
      throw error;
    }
  }
}

module.exports = SpotifyService;