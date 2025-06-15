import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useTransfer } from '../contexts/TransferContext';
import { Platform, Playlist } from '../types';

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const StepContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
`;

const StepTitle = styled.h2`
  color: white;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
`;

const StepNumber = styled.span`
  background: #667eea;
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-weight: 600;
`;

const PlatformSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const PlatformOption = styled.button<{ $selected: boolean; $disabled: boolean }>`
  background: ${props => props.$selected ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.$selected ? '#667eea' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  padding: 1.5rem;
  color: white;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
`;

const PlatformIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const PlatformName = styled.div`
  font-weight: 600;
`;

const PlaylistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 2rem;
`;

const PlaylistCard = styled.button<{ $selected: boolean }>`
  background: ${props => props.$selected ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.$selected ? '#667eea' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  padding: 1rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
`;

const PlaylistName = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const PlaylistInfo = styled.div`
  font-size: 0.875rem;
  opacity: 0.8;
`;

const TransferForm = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: white;
  font-weight: 600;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  min-height: 80px;
  resize: vertical;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Button = styled.button<{ $primary?: boolean }>`
  background: ${props => props.$primary ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: 1px solid ${props => props.$primary ? '#667eea' : 'rgba(255, 255, 255, 0.3)'};
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.$primary ? '#5a67d8' : 'rgba(255, 255, 255, 0.2)'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ProgressContainer = styled.div`
  margin-top: 2rem;
`;

const ProgressBar = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  height: 20px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  background: linear-gradient(90deg, #667eea, #764ba2);
  height: 100%;
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
`;

const StatusText = styled.div`
  color: white;
  text-align: center;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.div`
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid #f44336;
  border-radius: 8px;
  padding: 1rem;
  color: white;
  margin-bottom: 1rem;
`;

const Transfer: React.FC = () => {
  const { authStatus } = useAuth();
  const {
    currentTransfer,
    loading,
    error,
    sourcePlaylists,
    selectedSourcePlaylist,
    startTransfer,
    loadPlaylists,
    selectSourcePlaylist,
    clearTransferData,
  } = useTransfer();

  const [step, setStep] = useState(1);
  const [sourcePlatform, setSourcePlatform] = useState<Platform | null>(null);
  const [destinationPlatform, setDestinationPlatform] = useState<Platform | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');

  const platforms = [
    { id: 'spotify' as Platform, name: 'Spotify', icon: '🎵', authenticated: authStatus.spotify },
    { id: 'apple-music' as Platform, name: 'Apple Music', icon: '🍎', authenticated: authStatus.appleMusic },
    { id: 'youtube-music' as Platform, name: 'YouTube Music', icon: '📺', authenticated: authStatus.youtubeMusic },
  ];

  const authenticatedPlatforms = platforms.filter(p => p.authenticated);

  useEffect(() => {
    if (sourcePlatform) {
      loadPlaylists(sourcePlatform);
    }
  }, [sourcePlatform]);

  useEffect(() => {
    if (selectedSourcePlaylist && !playlistName) {
      setPlaylistName(`${selectedSourcePlaylist.name} (from ${sourcePlatform})`);
      setPlaylistDescription(`Transferred from ${sourcePlatform} using Universal Music Playlist Converter`);
    }
  }, [selectedSourcePlaylist, sourcePlatform, playlistName]);

  const handleSourcePlatformSelect = (platform: Platform) => {
    setSourcePlatform(platform);
    setDestinationPlatform(null);
    selectSourcePlaylist(null);
    setStep(2);
  };

  const handleDestinationPlatformSelect = (platform: Platform) => {
    setDestinationPlatform(platform);
    setStep(3);
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    selectSourcePlaylist(playlist);
    setStep(4);
  };

  const handleStartTransfer = async () => {
    if (!sourcePlatform || !destinationPlatform || !selectedSourcePlaylist) {
      return;
    }

    try {
      await startTransfer({
        sourcePlatform,
        destinationPlatform,
        sourcePlaylistId: selectedSourcePlaylist.id,
        playlistName,
        playlistDescription,
      });
      setStep(5);
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  const handleReset = () => {
    clearTransferData();
    setStep(1);
    setSourcePlatform(null);
    setDestinationPlatform(null);
    setPlaylistName('');
    setPlaylistDescription('');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'starting': return 'Initializing transfer...';
      case 'fetching_source': return 'Fetching source playlist...';
      case 'matching_tracks': return 'Matching tracks...';
      case 'creating_playlist': return 'Creating destination playlist...';
      case 'adding_tracks': return 'Adding tracks to playlist...';
      case 'completed': return 'Transfer completed successfully!';
      case 'failed': return 'Transfer failed';
      case 'cancelled': return 'Transfer cancelled';
      default: return status;
    }
  };

  if (authenticatedPlatforms.length < 2) {
    return (
      <Container>
        <StepContainer>
          <StepTitle>⚠️ Authentication Required</StepTitle>
          <p style={{ color: 'white', marginBottom: '1rem' }}>
            You need to authenticate with at least 2 music services to transfer playlists.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Home Page
          </Button>
        </StepContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* Step 1: Select Source Platform */}
      {step >= 1 && (
        <StepContainer>
          <StepTitle>
            <StepNumber>1</StepNumber>
            Select Source Platform
          </StepTitle>
          <PlatformSelector>
            {authenticatedPlatforms.map((platform) => (
              <PlatformOption
                key={platform.id}
                $selected={sourcePlatform === platform.id}
                $disabled={false}
                onClick={() => handleSourcePlatformSelect(platform.id)}
              >
                <PlatformIcon>{platform.icon}</PlatformIcon>
                <PlatformName>{platform.name}</PlatformName>
              </PlatformOption>
            ))}
          </PlatformSelector>
        </StepContainer>
      )}

      {/* Step 2: Select Destination Platform */}
      {step >= 2 && sourcePlatform && (
        <StepContainer>
          <StepTitle>
            <StepNumber>2</StepNumber>
            Select Destination Platform
          </StepTitle>
          <PlatformSelector>
            {authenticatedPlatforms
              .filter(p => p.id !== sourcePlatform)
              .map((platform) => (
                <PlatformOption
                  key={platform.id}
                  $selected={destinationPlatform === platform.id}
                  $disabled={false}
                  onClick={() => handleDestinationPlatformSelect(platform.id)}
                >
                  <PlatformIcon>{platform.icon}</PlatformIcon>
                  <PlatformName>{platform.name}</PlatformName>
                </PlatformOption>
              ))}
          </PlatformSelector>
        </StepContainer>
      )}

      {/* Step 3: Select Playlist */}
      {step >= 3 && sourcePlatform && destinationPlatform && (
        <StepContainer>
          <StepTitle>
            <StepNumber>3</StepNumber>
            Select Playlist to Transfer
          </StepTitle>
          {loading ? (
            <StatusText>Loading playlists...</StatusText>
          ) : (
            <PlaylistGrid>
              {sourcePlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  $selected={selectedSourcePlaylist?.id === playlist.id}
                  onClick={() => handlePlaylistSelect(playlist)}
                >
                  <PlaylistName>{playlist.name}</PlaylistName>
                  <PlaylistInfo>
                    {playlist.trackCount} tracks • {playlist.owner}
                  </PlaylistInfo>
                  {playlist.description && (
                    <PlaylistInfo style={{ marginTop: '0.5rem' }}>
                      {playlist.description}
                    </PlaylistInfo>
                  )}
                </PlaylistCard>
              ))}
            </PlaylistGrid>
          )}
        </StepContainer>
      )}

      {/* Step 4: Configure Transfer */}
      {step >= 4 && selectedSourcePlaylist && (
        <StepContainer>
          <StepTitle>
            <StepNumber>4</StepNumber>
            Configure Transfer
          </StepTitle>
          <TransferForm>
            <FormGroup>
              <Label>Playlist Name</Label>
              <Input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
              />
            </FormGroup>
            <FormGroup>
              <Label>Description (Optional)</Label>
              <TextArea
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                placeholder="Enter playlist description"
              />
            </FormGroup>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button onClick={handleReset}>
                Start Over
              </Button>
              <Button $primary onClick={handleStartTransfer} disabled={!playlistName.trim()}>
                Start Transfer
              </Button>
            </div>
          </TransferForm>
        </StepContainer>
      )}

      {/* Step 5: Transfer Progress */}
      {step >= 5 && currentTransfer && (
        <StepContainer>
          <StepTitle>
            <StepNumber>5</StepNumber>
            Transfer Progress
          </StepTitle>
          <ProgressContainer>
            <ProgressBar>
              <ProgressFill $progress={currentTransfer.progress} />
            </ProgressBar>
            <StatusText>{getStatusText(currentTransfer.status)}</StatusText>
            {currentTransfer.totalTracks > 0 && (
              <StatusText>
                {currentTransfer.processedTracks} of {currentTransfer.totalTracks} tracks processed
              </StatusText>
            )}
            {currentTransfer.status === 'completed' && (
              <div style={{ color: 'white', textAlign: 'center' }}>
                <p>✅ Successfully transferred {currentTransfer.successfulMatches} tracks!</p>
                {currentTransfer.failedMatches.length > 0 && (
                  <p>⚠️ {currentTransfer.failedMatches.length} tracks could not be matched.</p>
                )}
                <Button $primary onClick={handleReset} style={{ marginTop: '1rem' }}>
                  Start New Transfer
                </Button>
              </div>
            )}
            {currentTransfer.status === 'failed' && (
              <div style={{ color: 'white', textAlign: 'center' }}>
                <p>❌ Transfer failed: {currentTransfer.error}</p>
                <Button $primary onClick={handleReset} style={{ marginTop: '1rem' }}>
                  Try Again
                </Button>
              </div>
            )}
          </ProgressContainer>
        </StepContainer>
      )}

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}
    </Container>
  );
};

export default Transfer;