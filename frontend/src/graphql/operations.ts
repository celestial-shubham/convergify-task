// AI: GraphQL operations for chat (Claude assisted)
import { gql } from '@apollo/client';

// Query: Get user by username
export const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      username
      email
    }
  }
`;

// Query: Get chat history
export const GET_CHAT_HISTORY = gql`
  query GetChatHistory($chatId: ID!, $limit: Int, $offset: Int) {
    chatHistory(chatId: $chatId, limit: $limit, offset: $offset) {
      id
      content
      senderUsername
      createdAt
    }
  }
`;

// Mutation: Send message
export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      content
      senderUsername
      createdAt
    }
  }
`;

// Mutation: Join General Chat
export const JOIN_GENERAL_CHAT = gql`
  mutation JoinGeneralChat($userId: ID!) {
    joinGeneralChat(userId: $userId)
  }
`;

// Subscription: Listen for new messages
export const MESSAGE_ADDED_SUBSCRIPTION = gql`
  subscription MessageAdded($chatId: ID!) {
    messageAdded(chatId: $chatId) {
      id
      content
      senderUsername
      createdAt
    }
  }
`;

// Types (based on our backend)
export interface Message {
  id: string;
  content: string;
  senderUsername: string;
  createdAt: string;
}

export interface SendMessageInput {
  chatId: string;
  senderId: string;
  content: string;
}