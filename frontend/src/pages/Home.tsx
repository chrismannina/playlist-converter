import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Platform } from '../types';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
`;

const Hero = styled.section`
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  color: white;
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.25rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const Features = styled.section`
  margin-bottom: 3rem;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  color: white;
  margin-bottom: 1rem;
  font-size: 1.25rem;
`;

const FeatureDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
`;

const AuthSection = styled.section`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 3rem;
`;

const AuthTitle = styled.h2`
  color: white;
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const PlatformGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const PlatformCard = styled.div<{ $authenticated: boolean }>`
  background: ${props => props.$authenticated ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.$authenticated ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
`;

const PlatformIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const PlatformName = styled.h3`
  color: white;
  margin-bottom: 1rem;
  font-size: 1.1rem;
`;

const AuthButton = styled.button<{ $authenticated: boolean }>`
  background: ${props => props.$authenticated ? '#4CAF50' : '#667eea'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  
  &:hover {
    background: ${props => props.$authenticated ? '#45a049' : '#5a67d8'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const StartButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 2rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const YouTubeMusicModal = styled.div<{ $show: boolean }>`
  display: ${props => props.$show ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin-bottom: 1rem;
  color: #333;
`;

const ModalText = styled.p`
  margin-bottom: 1rem;
  color: #666;
  line-height: 1.5;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 100px;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.875rem;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button<{ $primary?: boolean }>`
  background: ${props => props.$primary ? '#667eea' : '#f5f5f5'};
  color: ${props => props.$primary ? 'white' : '#333'};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  
  &:hover {
    opacity: 0.9;
  }
`;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { authStatus, loginSpotify, loginAppleMusic, loginYouTubeMusic, logout } = useAuth();
  const [showYouTubeMusicModal, setShowYouTubeMusicModal] = useState(false);
  const [youTubeMusicHeaders, setYouTubeMusicHeaders] = useState('');

  const platforms = [
    {
      id: 'spotify' as Platform,
      name: 'Spotify',
      icon: '🎵',
      authenticated: authStatus.spotify,
    },
    {
      id: 'apple-music' as Platform,
      name: 'Apple Music',
      icon: '🍎',
      authenticated: authStatus.appleMusic,
    },
    {
      id: 'youtube-music' as Platform,
      name: 'YouTube Music',
      icon: '📺',
      authenticated: authStatus.youtubeMusic,
    },
  ];

  const handlePlatformAuth = async (platform: Platform) => {
    try {
      switch (platform) {
        case 'spotify':
          if (authStatus.spotify) {
            await logout(platform);
          } else {
            loginSpotify();
          }
          break;
        case 'apple-music':
          if (authStatus.appleMusic) {
            await logout(platform);
          } else {
            // Apple Music requires MusicKit JS integration
            alert('Apple Music authentication requires MusicKit JS setup. This is a demo limitation.');
          }
          break;
        case 'youtube-music':
          if (authStatus.youtubeMusic) {
            await logout(platform);
          } else {
            setShowYouTubeMusicModal(true);
          }
          break;
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const handleYouTubeMusicAuth = async () => {
    try {
      const headers = JSON.parse(youTubeMusicHeaders);
      await loginYouTubeMusic(headers);
      setShowYouTubeMusicModal(false);
      setYouTubeMusicHeaders('');
    } catch (error) {
      alert('Invalid headers format. Please provide valid JSON.');
    }
  };

  const canStartTransfer = Object.values(authStatus).filter(Boolean).length >= 2;

  return (
    <Container>
      <Hero>
        <Title>Transfer Your Music</Title>
        <Subtitle>
          Seamlessly move your playlists between Spotify, Apple Music, and YouTube Music.
          Our intelligent matching engine ensures your music follows you everywhere.
        </Subtitle>
      </Hero>

      <Features>
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>🔄</FeatureIcon>
            <FeatureTitle>Smart Matching</FeatureTitle>
            <FeatureDescription>
              Uses ISRC codes and fuzzy search to find the best matches for your tracks across platforms.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>🔒</FeatureIcon>
            <FeatureTitle>Secure & Private</FeatureTitle>
            <FeatureDescription>
              Your credentials never leave our secure servers. All authentication is handled server-side.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>📊</FeatureIcon>
            <FeatureTitle>Detailed Reports</FeatureTitle>
            <FeatureDescription>
              Get comprehensive reports showing successful transfers and any tracks that couldn't be matched.
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>
      </Features>

      <AuthSection>
        <AuthTitle>Connect Your Music Services</AuthTitle>
        <PlatformGrid>
          {platforms.map((platform) => (
            <PlatformCard key={platform.id} $authenticated={platform.authenticated}>
              <PlatformIcon>{platform.icon}</PlatformIcon>
              <PlatformName>{platform.name}</PlatformName>
              <AuthButton
                $authenticated={platform.authenticated}
                onClick={() => handlePlatformAuth(platform.id)}
              >
                {platform.authenticated ? 'Disconnect' : 'Connect'}
              </AuthButton>
            </PlatformCard>
          ))}
        </PlatformGrid>

        <StartButton
          disabled={!canStartTransfer}
          onClick={() => navigate('/transfer')}
        >
          {canStartTransfer ? 'Start Transfer' : 'Connect at least 2 services to continue'}
        </StartButton>
      </AuthSection>

      <YouTubeMusicModal $show={showYouTubeMusicModal}>
        <ModalContent>
          <ModalTitle>YouTube Music Authentication</ModalTitle>
          <ModalText>
            YouTube Music doesn't have an official public API. To authenticate, you'll need to provide
            authentication headers from your browser:
          </ModalText>
          <ModalText>
            1. Open YouTube Music in your browser and log in<br/>
            2. Open Developer Tools (F12)<br/>
            3. Go to Network tab and refresh the page<br/>
            4. Find a request to music.youtube.com<br/>
            5. Copy the request headers (cookie, x-goog-authuser, etc.)
          </ModalText>
          <TextArea
            placeholder='{"cookie": "...", "x-goog-authuser": "0", ...}'
            value={youTubeMusicHeaders}
            onChange={(e) => setYouTubeMusicHeaders(e.target.value)}
          />
          <ModalButtons>
            <ModalButton onClick={() => setShowYouTubeMusicModal(false)}>
              Cancel
            </ModalButton>
            <ModalButton $primary onClick={handleYouTubeMusicAuth}>
              Authenticate
            </ModalButton>
          </ModalButtons>
        </ModalContent>
      </YouTubeMusicModal>
    </Container>
  );
};

export default Home;