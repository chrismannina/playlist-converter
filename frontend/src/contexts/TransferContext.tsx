import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { TransferStatus, TransferRequest, Playlist, Track, Platform } from '../types';
import { transferAPI, playlistAPI } from '../services/api';

interface TransferContextType {
  // Transfer state
  currentTransfer: TransferStatus | null;
  transferHistory: TransferStatus[];
  loading: boolean;
  error: string | null;

  // Playlist data
  sourcePlaylists: Playlist[];
  sourcePlaylistTracks: Track[];
  selectedSourcePlaylist: Playlist | null;

  // Transfer actions
  startTransfer: (request: TransferRequest) => Promise<string>;
  cancelTransfer: (transferId: string) => Promise<void>;
  refreshTransferStatus: (transferId: string) => Promise<void>;
  loadTransferHistory: () => Promise<void>;

  // Playlist actions
  loadPlaylists: (platform: Platform) => Promise<void>;
  loadPlaylistTracks: (platform: Platform, playlistId: string) => Promise<void>;
  selectSourcePlaylist: (playlist: Playlist | null) => void;
  clearTransferData: () => void;
}

const TransferContext = createContext<TransferContextType | undefined>(undefined);

export const useTransfer = () => {
  const context = useContext(TransferContext);
  if (context === undefined) {
    throw new Error('useTransfer must be used within a TransferProvider');
  }
  return context;
};

interface TransferProviderProps {
  children: ReactNode;
}

export const TransferProvider: React.FC<TransferProviderProps> = ({ children }) => {
  const [currentTransfer, setCurrentTransfer] = useState<TransferStatus | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sourcePlaylists, setSourcePlaylists] = useState<Playlist[]>([]);
  const [sourcePlaylistTracks, setSourcePlaylistTracks] = useState<Track[]>([]);
  const [selectedSourcePlaylist, setSelectedSourcePlaylist] = useState<Playlist | null>(null);

  const startTransfer = useCallback(async (request: TransferRequest): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await transferAPI.startTransfer(request);
      const transferId = response.transferId;
      
      // Start polling for transfer status
      pollTransferStatus(transferId);
      
      return transferId;
    } catch (err: any) {
      console.error('Error starting transfer:', err);
      setError(err.response?.data?.error || 'Failed to start transfer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const pollTransferStatus = useCallback(async (transferId: string) => {
    const poll = async () => {
      try {
        const status = await transferAPI.getTransferStatus(transferId);
        setCurrentTransfer(status);
        
        // Continue polling if transfer is still in progress
        if (['starting', 'fetching_source', 'matching_tracks', 'creating_playlist', 'adding_tracks'].includes(status.status)) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (err) {
        console.error('Error polling transfer status:', err);
        setError('Failed to get transfer status');
      }
    };
    
    poll();
  }, []);

  const cancelTransfer = useCallback(async (transferId: string): Promise<void> => {
    try {
      setError(null);
      await transferAPI.cancelTransfer(transferId);
      await refreshTransferStatus(transferId);
    } catch (err: any) {
      console.error('Error cancelling transfer:', err);
      setError(err.response?.data?.error || 'Failed to cancel transfer');
      throw err;
    }
  }, []);

  const refreshTransferStatus = useCallback(async (transferId: string): Promise<void> => {
    try {
      setError(null);
      const status = await transferAPI.getTransferStatus(transferId);
      setCurrentTransfer(status);
    } catch (err: any) {
      console.error('Error refreshing transfer status:', err);
      setError(err.response?.data?.error || 'Failed to refresh transfer status');
      throw err;
    }
  }, []);

  const loadTransferHistory = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const history = await transferAPI.getTransferHistory();
      setTransferHistory(history);
    } catch (err: any) {
      console.error('Error loading transfer history:', err);
      setError(err.response?.data?.error || 'Failed to load transfer history');
      throw err;
    }
  }, []);

  const loadPlaylists = useCallback(async (platform: Platform): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 [FRONTEND] Loading playlists for platform: ${platform}`);
      const playlists = await playlistAPI.getPlaylists(platform);
      setSourcePlaylists(playlists);
      console.log(`✅ [FRONTEND] Loaded ${playlists.length} playlists for ${platform}`);
    } catch (err: any) {
      console.error('Error loading playlists:', err);
      setError(err.response?.data?.error || `Failed to load ${platform} playlists`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlaylistTracks = useCallback(async (platform: Platform, playlistId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const tracks = await playlistAPI.getPlaylistTracks(platform, playlistId);
      setSourcePlaylistTracks(tracks);
    } catch (err: any) {
      console.error('Error loading playlist tracks:', err);
      setError(err.response?.data?.error || 'Failed to load playlist tracks');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const selectSourcePlaylist = useCallback((playlist: Playlist | null) => {
    setSelectedSourcePlaylist(playlist);
  }, []);

  const clearTransferData = useCallback(() => {
    setCurrentTransfer(null);
    setSourcePlaylists([]);
    setSourcePlaylistTracks([]);
    setSelectedSourcePlaylist(null);
    setError(null);
  }, []);

  const value: TransferContextType = {
    currentTransfer,
    transferHistory,
    loading,
    error,
    sourcePlaylists,
    sourcePlaylistTracks,
    selectedSourcePlaylist,
    startTransfer,
    cancelTransfer,
    refreshTransferStatus,
    loadTransferHistory,
    loadPlaylists,
    loadPlaylistTracks,
    selectSourcePlaylist,
    clearTransferData,
  };

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>;
};