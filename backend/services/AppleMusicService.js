const axios = require('axios');
const jwt = require('jsonwebtoken');

class AppleMusicService {
  constructor(tokens) {
    this.userToken = tokens.userToken;
    this.baseURL = 'https://api.music.apple.com/v1';
    this.developerToken = this.generateDeveloperToken();
  }

  generateDeveloperToken() {
    // Generate JWT for Apple Music API
    const payload = {
      iss: process.env.APPLE_MUSIC_TEAM_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (6 * 30 * 24 * 60 * 60), // 6 months
      aud: 'appstoreconnect-v1'
    };

    const header = {
      alg: 'ES256',
      kid: process.env.APPLE_MUSIC_KEY_ID
    };

    try {
      return jwt.sign(payload, process.env.APPLE_MUSIC_PRIVATE_KEY, { 
        algorithm: 'ES256',
        header 
      });
    } catch (error) {
      console.error('Error generating Apple Music developer token:', error);
      throw new Error('Failed to generate Apple Music developer token');
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.developerToken}`,
          'Music-User-Token': this.userToken,
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
        throw new Error('Apple Music authentication expired');
      }
      throw error;
    }
  }

  async getUserPlaylists() {
    try {
      const response = await this.makeRequest('/me/library/playlists?limit=100');
      
      return response.data.map(playlist => ({
        id: playlist.id,
        name: playlist.attributes.name,
        description: playlist.attributes.description?.standard || '',
        trackCount: playlist.attributes.trackCount || 0,
        public: playlist.attributes.isPublic || false,
        owner: 'Me',
        images: playlist.attributes.artwork ? [playlist.attributes.artwork] : [],
        platform: 'apple-music'
      }));
    } catch (error) {
      console.error('Error fetching Apple Music playlists:', error);
      throw error;
    }
  }

  async getPlaylistTracks(playlistId) {
    try {
      const tracks = [];
      let url = `/me/library/playlists/${playlistId}/tracks?limit=100`;

      while (url) {
        const response = await this.makeRequest(url);
        
        const validTracks = response.data
          .filter(track => track.id && track.attributes)
          .map(track => ({
            id: track.id,
            name: track.attributes.name,
            artists: [track.attributes.artistName],
            album: track.attributes.albumName,
            duration: track.attributes.durationInMillis,
            isrc: track.attributes.isrc,
            platform: 'apple-music',
            originalData: track
          }));

        tracks.push(...validTracks);
        url = response.next ? response.next.replace(this.baseURL, '') : null;
      }

      return tracks;
    } catch (error) {
      console.error('Error fetching Apple Music playlist tracks:', error);
      throw error;
    }
  }

  async searchTrack(query, isrc = null) {
    try {
      let searchQuery;
      
      if (isrc) {
        // Search by ISRC
        searchQuery = `isrc:${isrc}`;
      } else {
        // Text search
        searchQuery = query;
      }

      const response = await this.makeRequest(`/catalog/us/search?term=${encodeURIComponent(searchQuery)}&types=songs&limit=10`);
      
      if (response.results.songs?.data?.length > 0) {
        return response.results.songs.data.map(track => ({
          id: track.id,
          name: track.attributes.name,
          artists: [track.attributes.artistName],
          album: track.attributes.albumName,
          duration: track.attributes.durationInMillis,
          isrc: track.attributes.isrc,
          platform: 'apple-music',
          confidence: isrc ? 1.0 : this.calculateConfidence(query, track)
        }));
      }

      return [];
    } catch (error) {
      console.error('Apple Music search error:', error);
      return [];
    }
  }

  calculateConfidence(query, track) {
    const queryLower = query.toLowerCase();
    const trackString = `${track.attributes.name} ${track.attributes.artistName} ${track.attributes.albumName}`.toLowerCase();
    
    const words = queryLower.split(' ');
    const matches = words.filter(word => trackString.includes(word)).length;
    
    return matches / words.length;
  }

  async createPlaylist(name, description = '') {
    try {
      const playlistData = {
        attributes: {
          name,
          description: description || `Created by Universal Music Playlist Converter`
        }
      };

      const response = await this.makeRequest('/me/library/playlists', 'POST', {
        data: [playlistData]
      });

      return response.data[0];
    } catch (error) {
      console.error('Error creating Apple Music playlist:', error);
      throw error;
    }
  }

  async addTracksToPlaylist(playlistId, trackIds) {
    try {
      // Apple Music requires track objects with type and id
      const tracks = trackIds.map(id => ({
        id,
        type: 'songs'
      }));

      const response = await this.makeRequest(`/me/library/playlists/${playlistId}/tracks`, 'POST', {
        data: tracks
      });

      return response;
    } catch (error) {
      console.error('Error adding tracks to Apple Music playlist:', error);
      throw error;
    }
  }
}

module.exports = AppleMusicService;