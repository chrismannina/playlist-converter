const express = require('express');
const SpotifyService = require('../services/SpotifyService');
const AppleMusicService = require('../services/AppleMusicService');
const YouTubeMusicService = require('../services/YouTubeMusicService');

const router = express.Router();

// Middleware to check authentication
const requireAuth = (platform) => {
  return (req, res, next) => {
    let isAuthenticated = false;
    
    switch (platform) {
      case 'spotify':
        isAuthenticated = !!(req.session.spotifyTokens && req.session.spotifyTokens.expires_at > Date.now());
        break;
      case 'apple-music':
        isAuthenticated = !!(req.session.appleMusicTokens && req.session.appleMusicTokens.expires_at > Date.now());
        break;
      case 'youtube-music':
        isAuthenticated = !!(req.session.youtubeMusicAuth && req.session.youtubeMusicAuth.expires_at > Date.now());
        break;
    }
    
    if (!isAuthenticated) {
      return res.status(401).json({ error: `Not authenticated with ${platform}` });
    }
    
    next();
  };
};

// Get playlists from Spotify
router.get('/spotify', requireAuth('spotify'), async (req, res) => {
  try {
    const spotifyService = new SpotifyService(req.session.spotifyTokens);
    const playlists = await spotifyService.getUserPlaylists();
    res.json(playlists);
  } catch (error) {
    console.error('Error fetching Spotify playlists:', error);
    res.status(500).json({ error: 'Failed to fetch Spotify playlists' });
  }
});

// Get specific playlist tracks from Spotify
router.get('/spotify/:playlistId', requireAuth('spotify'), async (req, res) => {
  try {
    const { playlistId } = req.params;
    const spotifyService = new SpotifyService(req.session.spotifyTokens);
    const tracks = await spotifyService.getPlaylistTracks(playlistId);
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching Spotify playlist tracks:', error);
    res.status(500).json({ error: 'Failed to fetch playlist tracks' });
  }
});

// Get playlists from Apple Music
router.get('/apple-music', requireAuth('apple-music'), async (req, res) => {
  try {
    const appleMusicService = new AppleMusicService(req.session.appleMusicTokens);
    const playlists = await appleMusicService.getUserPlaylists();
    res.json(playlists);
  } catch (error) {
    console.error('Error fetching Apple Music playlists:', error);
    res.status(500).json({ error: 'Failed to fetch Apple Music playlists' });
  }
});

// Get specific playlist tracks from Apple Music
router.get('/apple-music/:playlistId', requireAuth('apple-music'), async (req, res) => {
  try {
    const { playlistId } = req.params;
    const appleMusicService = new AppleMusicService(req.session.appleMusicTokens);
    const tracks = await appleMusicService.getPlaylistTracks(playlistId);
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching Apple Music playlist tracks:', error);
    res.status(500).json({ error: 'Failed to fetch playlist tracks' });
  }
});

// Get playlists from YouTube Music
router.get('/youtube-music', requireAuth('youtube-music'), async (req, res) => {
  try {
    const youtubeMusicService = new YouTubeMusicService(req.session.youtubeMusicHeaders);
    const playlists = await youtubeMusicService.getUserPlaylists();
    res.json(playlists);
  } catch (error) {
    console.error('Error fetching YouTube Music playlists:', error);
    res.status(500).json({ error: 'Failed to fetch YouTube Music playlists' });
  }
});

// Get specific playlist tracks from YouTube Music
router.get('/youtube-music/:playlistId', requireAuth('youtube-music'), async (req, res) => {
  try {
    const { playlistId } = req.params;
    const youtubeMusicService = new YouTubeMusicService(req.session.youtubeMusicHeaders);
    const tracks = await youtubeMusicService.getPlaylistTracks(playlistId);
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching YouTube Music playlist tracks:', error);
    res.status(500).json({ error: 'Failed to fetch playlist tracks' });
  }
});

module.exports = router;