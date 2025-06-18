# Universal Music Playlist Converter

A web-based application that allows users to seamlessly transfer their music playlists from one streaming service to another. Currently supports Spotify, Apple Music, and YouTube Music.

## Features

- **Multi-Platform Support**: Transfer playlists between Spotify, Apple Music, and YouTube Music
- **Secure Authentication**: OAuth 2.0 flows for all supported platforms
- **Intelligent Track Matching**: Uses ISRC codes and fuzzy search for accurate song matching
- **Real-time Progress**: Live updates during playlist transfer
- **Detailed Reporting**: Summary of successful transfers and unmatched tracks

## Architecture

- **Frontend**: React application with modern UI/UX
- **Backend**: Node.js/Express server handling all API integrations
- **Security**: Server-side token management, no client-side credential exposure

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- API credentials for supported music services

### API Keys Required

1. **Spotify**:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Note your Client ID and Client Secret

2. **Apple Music**:
   - Go to [Apple Developer Portal](https://developer.apple.com/)
   - Create a MusicKit identifier
   - Generate a private key and note your Team ID and Key ID

3. **YouTube Music**:
   - Uses unofficial API (ytmusicapi) - no additional setup required

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd universal-music-playlist-converter
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Configure environment variables:
```bash
cd ../backend
cp .env.example .env
# Edit .env with your API credentials
```

5. Start the development servers:

Backend:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (in a new terminal):
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=12001
NODE_ENV=development
FRONTEND_URL=https://work-1-fkgngfnzdhpkfrwq.prod-runtime.all-hands.dev

# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://work-2-fkgngfnzdhpkfrwq.prod-runtime.all-hands.dev/auth/spotify/callback

# Apple Music API
APPLE_MUSIC_TEAM_ID=your_team_id
APPLE_MUSIC_KEY_ID=your_key_id
APPLE_MUSIC_PRIVATE_KEY=your_private_key

# Session Secret
SESSION_SECRET=your_random_session_secret
```

## Usage

1. **Select Source Platform**: Choose the platform you want to transfer from
2. **Authenticate & Select Playlist**: Log in and select a playlist to transfer
3. **Select Destination Platform**: Choose where you want to transfer the playlist
4. **Confirm and Start Transfer**: Review and start the transfer process
5. **View Results**: See the transfer summary and any unmatched tracks

## Technical Details

### Track Matching Algorithm

1. **Primary Method**: ISRC (International Standard Recording Code) matching
2. **Fallback Method**: Fuzzy search using track title, artist, and album metadata
3. **Error Handling**: Comprehensive logging of unmatched tracks

### Security Features

- Server-side OAuth token management
- Environment variable configuration for sensitive data
- CORS protection
- Input validation and sanitization
- Rate limiting for API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This application uses unofficial APIs for YouTube Music. While we strive for reliability, these integrations may be subject to changes or limitations imposed by the service providers.