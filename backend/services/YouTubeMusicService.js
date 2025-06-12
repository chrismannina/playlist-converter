const { YTMusic } = require('ytmusic-api');

class YouTubeMusicService {
  constructor(headers) {
    this.headers = headers;
    this.ytmusic = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      this.ytmusic = new YTMusic();
      await this.ytmusic.initialize({
        headers: this.headers
      });
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing YouTube Music API:', error);
      throw new Error('Failed to initialize YouTube Music API');
    }
  }

  async getUserPlaylists() {
    try {
      await this.initialize();
      
      const playlists = await this.ytmusic.getLibraryPlaylists();
      
      return playlists.map(playlist => ({
        id: playlist.playlistId,
        name: playlist.title,
        description: playlist.description || '',
        trackCount: playlist.trackCount || 0,
        public: false, // YouTube Music library playlists are typically private
        owner: 'Me',
        images: playlist.thumbnails || [],
        platform: 'youtube-music'
      }));
    } catch (error) {
      console.error('Error fetching YouTube Music playlists:', error);
      throw error;
    }
  }

  async getPlaylistTracks(playlistId) {
    try {
      await this.initialize();
      
      const playlist = await this.ytmusic.getPlaylist(playlistId);
      
      if (!playlist.tracks) {
        return [];
      }

      return playlist.tracks
        .filter(track => track.videoId && track.title)
        .map(track => ({
          id: track.videoId,
          name: track.title,
          artists: track.artists ? track.artists.map(artist => artist.name) : ['Unknown Artist'],
          album: track.album?.name || 'Unknown Album',
          duration: track.duration ? this.parseDuration(track.duration) : null,
          isrc: null, // YouTube Music doesn't provide ISRC in API
          platform: 'youtube-music',
          originalData: track
        }));
    } catch (error) {
      console.error('Error fetching YouTube Music playlist tracks:', error);
      throw error;
    }
  }

  parseDuration(durationString) {
    // Convert duration string (e.g., "3:45") to milliseconds
    if (!durationString) return null;
    
    const parts = durationString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      return (minutes * 60 + seconds) * 1000;
    }
    return null;
  }

  async searchTrack(query, isrc = null) {
    try {
      await this.initialize();
      
      // YouTube Music doesn't support ISRC search, so we always use text search
      const results = await this.ytmusic.searchSongs(query);
      
      if (results.length > 0) {
        return results.slice(0, 10).map(track => ({
          id: track.videoId,
          name: track.title,
          artists: track.artists ? track.artists.map(artist => artist.name) : ['Unknown Artist'],
          album: track.album?.name || 'Unknown Album',
          duration: track.duration ? this.parseDuration(track.duration) : null,
          isrc: null,
          platform: 'youtube-music',
          confidence: this.calculateConfidence(query, track)
        }));
      }

      return [];
    } catch (error) {
      console.error('YouTube Music search error:', error);
      return [];
    }
  }

  calculateConfidence(query, track) {
    const queryLower = query.toLowerCase();
    const artistNames = track.artists ? track.artists.map(a => a.name).join(' ') : '';
    const albumName = track.album?.name || '';
    const trackString = `${track.title} ${artistNames} ${albumName}`.toLowerCase();
    
    const words = queryLower.split(' ');
    const matches = words.filter(word => trackString.includes(word)).length;
    
    return matches / words.length;
  }

  async createPlaylist(name, description = '') {
    try {
      await this.initialize();
      
      const playlist = await this.ytmusic.createPlaylist(name, description);
      return playlist;
    } catch (error) {
      console.error('Error creating YouTube Music playlist:', error);
      throw error;
    }
  }

  async addTracksToPlaylist(playlistId, trackIds) {
    try {
      await this.initialize();
      
      // YouTube Music API expects video IDs
      const results = [];
      
      // Add tracks in batches to avoid overwhelming the API
      const batchSize = 50;
      for (let i = 0; i < trackIds.length; i += batchSize) {
        const batch = trackIds.slice(i, i + batchSize);
        
        try {
          const response = await this.ytmusic.addPlaylistItems(playlistId, batch);
          results.push(response);
        } catch (error) {
          console.error(`Error adding batch ${i / batchSize + 1} to YouTube Music playlist:`, error);
          // Continue with next batch even if one fails
        }
      }

      return results;
    } catch (error) {
      console.error('Error adding tracks to YouTube Music playlist:', error);
      throw error;
    }
  }
}

module.exports = YouTubeMusicService;