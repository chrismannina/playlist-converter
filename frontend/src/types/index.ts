export type Platform = 'spotify' | 'apple-music' | 'youtube-music';

export interface Track {
  id: string;
  name: string;
  artists: string[];
  album: string;
  duration?: number;
  isrc?: string;
  platform: Platform;
  originalData?: any;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  public: boolean;
  owner: string;
  images: any[];
  platform: Platform;
}

export interface AuthStatus {
  spotify: boolean;
  appleMusic: boolean;
  youtubeMusic: boolean;
}

export interface UserInfo {
  spotify?: {
    id: string;
    display_name: string;
    email: string;
  };
}

export interface TransferStatus {
  id: string;
  sourcePlatform: Platform;
  destinationPlatform: Platform;
  sourcePlaylistId: string;
  playlistName: string;
  playlistDescription: string;
  status: 'starting' | 'fetching_source' | 'matching_tracks' | 'creating_playlist' | 'adding_tracks' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalTracks: number;
  processedTracks: number;
  successfulMatches: number;
  failedMatches: FailedMatch[];
  startTime: string;
  endTime?: string;
  error?: string;
  destinationPlaylistId?: string;
}

export interface FailedMatch {
  track: Track;
  reason: string;
}

export interface MatchedTrack {
  sourceTrack: Track;
  matchedTrack: Track;
  confidence: number;
}

export interface TransferRequest {
  sourcePlatform: Platform;
  destinationPlatform: Platform;
  sourcePlaylistId: string;
  playlistName: string;
  playlistDescription?: string;
}