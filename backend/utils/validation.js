const validator = require('validator');

const validatePlatform = (platform) => {
  const validPlatforms = ['spotify', 'apple-music', 'youtube-music'];
  return validPlatforms.includes(platform);
};

const validatePlaylistId = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Basic validation - not empty and reasonable length
  return id.trim().length > 0 && id.length < 100;
};

const validatePlaylistName = (name) => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  // Playlist name should be 1-100 characters
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
};

const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  // Remove potentially harmful characters and trim
  return validator.escape(str.trim());
};

const validateTransferRequest = (req) => {
  const { sourcePlatform, destinationPlatform, sourcePlaylistId, playlistName } = req.body;
  
  const errors = [];
  
  if (!validatePlatform(sourcePlatform)) {
    errors.push('Invalid source platform');
  }
  
  if (!validatePlatform(destinationPlatform)) {
    errors.push('Invalid destination platform');
  }
  
  if (sourcePlatform === destinationPlatform) {
    errors.push('Source and destination platforms cannot be the same');
  }
  
  if (!validatePlaylistId(sourcePlaylistId)) {
    errors.push('Invalid source playlist ID');
  }
  
  if (!validatePlaylistName(playlistName)) {
    errors.push('Invalid playlist name');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validatePlatform,
  validatePlaylistId,
  validatePlaylistName,
  sanitizeString,
  validateTransferRequest
};