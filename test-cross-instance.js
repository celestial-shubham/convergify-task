// AI: Cross-Instance Real-Time Testing (Claude assisted)
const { createClient } = require('graphql-ws');
const WebSocket = require('ws');
const { exec } = require('child_process');

// Configuration
const INSTANCE_1_HTTP = 'http://localhost:3002/graphql';
const INSTANCE_2_WS = 'ws://localhost:3003/graphql';
const CHAT_ID = '3e0c3aa1-e910-4aa2-9df3-c8901ff8a545'; // General Chat
const DAVE_ID = 'ab7de556-6d6c-4041-967e-8503a057f7f8'; // Dave's UUID

console.log('🚀 PHASE 5: Cross-Instance Real-Time Testing');
console.log('============================================');
console.log('📡 Subscription: Instance 2 (port 3003)');
console.log('📤 Send Message: Instance 1 (port 3002)');
console.log('🎯 Goal: Verify Redis pub/sub across instances\n');

// Create WebSocket client for Instance 2
const wsClient = createClient({
  url: INSTANCE_2_WS,
  webSocketImpl: WebSocket,
});

// Subscribe to messages on Instance 2
console.log('🔔 Starting subscription on Instance 2...');
const unsubscribe = wsClient.subscribe(
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
      console.log('\n🎉 CROSS-INSTANCE MESSAGE RECEIVED!');
      console.log('📋 Instance 2 received message from Instance 1:' , data);
      
      const message = data.data?.messageAdded || data.messageAdded;
      
      if (message) {
        console.log('   📝 Content:', message.content);
        console.log('   👤 From:', message.senderUsername);
        console.log('   🆔 Message ID:', message.id);
        console.log('   ⏰ Time:', message.createdAt);
        console.log('\n✅ REDIS PUB/SUB WORKING ACROSS INSTANCES! 🚀');
      } else {
        console.log('❌ Unexpected message structure:', data);
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

// Wait for subscription to be established, then send message via Instance 1
setTimeout(async () => {
  console.log('📤 Sending message via Instance 1...');
  
  const curlCommand = `curl -X POST ${INSTANCE_1_HTTP} \\
    -H "Content-Type: application/json" \\
    -d '{"query": "mutation { sendMessage(input: { chatId: \\"${CHAT_ID}\\", senderId: \\"${DAVE_ID}\\", content: \\"🔥 Cross-instance test message from Dave!\\" }) { id content senderUsername createdAt } }"}'`;

  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Failed to send message:', error);
      return;
    }
    
    try {
      const result = JSON.parse(stdout);
      if (result.errors) {
        console.log('❌ GraphQL errors:', result.errors);
      } else {
        console.log('✅ Message sent via Instance 1:', result.data.sendMessage);
        console.log('⏳ Waiting for cross-instance delivery...');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError);
      console.log('Raw response:', stdout);
    }
  });
}, 2000);

// Clean up after 10 seconds
setTimeout(() => {
  console.log('\n🧹 Cleaning up...');
  unsubscribe();
  process.exit(0);
}, 10000);