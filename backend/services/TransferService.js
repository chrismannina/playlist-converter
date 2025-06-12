const { v4: uuidv4 } = require('uuid');
const Fuse = require('fuse.js');
const SpotifyService = require('./SpotifyService');
const AppleMusicService = require('./AppleMusicService');
const YouTubeMusicService = require('./YouTubeMusicService');

class TransferService {
  constructor(tokens) {
    this.tokens = tokens;
    this.services = {};
    this.transfers = {};
  }

  getService(platform) {
    if (!this.services[platform]) {
      switch (platform) {
        case 'spotify':
          this.services[platform] = new SpotifyService(this.tokens.spotify);
          break;
        case 'apple-music':
          this.services[platform] = new AppleMusicService(this.tokens.appleMusic);
          break;
        case 'youtube-music':
          this.services[platform] = new YouTubeMusicService(this.tokens.youtubeMusic);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    }
    return this.services[platform];
  }

  async startTransfer({ sourcePlatform, destinationPlatform, sourcePlaylistId, playlistName, playlistDescription }) {
    const transferId = uuidv4();
    
    // Initialize transfer state
    const transfer = {
      id: transferId,
      sourcePlatform,
      destinationPlatform,
      sourcePlaylistId,
      playlistName,
      playlistDescription,
      status: 'starting',
      progress: 0,
      totalTracks: 0,
      processedTracks: 0,
      successfulMatches: 0,
      failedMatches: [],
      startTime: new Date().toISOString(),
      endTime: null
    };

    this.transfers[transferId] = transfer;

    // Start the transfer process asynchronously
    this.processTransfer(transferId).catch(error => {
      console.error(`Transfer ${transferId} failed:`, error);
      this.transfers[transferId].status = 'failed';
      this.transfers[transferId].error = error.message;
      this.transfers[transferId].endTime = new Date().toISOString();
    });

    return transferId;
  }

  async processTransfer(transferId) {
    const transfer = this.transfers[transferId];
    
    try {
      // Step 1: Fetch source playlist tracks
      transfer.status = 'fetching_source';
      const sourceService = this.getService(transfer.sourcePlatform);
      const sourceTracks = await sourceService.getPlaylistTracks(transfer.sourcePlaylistId);
      
      transfer.totalTracks = sourceTracks.length;
      transfer.status = 'matching_tracks';

      // Step 2: Match tracks on destination platform
      const destinationService = this.getService(transfer.destinationPlatform);
      const matchedTracks = [];
      const failedMatches = [];

      for (let i = 0; i < sourceTracks.length; i++) {
        const sourceTrack = sourceTracks[i];
        transfer.processedTracks = i + 1;
        transfer.progress = Math.round((transfer.processedTracks / transfer.totalTracks) * 100);

        try {
          const match = await this.findBestMatch(sourceTrack, destinationService);
          if (match) {
            matchedTracks.push({
              sourceTrack,
              matchedTrack: match,
              confidence: match.confidence
            });
          } else {
            failedMatches.push({
              track: sourceTrack,
              reason: 'No suitable match found'
            });
          }
        } catch (error) {
          console.error(`Error matching track ${sourceTrack.name}:`, error);
          failedMatches.push({
            track: sourceTrack,
            reason: error.message
          });
        }

        // Add small delay to respect rate limits
        await this.delay(100);
      }

      transfer.successfulMatches = matchedTracks.length;
      transfer.failedMatches = failedMatches;

      // Step 3: Create destination playlist
      transfer.status = 'creating_playlist';
      const newPlaylist = await destinationService.createPlaylist(
        transfer.playlistName,
        transfer.playlistDescription
      );

      transfer.destinationPlaylistId = newPlaylist.id;

      // Step 4: Add matched tracks to destination playlist
      if (matchedTracks.length > 0) {
        transfer.status = 'adding_tracks';
        const trackIds = matchedTracks.map(match => match.matchedTrack.id);
        await destinationService.addTracksToPlaylist(newPlaylist.id, trackIds);
      }

      // Complete transfer
      transfer.status = 'completed';
      transfer.endTime = new Date().toISOString();
      transfer.progress = 100;

    } catch (error) {
      throw error;
    }
  }

  async findBestMatch(sourceTrack, destinationService) {
    // Strategy 1: Try ISRC match first (most accurate)
    if (sourceTrack.isrc) {
      const isrcMatches = await destinationService.searchTrack(null, sourceTrack.isrc);
      if (isrcMatches.length > 0) {
        return isrcMatches[0]; // ISRC match is always the best
      }
    }

    // Strategy 2: Fuzzy text search
    const searchQuery = this.buildSearchQuery(sourceTrack);
    const textMatches = await destinationService.searchTrack(searchQuery);

    if (textMatches.length === 0) {
      return null;
    }

    // Strategy 3: Use fuzzy matching to find the best result
    const bestMatch = this.selectBestMatch(sourceTrack, textMatches);
    
    // Only return matches with reasonable confidence
    return bestMatch && bestMatch.confidence >= 0.6 ? bestMatch : null;
  }

  buildSearchQuery(track) {
    // Build a search query from track metadata
    const parts = [];
    
    if (track.name) {
      parts.push(track.name);
    }
    
    if (track.artists && track.artists.length > 0) {
      parts.push(track.artists[0]); // Use primary artist
    }

    return parts.join(' ').trim();
  }

  selectBestMatch(sourceTrack, candidates) {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // Use Fuse.js for fuzzy matching
    const fuse = new Fuse(candidates, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'artists', weight: 0.4 },
        { name: 'album', weight: 0.2 }
      ],
      threshold: 0.6,
      includeScore: true
    });

    const searchString = `${sourceTrack.name} ${sourceTrack.artists.join(' ')} ${sourceTrack.album}`;
    const results = fuse.search(searchString);

    if (results.length > 0) {
      const bestResult = results[0];
      const match = bestResult.item;
      
      // Convert Fuse.js score (lower is better) to confidence (higher is better)
      match.confidence = Math.max(0, 1 - bestResult.score);
      
      // Additional scoring based on duration similarity
      if (sourceTrack.duration && match.duration) {
        const durationDiff = Math.abs(sourceTrack.duration - match.duration);
        const durationSimilarity = Math.max(0, 1 - (durationDiff / Math.max(sourceTrack.duration, match.duration)));
        match.confidence = (match.confidence * 0.8) + (durationSimilarity * 0.2);
      }

      return match;
    }

    // Fallback to the first candidate with calculated confidence
    return candidates[0];
  }

  getTransferStatus(transferId) {
    return this.transfers[transferId] || null;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TransferService;