const express = require('express');
const TransferService = require('../services/TransferService');
const { validateTransferRequest, sanitizeString } = require('../utils/validation');

const router = express.Router();

// Middleware to check authentication for both source and destination platforms
const requireTransferAuth = (req, res, next) => {
  const { sourcePlatform, destinationPlatform } = req.body;
  
  if (!sourcePlatform || !destinationPlatform) {
    return res.status(400).json({ error: 'Source and destination platforms are required' });
  }
  
  const checkAuth = (platform) => {
    switch (platform) {
      case 'spotify':
        return !!(req.session.spotifyTokens && req.session.spotifyTokens.expires_at > Date.now());
      case 'apple-music':
        return !!(req.session.appleMusicTokens && req.session.appleMusicTokens.expires_at > Date.now());
      case 'youtube-music':
        return !!(req.session.youtubeMusicAuth && req.session.youtubeMusicAuth.expires_at > Date.now());
      default:
        return false;
    }
  };
  
  if (!checkAuth(sourcePlatform)) {
    return res.status(401).json({ error: `Not authenticated with source platform: ${sourcePlatform}` });
  }
  
  if (!checkAuth(destinationPlatform)) {
    return res.status(401).json({ error: `Not authenticated with destination platform: ${destinationPlatform}` });
  }
  
  next();
};

// Start playlist transfer
router.post('/start', requireTransferAuth, async (req, res) => {
  try {
    // Validate request
    const validation = validateTransferRequest(req);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validation.errors 
      });
    }

    const { 
      sourcePlatform, 
      destinationPlatform, 
      sourcePlaylistId, 
      playlistName,
      playlistDescription 
    } = req.body;
    
    // Sanitize inputs
    const sanitizedPlaylistName = sanitizeString(playlistName) || 'Transferred Playlist';
    const sanitizedDescription = sanitizeString(playlistDescription) || `Transferred from ${sourcePlatform}`;
    
    // Create transfer service with session tokens
    const transferService = new TransferService({
      spotify: req.session.spotifyTokens,
      appleMusic: req.session.appleMusicTokens,
      youtubeMusic: req.session.youtubeMusicHeaders
    });
    
    // Start the transfer process
    const transferId = await transferService.startTransfer({
      sourcePlatform,
      destinationPlatform,
      sourcePlaylistId,
      playlistName: sanitizedPlaylistName,
      playlistDescription: sanitizedDescription
    });

    // Store transfer service reference in session for status updates
    if (!req.session.transferServices) {
      req.session.transferServices = {};
    }
    req.session.transferServices[transferId] = transferService;
    
    res.json({ 
      success: true, 
      transferId,
      message: 'Transfer started successfully' 
    });
    
  } catch (error) {
    console.error('Error starting transfer:', error);
    res.status(500).json({ 
      error: 'Failed to start transfer',
      details: error.message 
    });
  }
});

// Get transfer status
router.get('/status/:transferId', (req, res) => {
  try {
    const { transferId } = req.params;
    
    if (!req.session.transferServices || !req.session.transferServices[transferId]) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    
    const transferService = req.session.transferServices[transferId];
    const transfer = transferService.getTransferStatus(transferId);
    
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    
    res.json(transfer);
    
  } catch (error) {
    console.error('Error getting transfer status:', error);
    res.status(500).json({ error: 'Failed to get transfer status' });
  }
});

// Get all transfers for the session
router.get('/history', (req, res) => {
  try {
    const transferServices = req.session.transferServices || {};
    const transferHistory = Object.keys(transferServices).map(id => {
      const transferService = transferServices[id];
      const transfer = transferService.getTransferStatus(id);
      return transfer ? { id, ...transfer } : null;
    }).filter(Boolean);
    
    res.json(transferHistory);
    
  } catch (error) {
    console.error('Error getting transfer history:', error);
    res.status(500).json({ error: 'Failed to get transfer history' });
  }
});

// Cancel transfer
router.post('/cancel/:transferId', (req, res) => {
  try {
    const { transferId } = req.params;
    
    if (!req.session.transferServices || !req.session.transferServices[transferId]) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    
    const transferService = req.session.transferServices[transferId];
    const transfer = transferService.getTransferStatus(transferId);
    
    if (transfer) {
      transfer.status = 'cancelled';
      transfer.endTime = new Date().toISOString();
    }
    
    res.json({ 
      success: true, 
      message: 'Transfer cancelled successfully' 
    });
    
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    res.status(500).json({ error: 'Failed to cancel transfer' });
  }
});

module.exports = router;