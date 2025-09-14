// AI: Chat Service with transactions (Claude assisted)
import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessageDAO, MESSAGE_DAO, ChatDAO, CHAT_DAO, DATABASE_POOL } from '@chat-app/common';
import { Pool } from 'pg';
import { RedisPubSub, PUB_SUB_SERVICE } from '../redis/redis.provider';
import { SendMessageInput } from './dto/send-message.input';
import { MessageType } from './chat.types';

@Injectable()
export class ChatService {
  constructor(
    @Inject(MESSAGE_DAO) private readonly messageDAO: MessageDAO,
    @Inject(CHAT_DAO) private readonly chatDAO: ChatDAO,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(PUB_SUB_SERVICE) private readonly pubSub: RedisPubSub,
  ) {}

  /**
   * CRITICAL: Send message with ACID transaction + Redis publish
   * Flow: BEGIN → INSERT → COMMIT → Redis publish
   */
  async sendMessage(input: SendMessageInput): Promise<MessageType> {
    const { chatId, senderId, content } = input;

    // Verify user is participant of the chat
    const isParticipant = await this.chatDAO.isUserInChat(chatId, senderId);
    if (!isParticipant) {
      throw new ForbiddenException('User is not a participant of this chat');
    }

    // Send message with transaction (Phase 1 flow)
    const messageWithDetails = await this.messageDAO.sendMessage(chatId, senderId, content);

    // Publish to Redis AFTER successful DB commit
    const redisPayload = {
      messageAdded: {
        id: messageWithDetails.uuid,
        chatId: messageWithDetails.chatUuid,
        senderId: messageWithDetails.senderUuid,
        content: messageWithDetails.content,
        createdAt: messageWithDetails.createdAt.toISOString(),
        senderUsername: messageWithDetails.senderUsername,
      }
    };

    // Publish to specific chat channel
    await this.pubSub.publish(`MESSAGE_ADDED_${chatId}`, redisPayload);

    // Return GraphQL-compatible type
    return {
      id: messageWithDetails.uuid,
      chatId: messageWithDetails.chatUuid,
      senderId: messageWithDetails.senderUuid,
      content: messageWithDetails.content,
      createdAt: messageWithDetails.createdAt.toISOString(),
      senderUsername: messageWithDetails.senderUsername,
    };
  }

  /**
   * Get chat history with pagination
   */
  async getChatHistory(chatId: string, limit: number = 50, offset: number = 0): Promise<MessageType[]> {
    const messages = await this.messageDAO.getChatHistory(chatId, limit, offset);
    
    return messages.map(msg => ({
      id: msg.uuid,
      chatId: msg.chatUuid,
      senderId: msg.senderUuid,
      content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      senderUsername: msg.senderUsername,
    }));
  }

  /**
   * Join user to General Chat automatically
   */
  async joinGeneralChat(userUuid: string): Promise<boolean> {
    const GENERAL_CHAT_ID = '3e0c3aa1-e910-4aa2-9df3-c8901ff8a545';
    
    try {
      // Check if user is already a participant
      const isAlreadyParticipant = await this.chatDAO.isUserInChat(GENERAL_CHAT_ID, userUuid);
      if (isAlreadyParticipant) {
        return true; // Already joined
      }

      // Add user to General Chat
      const query = `
        INSERT INTO chat_participants (chat_id, user_id, role, is_active)
        SELECT 
          (SELECT id FROM chats WHERE uuid = $1),
          (SELECT id FROM users WHERE uuid = $2),
          'member',
          true
        ON CONFLICT (chat_id, user_id) DO UPDATE SET is_active = true
      `;
      
      await this.pool.query(query, [GENERAL_CHAT_ID, userUuid]);
      console.log(`✅ User ${userUuid} added to General Chat`);
      return true;
    } catch (error) {
      console.error('❌ Failed to add user to General Chat:', error);
      return false;
    }
  }

  /**
   * Create async iterator for GraphQL subscriptions
   */
  messageAddedAsyncIterator(chatId: string) {
    return this.pubSub.asyncIterator(`MESSAGE_ADDED_${chatId}`);
  }
}