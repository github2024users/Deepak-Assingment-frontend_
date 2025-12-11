import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

// Google OAuth client ID provided in .env file
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const [user, setUser] = useState(null);      // Stores logged-in user info
  const [loading, setLoading] = useState(true); // Show loader until user restored

  // Load existing session from localStorage on first render
  useEffect(() => {
    const savedUser = localStorage.getItem('scraper_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
        localStorage.removeItem('scraper_user');
      }
    }
    setLoading(false);
  }, []);

  // Login callback from child component
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('scraper_user', JSON.stringify(userData));
  };

  // Logout removes both user and scraped data
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('scraper_user');
    localStorage.removeItem('scraper_data');
  };

  // Loading screen shown on initial load
  if (loading) {
    return (
      <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor:'#f5f5f5'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'48px', marginBottom:'20px'}}>⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="app">
        
        {/* Header */}
        <header className="header">
          <h1>Web Scraper Portal</h1>
        </header>

        {/* Show login OR dashboard depending on user session */}
        <main className="main">
          {!user ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Dashboard user={user} onLogout={handleLogout} />
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>© Freshers Project - React Scraper</p>
        </footer>

      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
