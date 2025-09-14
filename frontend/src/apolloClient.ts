// AI: Apollo Client with GraphQL subscriptions and load balancing (Claude assisted)
import { ApolloClient, InMemoryCache, from, split, HttpLink, ApolloLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// Backend endpoints
const USER_SERVICE_URI = 'http://localhost:3001/graphql';  // User Service  

// Chat service instances for load balancing
const CHAT_SERVICE_INSTANCES = [
  'http://localhost:3002/graphql',  // Chat Service Instance 1
  'http://localhost:3003/graphql',  // Chat Service Instance 2
];

const WS_INSTANCES = [
  'ws://localhost:3002/graphql',    // WebSocket Instance 1
  'ws://localhost:3003/graphql',    // WebSocket Instance 2
];

// Simple round-robin load balancer
let currentChatIndex = 0;
let currentWSIndex = 0;

const getNextChatService = () => {
  const instance = CHAT_SERVICE_INSTANCES[currentChatIndex];
  currentChatIndex = (currentChatIndex + 1) % CHAT_SERVICE_INSTANCES.length;
  console.log(`🔀 Load balancing to: ${instance}`);
  return instance;
};

const getNextWSService = () => {
  const instance = WS_INSTANCES[currentWSIndex];
  currentWSIndex = (currentWSIndex + 1) % WS_INSTANCES.length;
  console.log(`🔀 WebSocket connecting to: ${instance}`);
  return instance;
};

// HTTP links for different services
const userServiceLink = new HttpLink({
  uri: USER_SERVICE_URI,
});

// Dynamic chat service link with load balancing
const chatServiceLink = new ApolloLink((operation, forward) => {
  // Set the URI dynamically based on load balancing
  operation.setContext({
    uri: getNextChatService()
  });
  
  // Create a new HttpLink for this specific request
  const httpLink = new HttpLink({ uri: operation.getContext().uri });
  return httpLink.request(operation, forward);
});

// WebSocket link for subscriptions with load balancing
const wsLink = new GraphQLWsLink(
  createClient({
    url: getNextWSService(), // Use load-balanced WebSocket
  }) as any // Type assertion to bypass version conflict
);

// Multi-service routing link
const serviceLink = split(
  ({ query }: { query: any }) => {
    const definition = getMainDefinition(query);
    
    // Check if it's a user-related operation
    if (definition.kind === 'OperationDefinition') {
      const selections = definition.selectionSet?.selections || [];
      
      // Route user operations to User Service
      const isUserOperation = selections.some((selection: any) => {
        const fieldName = selection.name?.value || '';
        return fieldName.includes('User') || fieldName === 'createUser' || fieldName === 'user' || fieldName === 'userByUsername';
      });
      
      if (isUserOperation) {
        return false; // Use userServiceLink (will be handled by split below)
      }
    }
    
    return true; // Use chatServiceLink
  },
  chatServiceLink,
  userServiceLink
);

// Split link: WebSocket for subscriptions, HTTP for queries/mutations  
const splitLink = split(
  ({ query }: { query: any }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  serviceLink
);

// Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([splitLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

console.log('apolloClient', apolloClient);