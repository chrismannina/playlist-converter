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

const Modal = styled.div<{ $show: boolean }>`
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
  background: #1a1a1a;
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ModalTitle = styled.h3`
  margin-bottom: 1rem;
  color: white;
`;

const ModalText = styled.p`
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 120px;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-family: monospace;
  font-size: 0.875rem;
  resize: vertical;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button<{ $primary?: boolean }>`
  background: ${props => props.$primary ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: 1px solid ${props => props.$primary ? '#667eea' : 'rgba(255, 255, 255, 0.3)'};
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
  const { authStatus, loginSpotify, loginYoutubeMusic, logout } = useAuth();
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
            await logout('spotify');
          } else {
            loginSpotify();
          }
          break;
        case 'apple-music':
          if (authStatus.appleMusic) {
            await logout('apple-music');
          } else {
            alert('Apple Music authentication requires MusicKit JS setup. Please use the Transfer page for full functionality.');
          }
          break;
        case 'youtube-music':
          if (authStatus.youtubeMusic) {
            await logout('youtube-music');
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
      await loginYoutubeMusic(youTubeMusicHeaders);
      setShowYouTubeMusicModal(false);
      setYouTubeMusicHeaders('');
    } catch (error) {
      console.error('YouTube Music authentication error:', error);
      alert('Authentication failed. Please check your headers and try again.');
    }
  };

  const handleStartTransfer = () => {
    // Implement the logic to start the transfer
  };

  return (
    <Container>
      <Hero>
        <Title>Transfer Your Music</Title>
        <Subtitle>
          Seamlessly move your playlists between Spotify and Apple Music.
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
        <AuthTitle>Connect Your Services</AuthTitle>
        <PlatformGrid>
          {platforms.map(({ id, name, icon, authenticated }) => (
            <PlatformCard key={id} $authenticated={authenticated}>
              <PlatformIcon>{icon}</PlatformIcon>
              <PlatformName>{name}</PlatformName>
              <AuthButton
                onClick={() => handlePlatformAuth(id)}
                $authenticated={authenticated}
              >
                {authenticated ? 'Disconnect' : 'Connect'}
              </AuthButton>
            </PlatformCard>
          ))}
        </PlatformGrid>
        <StartButton 
          onClick={handleStartTransfer}
          disabled={Object.values(authStatus).filter(Boolean).length < 2}
        >
          Start Transfer
        </StartButton>
      </AuthSection>

      {/* YouTube Music Modal */}
      <Modal $show={showYouTubeMusicModal}>
        <ModalContent>
          <ModalTitle>Connect to YouTube Music</ModalTitle>
          <ModalText>
            To connect to YouTube Music, you need to provide authentication headers from your browser.
          </ModalText>
          <ModalText>
            <strong>Instructions:</strong><br/>
            1. Open YouTube Music in your browser and log in<br/>
            2. Open Developer Tools (F12)<br/>
            3. Go to Network tab and refresh the page<br/>
            4. Find a POST request to music.youtube.com/youtubei/v1/browse<br/>
            5. Right-click the request and select "Copy as cURL" or "Copy request headers"<br/>
            6. Paste the headers below (we need the complete raw headers including Authorization)
          </ModalText>
          <ModalText>
            <strong>Example format:</strong><br/>
            accept: */*<br/>
            authorization: SAPISIDHASH ...<br/>
            cookie: YSC=...<br/>
            x-goog-authuser: 0<br/>
            ...
          </ModalText>
          <TextArea
            value={youTubeMusicHeaders}
            onChange={(e) => setYouTubeMusicHeaders(e.target.value)}
            placeholder='accept: */*
authorization: SAPISIDHASH_1234567890_abcdef...
cookie: YSC=abc123; SAPISID=...; 
x-goog-authuser: 0
x-origin: https://music.youtube.com
...'
          />
          <ModalButtons>
            <ModalButton onClick={() => {
              setShowYouTubeMusicModal(false);
              setYouTubeMusicHeaders('');
            }}>
              Cancel
            </ModalButton>
            <ModalButton $primary onClick={handleYouTubeMusicAuth}>
              Connect
            </ModalButton>
          </ModalButtons>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Home;