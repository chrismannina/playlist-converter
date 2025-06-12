const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');

const router = express.Router();

// Spotify OAuth endpoints
router.get('/spotify', (req, res) => {
  const state = uuidv4();
  req.session.spotifyState = state;
  
  const scope = 'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private';
  
  const authURL = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      state: state
    });
  
  res.redirect(authURL);
});

router.get('/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=spotify_auth_denied`);
  }
  
  if (!state || state !== req.session.spotifyState) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`);
  }
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
  }
  
  try {
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', 
      querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Store tokens securely in session
    req.session.spotifyTokens = {
      access_token,
      refresh_token,
      expires_at: Date.now() + (expires_in * 1000)
    };
    
    // Get user profile
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    req.session.spotifyUser = {
      id: userResponse.data.id,
      display_name: userResponse.data.display_name,
      email: userResponse.data.email
    };
    
    res.redirect(`${process.env.FRONTEND_URL}?platform=spotify&status=success`);
    
  } catch (error) {
    console.error('Spotify auth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=spotify_token_error`);
  }
});

// Apple Music authentication (simplified - requires MusicKit JS on frontend)
router.post('/apple-music', async (req, res) => {
  try {
    const { userToken } = req.body;
    
    if (!userToken || !validator.isJWT(userToken)) {
      return res.status(400).json({ error: 'Invalid user token' });
    }
    
    // Store Apple Music user token
    req.session.appleMusicTokens = {
      userToken: userToken,
      expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    res.json({ success: true, message: 'Apple Music authenticated successfully' });
    
  } catch (error) {
    console.error('Apple Music auth error:', error);
    res.status(500).json({ error: 'Apple Music authentication failed' });
  }
});

// YouTube Music authentication (using ytmusic-api)
router.post('/youtube-music', async (req, res) => {
  try {
    const { headers } = req.body;
    
    if (!headers || typeof headers !== 'object') {
      return res.status(400).json({ error: 'Invalid headers provided' });
    }
    
    // Validate that required headers are present
    const requiredHeaders = ['cookie', 'x-goog-authuser'];
    const hasRequiredHeaders = requiredHeaders.some(header => 
      headers[header] || headers[header.toLowerCase()]
    );
    
    if (!hasRequiredHeaders) {
      return res.status(400).json({ 
        error: 'Required headers missing. Please provide authentication headers from YouTube Music.' 
      });
    }
    
    // Store YouTube Music headers for API calls
    req.session.youtubeMusicHeaders = headers;
    req.session.youtubeMusicAuth = {
      authenticated: true,
      expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    res.json({ success: true, message: 'YouTube Music authenticated successfully' });
    
  } catch (error) {
    console.error('YouTube Music auth error:', error);
    res.status(500).json({ error: 'YouTube Music authentication failed' });
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  const status = {
    spotify: !!(req.session.spotifyTokens && req.session.spotifyTokens.expires_at > Date.now()),
    appleMusic: !!(req.session.appleMusicTokens && req.session.appleMusicTokens.expires_at > Date.now()),
    youtubeMusic: !!(req.session.youtubeMusicAuth && req.session.youtubeMusicAuth.expires_at > Date.now())
  };
  
  const userInfo = {};
  if (status.spotify && req.session.spotifyUser) {
    userInfo.spotify = req.session.spotifyUser;
  }
  
  res.json({ status, userInfo });
});

// Logout endpoints
router.post('/logout/:platform', (req, res) => {
  const { platform } = req.params;
  
  switch (platform) {
    case 'spotify':
      delete req.session.spotifyTokens;
      delete req.session.spotifyUser;
      break;
    case 'apple-music':
      delete req.session.appleMusicTokens;
      break;
    case 'youtube-music':
      delete req.session.youtubeMusicHeaders;
      delete req.session.youtubeMusicAuth;
      break;
    default:
      return res.status(400).json({ error: 'Invalid platform' });
  }
  
  res.json({ success: true, message: `Logged out from ${platform}` });
});

module.exports = router;