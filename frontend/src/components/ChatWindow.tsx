// AI: Real-time chat component (Claude assisted)
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_CHAT_HISTORY,
  SEND_MESSAGE,
  MESSAGE_ADDED_SUBSCRIPTION,
  Message,
  SendMessageInput,
} from '../graphql/operations';

interface ChatWindowProps {
  chatId: string;
  userId: string;
  username: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, userId, username }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history
  const { data: historyData, loading, refetch } = useQuery<{ chatHistory: Message[] }>(GET_CHAT_HISTORY, {
    variables: { chatId, limit: 50, offset: 0 },
    fetchPolicy: 'cache-and-network', // Always fetch fresh data
    errorPolicy: 'all',
    onCompleted: (data: any) => {
      if (data?.chatHistory) {
        const sortedMessages = [...data.chatHistory].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
      }
    },
    onError: (error) => {
      console.error('Failed to load chat history:', error);
    },
  });

  // Send message mutation
  const [sendMessageMutation] = useMutation(SEND_MESSAGE, {
    onError: (error: Error) => {
      console.error('Failed to send message:', error);
      alert(`Failed to send message: ${error.message}`);
    },
  });

  // Real-time subscription for new messages
  useSubscription(MESSAGE_ADDED_SUBSCRIPTION, {
    variables: { chatId },
    onData: ({ data }) => {
      const newMsg = data.data?.messageAdded;
      if (newMsg) {
        setMessages(prev => {
          // Avoid duplicates and maintain chronological order
          const exists = prev.some(msg => msg.id === newMsg.id);
          if (exists) return prev;
          
          const updatedMessages = [...prev, newMsg].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return updatedMessages;
        });
      }
    },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const input: SendMessageInput = {
      chatId,
      senderId: userId,
      content: newMessage.trim(),
    };

    try {
      await sendMessageMutation({ variables: { input } });
      setNewMessage('');
    } catch (error) {
      console.error('Send message failed:', error);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString();
  };

  if (loading) {
    return <div style={styles.loading}>Loading chat history...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>💬 General Chat</h2>
        <p>Connected as: <strong>{username}</strong></p>
      </div>

      <div style={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              ...styles.message,
              ...(message.senderUsername === username ? styles.ownMessage : {}),
            }}
          >
            <div style={styles.messageHeader}>
              <strong>{message.senderUsername}</strong>
              <span style={styles.timestamp}>{formatTime(message.createdAt)}</span>
            </div>
            <div style={styles.messageContent}>{message.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={styles.inputForm}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={styles.input}
          maxLength={500}
        />
        <button type="submit" style={styles.sendButton} disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

// Simple inline styles (for quick demo)
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '80vh',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    border: '1px solid #ddd',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    backgroundColor: 'white',
  },
  header: {
    background: '#f5f5f5',
    padding: '16px',
    borderBottom: '1px solid #ddd',
    textAlign: 'center' as const,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '18px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    background: '#e9ecef',
    maxWidth: '70%',
  },
  ownMessage: {
    background: '#007bff',
    color: 'white',
    alignSelf: 'flex-end',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    fontSize: '12px',
    opacity: 0.8,
  },
  messageContent: {
    fontSize: '14px',
  },
  timestamp: {
    fontSize: '11px',
    opacity: 0.7,
  },
  inputForm: {
    display: 'flex',
    padding: '16px',
    borderTop: '1px solid #ddd',
    background: '#f8f9fa',
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    marginRight: '8px',
  },
  sendButton: {
    padding: '12px 24px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};