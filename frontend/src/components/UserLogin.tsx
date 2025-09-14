// AI: User login component (Claude assisted)
import React, { useState } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';
import { JOIN_GENERAL_CHAT, GET_USER_BY_USERNAME } from '../graphql/operations';

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      username
      email
    }
  }
`;

interface User {
  id: string;
  username: string;
  email?: string;
}

interface UserLoginProps {
  onUserSelected: (user: User) => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({ onUserSelected }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [createUser] = useMutation(CREATE_USER);
  const [joinGeneralChat] = useMutation(JOIN_GENERAL_CHAT);
  const [getUserByUsername] = useLazyQuery(GET_USER_BY_USERNAME);

  const handleJoinChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      // Try to create user (will handle duplicates in backend)
      const result = await createUser({
        variables: {
          input: { username: username.trim() }
        }
      });

      const user = result.data?.createUser;
      if (user) {
        // Auto-join General Chat
        try {
          await joinGeneralChat({
            variables: { userId: user.id }
          });
          console.log('✅ User automatically joined General Chat');
        } catch (joinError) {
          console.warn('⚠️ Failed to join General Chat, but continuing:', joinError);
        }
        
        onUserSelected(user);
        // onUserSelected now handles storage via sessionStorage
      }
    } catch (error: any) {
      console.error('Create user failed:', error);
      
      // Check if error is due to user already existing
      if (error.message?.includes('already taken') || error.message?.includes('already exists')) {
        console.log('🔍 User exists, fetching existing user...');
        
        try {
          // Fetch existing user by username
          const existingUserResult = await getUserByUsername({
            variables: { username: username.trim() }
          });
          
          const existingUser = existingUserResult.data?.userByUsername;
          if (existingUser) {
            console.log('✅ Found existing user:', existingUser.username);
            
            // Auto-join General Chat with existing user ID
            try {
              await joinGeneralChat({
                variables: { userId: existingUser.id }
              });
              console.log('✅ Existing user automatically joined General Chat');
            } catch (joinError) {
              console.warn('⚠️ Failed to join General Chat for existing user:', joinError);
            }
            
            onUserSelected(existingUser);
            return;
          }
        } catch (fetchError) {
          console.error('❌ Failed to fetch existing user:', fetchError);
        }
      }
      
      // Fallback: Generate mock user only if we can't fetch existing user
      console.warn('⚠️ Using mock user as fallback');
      const mockUser = {
        id: uuidv4(), // Generate proper UUID
        username: username.trim(),
      };
      
      // Try to auto-join General Chat for mock user too
      try {
        await joinGeneralChat({
          variables: { userId: mockUser.id }
        });
        console.log('✅ Mock user automatically joined General Chat');
      } catch (joinError) {
        console.warn('⚠️ Failed to join General Chat for mock user:', joinError);
      }
      
      onUserSelected(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🚀 Join General Chat</h2>
        <p style={styles.subtitle}>Enter your username to start chatting</p>

        <form onSubmit={handleJoinChat} style={styles.form}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username..."
            style={styles.input}
            maxLength={30}
            disabled={isLoading}
            autoFocus
          />
          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {}),
            }}
            disabled={!username.trim() || isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Chat'}
          </button>
        </form>

        <div style={styles.note}>
          💡 <strong>Demo:</strong> Any username works! Open multiple tabs with different usernames to test real-time chat.
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '28px',
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    color: '#666',
    marginBottom: '32px',
    fontSize: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  input: {
    padding: '16px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '16px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
  note: {
    marginTop: '24px',
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.4',
  },
};