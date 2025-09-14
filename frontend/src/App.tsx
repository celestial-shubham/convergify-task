// AI: Main React app with Apollo Provider (Claude assisted)
import React, { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './apolloClient';
import { ChatWindow } from './components/ChatWindow';
import { UserLogin } from './components/UserLogin';

// Constants from our backend setup
const CHAT_ID = '3e0c3aa1-e910-4aa2-9df3-c8901ff8a545'; // General Chat UUID

interface User {
  id: string;
  username: string;
  email?: string;
}

// Create unique session for each window/tab
const SESSION_ID = Date.now() + Math.random();
const SESSION_KEY = `chatUser_${SESSION_ID}`;

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check for existing user in sessionStorage for this window only
  useEffect(() => {
    const savedUser = sessionStorage.getItem(SESSION_KEY);
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const handleUserSelected = (user: User) => {
    setCurrentUser(user);
    // Save to sessionStorage (window-specific) instead of localStorage (shared)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <ApolloProvider client={apolloClient}>
      {!currentUser ? (
        <UserLogin onUserSelected={handleUserSelected} />
      ) : (
        <div style={styles.app}>
          <header style={styles.header}>
            <h1>🚀 Phase 6: Real-Time Chat Frontend</h1>
            <p>React + Apollo + GraphQL Subscriptions + PostgreSQL + Redis</p>
            <div style={styles.userInfo}>
              <span>Welcome, <strong>{currentUser.username}</strong>!</span>
              <span style={styles.sessionInfo}>Window #{Math.floor(SESSION_ID % 1000)}</span>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </div>
          </header>
          
          <main style={styles.main}>
            <ChatWindow 
              chatId={CHAT_ID}
              userId={currentUser.id}
              username={currentUser.username}
            />
          </main>

          <footer style={styles.footer}>
            <p>
              💡 <strong>Demo:</strong> Open multiple tabs with different users to test real-time messaging!
            </p>
            <p>
              🔧 Backend: NestJS + PostgreSQL + Redis pub/sub across multiple instances
            </p>
          </footer>
        </div>
      )}
    </ApolloProvider>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px',
    textAlign: 'center' as const,
    position: 'relative' as const,
  },
  userInfo: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
  },
  sessionInfo: {
    fontSize: '11px',
    opacity: 0.7,
    padding: '2px 6px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: '3px',
  },
  logoutButton: {
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 200px)',
  },
  footer: {
    background: '#343a40',
    color: 'white',
    padding: '16px',
    textAlign: 'center' as const,
    fontSize: '14px',
  },
};

export default App;