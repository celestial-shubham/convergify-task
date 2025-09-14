// AI: GraphQL WebSocket Subscription Test (Claude assisted)
const { createClient } = require('graphql-ws');
const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3002/graphql';
const CHAT_ID = '3e0c3aa1-e910-4aa2-9df3-c8901ff8a545'; // General Chat (correct UUID)
const BOB_ID = 'd537f451-3562-4f4e-9191-b7c1695a5e55';

console.log('🧪 Testing GraphQL Subscriptions with graphql-ws...\n');

// Create GraphQL WS client
const client = createClient({
  url: WS_URL,
  webSocketImpl: WebSocket,
  connectionParams: {
    // Add any auth headers here if needed
  },
});

console.log('🔔 Starting subscription for chat:', CHAT_ID);
console.log('👂 Listening for real-time messages...\n');

// Subscribe to messages
const unsubscribe = client.subscribe(
  {
    query: `
      subscription MessageAdded($chatId: ID!) {
        messageAdded(chatId: $chatId) {
          id
          content
          senderUsername
          createdAt
        }
      }
    `,
    variables: { chatId: CHAT_ID },
  },
  {
    next: (data) => {
      console.log('🎉 REAL-TIME MESSAGE RECEIVED:');
      console.log('📋 Raw data:', JSON.stringify(data, null, 2));
      
      // Handle different payload structures
      const message = data.data?.messageAdded || data.messageAdded;
      
      if (message) {
        console.log('   📝 Content:', message.content);
        console.log('   👤 From:', message.senderUsername);
        console.log('   ⏰ Time:', message.createdAt);
        console.log('✅ GraphQL Subscriptions are working perfectly! 🚀\n');
      } else {
        console.log('❌ Message structure unexpected:', data);
      }
    },
    error: (err) => {
      console.error('❌ Subscription error:', err);
    },
    complete: () => {
      console.log('✅ Subscription completed');
    },
  }
);

// Send a test message after 2 seconds
setTimeout(async () => {
  console.log('📤 Sending test message via mutation...');
  
  const mutation = `
    mutation SendTestMessage($input: SendMessageInput!) {
      sendMessage(input: $input) {
        id
        content
        senderUsername
      }
    }
  `;
  
  try {
    const response = await fetch('http://localhost:3002/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            chatId: CHAT_ID,
            senderId: BOB_ID,
            content: 'Testing graphql-ws real-time subscriptions! 🎯'
          }
        }
      })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ Mutation errors:', result.errors);
    } else {
      console.log('✅ Message sent successfully:', result.data.sendMessage.content);
    }
  } catch (err) {
    console.error('❌ Error sending message:', err);
  }
}, 2000);

// Close after 8 seconds
setTimeout(() => {
  console.log('\n🏁 Test completed. Closing subscription...');
  unsubscribe();
  
  setTimeout(() => {
    console.log('👋 Goodbye!');
    process.exit(0);
  }, 1000);
}, 8000);