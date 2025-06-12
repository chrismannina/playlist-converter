import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthStatus, UserInfo, Platform } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  authStatus: AuthStatus;
  userInfo: UserInfo;
  loading: boolean;
  error: string | null;
  loginSpotify: () => void;
  loginAppleMusic: (userToken: string) => Promise<void>;
  loginYouTubeMusic: (headers: any) => Promise<void>;
  logout: (platform: Platform) => Promise<void>;
  refreshAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    spotify: false,
    appleMusic: false,
    youtubeMusic: false,
  });
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.getStatus();
      setAuthStatus(response.status);
      setUserInfo(response.userInfo);
    } catch (err) {
      console.error('Error fetching auth status:', err);
      setError('Failed to fetch authentication status');
    } finally {
      setLoading(false);
    }
  };

  const loginSpotify = () => {
    authAPI.loginSpotify();
  };

  const loginAppleMusic = async (userToken: string) => {
    try {
      setError(null);
      await authAPI.loginAppleMusic(userToken);
      await refreshAuthStatus();
    } catch (err) {
      console.error('Apple Music login error:', err);
      setError('Failed to authenticate with Apple Music');
      throw err;
    }
  };

  const loginYouTubeMusic = async (headers: any) => {
    try {
      setError(null);
      await authAPI.loginYouTubeMusic(headers);
      await refreshAuthStatus();
    } catch (err) {
      console.error('YouTube Music login error:', err);
      setError('Failed to authenticate with YouTube Music');
      throw err;
    }
  };

  const logout = async (platform: Platform) => {
    try {
      setError(null);
      await authAPI.logout(platform);
      await refreshAuthStatus();
    } catch (err) {
      console.error('Logout error:', err);
      setError(`Failed to logout from ${platform}`);
      throw err;
    }
  };

  useEffect(() => {
    refreshAuthStatus();

    // Check for authentication callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const platform = urlParams.get('platform');
    const status = urlParams.get('status');
    const error = urlParams.get('error');

    if (platform === 'spotify' && status === 'success') {
      // Spotify authentication successful
      refreshAuthStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      setError(`Authentication error: ${error}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const value: AuthContextType = {
    authStatus,
    userInfo,
    loading,
    error,
    loginSpotify,
    loginAppleMusic,
    loginYouTubeMusic,
    logout,
    refreshAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};