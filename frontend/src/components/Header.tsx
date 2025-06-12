import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  color: white;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const Nav = styled.nav`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const AuthStatus = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const PlatformStatus = styled.div<{ $authenticated: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  background: ${props => props.$authenticated ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  border: 1px solid ${props => props.$authenticated ? '#4CAF50' : 'rgba(255, 255, 255, 0.3)'};
`;

const UserInfo = styled.div`
  color: white;
  font-size: 0.875rem;
`;

const Header: React.FC = () => {
  const location = useLocation();
  const { authStatus, userInfo } = useAuth();

  const getPlatformDisplayName = (platform: string) => {
    switch (platform) {
      case 'spotify': return 'Spotify';
      case 'appleMusic': return 'Apple Music';
      case 'youtubeMusic': return 'YouTube Music';
      default: return platform;
    }
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo>🎵 Universal Music Playlist Converter</Logo>
        
        <Nav>
          <NavLink to="/" $active={location.pathname === '/'}>
            Home
          </NavLink>
          <NavLink to="/transfer" $active={location.pathname === '/transfer'}>
            Transfer
          </NavLink>
        </Nav>

        <AuthStatus>
          {Object.entries(authStatus).map(([platform, authenticated]) => (
            <PlatformStatus key={platform} $authenticated={authenticated}>
              {getPlatformDisplayName(platform)}
            </PlatformStatus>
          ))}
          
          {userInfo.spotify && (
            <UserInfo>
              Welcome, {userInfo.spotify.display_name}
            </UserInfo>
          )}
        </AuthStatus>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;