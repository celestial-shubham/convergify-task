// AI: End-to-end test for real-time messaging (Claude assisted)

import { createClient, Client } from 'graphql-ws';
import WebSocket from 'ws';
import { TEST_CONFIG, waitFor } from '../setup';

// GraphQL operations
const CREATE_USER = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      username
    }
  }
`;

const JOIN_GENERAL_CHAT = `
  mutation JoinGeneralChat($userId: ID!) {
    joinGeneralChat(userId: $userId)
  }
`;

const SEND_MESSAGE = `
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      content
      senderUsername
      createdAt
    }
  }
`;

const MESSAGE_SUBSCRIPTION = `
  subscription MessageAdded($chatId: ID!) {
    messageAdded(chatId: $chatId) {
      id
      content
      senderUsername
      createdAt
    }
  }
`;

// Helper function to make HTTP GraphQL requests
async function graphqlRequest(url: string, query: string, variables?: any) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const result: any = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}

describe('Real-time Messaging E2E', () => {
  let wsClient1: Client;
  let wsClient2: Client;
  let user1: any;
  let user2: any;

  beforeAll(async () => {
    // Wait a bit for services to be ready
    await waitFor(2000);
  });

  afterAll(async () => {
    // Clean up WebSocket connections and wait for completion
    const cleanupPromises: Promise<void>[] = [];
    
    if (wsClient1) {
      cleanupPromises.push(
        new Promise<void>((resolve) => {
          wsClient1.on('closed', () => resolve());
          wsClient1.dispose();
        })
      );
    }
    
    if (wsClient2) {
      cleanupPromises.push(
        new Promise<void>((resolve) => {
          wsClient2.on('closed', () => resolve());
          wsClient2.dispose();
        })
      );
    }

    // Wait for all connections to close properly
    await Promise.all(cleanupPromises);
    
    // Give a bit more time for final cleanup
    await waitFor(1000);
  });

  test('should deliver messages in real-time across WebSocket connections', async () => {
    console.log('🧪 Starting E2E Test: Real-time messaging flow');

    // Step 1: Create two test users
    console.log('📝 Creating test users...');
    
    const username1 = `testuser_${Date.now()}_1`;
    const username2 = `testuser_${Date.now()}_2`;

    try {
      const result1 = await graphqlRequest(TEST_CONFIG.USER_SERVICE_URL, CREATE_USER, {
        input: { username: username1 }
      });
      user1 = result1.createUser;

      const result2 = await graphqlRequest(TEST_CONFIG.USER_SERVICE_URL, CREATE_USER, {
        input: { username: username2 }
      });
      user2 = result2.createUser;

      console.log(`✅ Created users: ${user1.username} (${user1.id}) and ${user2.username} (${user2.id})`);
    } catch (error) {
      console.error('❌ Failed to create users:', error);
      throw error;
    }

    // Step 2: Join both users to General Chat
    console.log('🏠 Joining users to General Chat...');
    
    try {
      await graphqlRequest(TEST_CONFIG.CHAT_SERVICE_URL, JOIN_GENERAL_CHAT, {
        userId: user1.id
      });
      
      await graphqlRequest(TEST_CONFIG.CHAT_SERVICE_URL, JOIN_GENERAL_CHAT, {
        userId: user2.id
      });
      
      console.log('✅ Both users joined General Chat');
    } catch (error) {
      console.error('❌ Failed to join chat:', error);
      throw error;
    }

    // Step 3: Set up WebSocket subscriptions for both users
    console.log('🔗 Setting up WebSocket subscriptions...');
    
    const receivedMessages1: any[] = [];
    const receivedMessages2: any[] = [];

    // Create WebSocket clients
    wsClient1 = createClient({
      url: TEST_CONFIG.WS_URL,
      webSocketImpl: WebSocket,
    });

    wsClient2 = createClient({
      url: TEST_CONFIG.WS_URL,
      webSocketImpl: WebSocket,
    });

    // Subscribe to messages for both clients
    const subscription1Promise = new Promise<void>((resolve, reject) => {
      const dispose1 = wsClient1.subscribe(
        {
          query: MESSAGE_SUBSCRIPTION,
          variables: { chatId: TEST_CONFIG.GENERAL_CHAT_ID },
        },
        {
          next: (data: any) => {
            console.log('📨 User 1 received:', data.data.messageAdded);
            receivedMessages1.push(data.data.messageAdded);
            if (receivedMessages1.length >= 2) {
              dispose1(); // Clean up immediately
              resolve();
            }
          },
          error: reject,
          complete: () => {
            console.log('🔚 User 1 subscription completed');
          },
        }
      );
    });

    const subscription2Promise = new Promise<void>((resolve, reject) => {
      const dispose2 = wsClient2.subscribe(
        {
          query: MESSAGE_SUBSCRIPTION,
          variables: { chatId: TEST_CONFIG.GENERAL_CHAT_ID },
        },
        {
          next: (data: any) => {
            console.log('📨 User 2 received:', data.data.messageAdded);
            receivedMessages2.push(data.data.messageAdded);
            if (receivedMessages2.length >= 2) {
              dispose2(); // Clean up immediately
              resolve();
            }
          },
          error: reject,
          complete: () => {
            console.log('🔚 User 2 subscription completed');
          },
        }
      );
    });

    // Wait a bit for subscriptions to be established
    await waitFor(1000);
    console.log('✅ WebSocket subscriptions established');

    // Step 4: Send messages and verify real-time delivery
    console.log('💬 Sending test messages...');

    const testMessage1 = `Hello from ${user1.username} at ${Date.now()}`;
    const testMessage2 = `Reply from ${user2.username} at ${Date.now()}`;

    // Send first message from user1
    await graphqlRequest(TEST_CONFIG.CHAT_SERVICE_URL, SEND_MESSAGE, {
      input: {
        chatId: TEST_CONFIG.GENERAL_CHAT_ID,
        senderId: user1.id,
        content: testMessage1,
      },
    });

    console.log(`📤 User 1 sent: "${testMessage1}"`);

    // Wait a bit
    await waitFor(1000);

    // Send second message from user2
    await graphqlRequest(TEST_CONFIG.CHAT_SERVICE_URL, SEND_MESSAGE, {
      input: {
        chatId: TEST_CONFIG.GENERAL_CHAT_ID,
        senderId: user2.id,
        content: testMessage2,
      },
    });

    console.log(`📤 User 2 sent: "${testMessage2}"`);

    // Wait for both subscriptions to receive both messages
    await Promise.race([
      Promise.all([subscription1Promise, subscription2Promise]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout waiting for messages')), TEST_CONFIG.TEST_TIMEOUT)
      ),
    ]);

    // Step 5: Verify the messages were received correctly
    console.log('🔍 Verifying received messages...');

    // Both clients should have received both messages
    expect(receivedMessages1).toHaveLength(2);
    expect(receivedMessages2).toHaveLength(2);

    // Verify message contents
    expect(receivedMessages1[0].content).toBe(testMessage1);
    expect(receivedMessages1[0].senderUsername).toBe(user1.username);
    expect(receivedMessages1[1].content).toBe(testMessage2);
    expect(receivedMessages1[1].senderUsername).toBe(user2.username);

    expect(receivedMessages2[0].content).toBe(testMessage1);
    expect(receivedMessages2[0].senderUsername).toBe(user1.username);
    expect(receivedMessages2[1].content).toBe(testMessage2);
    expect(receivedMessages2[1].senderUsername).toBe(user2.username);

    // Verify message IDs are valid UUIDs
    expect(receivedMessages1[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(receivedMessages1[1].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

    // Verify timestamps are valid ISO strings
    expect(receivedMessages1[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(receivedMessages1[1].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    console.log('✅ All assertions passed! Real-time messaging works correctly.');
    console.log('🎉 E2E Test completed successfully');

  }, TEST_CONFIG.TEST_TIMEOUT);
});