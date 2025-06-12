import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Home from './pages/Home';
import Transfer from './pages/Transfer';
import { AuthProvider } from './contexts/AuthContext';
import { TransferProvider } from './contexts/TransferContext';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

function App() {
  return (
    <AuthProvider>
      <TransferProvider>
        <Router>
          <AppContainer>
            <Header />
            <MainContent>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/transfer" element={<Transfer />} />
              </Routes>
            </MainContent>
          </AppContainer>
        </Router>
      </TransferProvider>
    </AuthProvider>
  );
}

export default App;
