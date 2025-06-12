import axios from 'axios';
import { Platform, Playlist, Track, AuthStatus, UserInfo, TransferRequest, TransferStatus } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://work-2-fkgngfnzdhpkfrwq.prod-runtime.all-hands.dev';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Get authentication status
  getStatus: async (): Promise<{ status: AuthStatus; userInfo: UserInfo }> => {
    const response = await api.get('/auth/status');
    return response.data as { status: AuthStatus; userInfo: UserInfo };
  },

  // Spotify authentication
  loginSpotify: () => {
    window.location.href = `${API_BASE_URL}/auth/spotify`;
  },

  // Apple Music authentication
  loginAppleMusic: async (userToken: string): Promise<void> => {
    await api.post('/auth/apple-music', { userToken });
  },

  // YouTube Music authentication
  loginYouTubeMusic: async (headers: any): Promise<void> => {
    await api.post('/auth/youtube-music', { headers });
  },

  // Logout
  logout: async (platform: Platform): Promise<void> => {
    await api.post(`/auth/logout/${platform}`);
  },
};

export const playlistAPI = {
  // Get playlists from a platform
  getPlaylists: async (platform: Platform): Promise<Playlist[]> => {
    const response = await api.get(`/api/playlists/${platform}`);
    return response.data as Playlist[];
  },

  // Get tracks from a specific playlist
  getPlaylistTracks: async (platform: Platform, playlistId: string): Promise<Track[]> => {
    const response = await api.get(`/api/playlists/${platform}/${playlistId}`);
    return response.data as Track[];
  },
};

export const transferAPI = {
  // Start a playlist transfer
  startTransfer: async (request: TransferRequest): Promise<{ transferId: string }> => {
    const response = await api.post('/api/transfer/start', request);
    return response.data as { transferId: string };
  },

  // Get transfer status
  getTransferStatus: async (transferId: string): Promise<TransferStatus> => {
    const response = await api.get(`/api/transfer/status/${transferId}`);
    return response.data as TransferStatus;
  },

  // Get transfer history
  getTransferHistory: async (): Promise<TransferStatus[]> => {
    const response = await api.get('/api/transfer/history');
    return response.data as TransferStatus[];
  },

  // Cancel transfer
  cancelTransfer: async (transferId: string): Promise<void> => {
    await api.post(`/api/transfer/cancel/${transferId}`);
  },
};

export const healthAPI = {
  // Health check
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get('/health');
    return response.data as { status: string; timestamp: string };
  },
};

export default api;