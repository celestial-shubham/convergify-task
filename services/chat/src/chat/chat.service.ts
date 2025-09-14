// AI: Chat Service with transactions (Claude assisted)
import { Injectable, Inject, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { MessageDAO, MESSAGE_DAO, ChatDAO, CHAT_DAO, DATABASE_POOL } from '@chat-app/common';
import { Pool } from 'pg';
import { RedisPubSub, PUB_SUB_SERVICE } from '../redis/redis.provider';
import { SendMessageInput } from './dto/send-message.input';
import { MessageType, ChatType } from './chat.types';

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_DAO) private readonly messageDAO: MessageDAO,
    @Inject(CHAT_DAO) private readonly chatDAO: ChatDAO,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(PUB_SUB_SERVICE) private readonly pubSub: RedisPubSub,
  ) {}

  async onModuleInit() {
    await this.ensureGeneralChatExists();
  }

  /**
   * Ensure General Chat exists with expected UUID on startup
   */
  private async ensureGeneralChatExists(): Promise<void> {
    try {
      // Check if General Chat exists by name
      const existingResult = await this.pool.query(
        'SELECT uuid FROM chats WHERE name = $1 LIMIT 1',
        ['General Chat']
      );
      
      if (existingResult.rows.length > 0) {
        console.log('✅ General Chat already exists with UUID:', existingResult.rows[0].uuid);
        return;
      }
      
      // Create General Chat if it doesn't exist (let PostgreSQL generate UUID)
      const createResult = await this.pool.query(
        'INSERT INTO chats (name, description, is_group) VALUES ($1, $2, $3) RETURNING uuid',
        ['General Chat', 'Main chat room for everyone', true]
      );
      
      console.log('✅ General Chat created with UUID:', createResult.rows[0].uuid);
    } catch (error) {
      console.error('❌ Failed to ensure General Chat exists:', error);
    }
  }

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
    try {
      // Find General Chat by name (no hardcoded UUID)
      const chatResult = await this.pool.query(
        'SELECT uuid FROM chats WHERE name = $1 LIMIT 1',
        ['General Chat']
      );

      if (chatResult.rows.length === 0) {
        console.error('❌ General Chat not found');
        return false;
      }

      const generalChatId = chatResult.rows[0].uuid;

      // Check if user is already a participant
      const isAlreadyParticipant = await this.chatDAO.isUserInChat(generalChatId, userUuid);
      if (isAlreadyParticipant) {
        console.log(`👥 User ${userUuid} already in General Chat`);
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
      
      await this.pool.query(query, [generalChatId, userUuid]);
      console.log(`✅ User ${userUuid} added to General Chat (${generalChatId})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to add user to General Chat:', error);
      return false;
    }
  }

  /**
   * Get General Chat info dynamically (no hardcoded UUIDs)
   */
  async getGeneralChat(): Promise<ChatType | null> {
    try {
      const result = await this.pool.query(
        'SELECT uuid, name, is_group, created_at FROM chats WHERE name = $1 LIMIT 1',
        ['General Chat']
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const chat = result.rows[0];
      return {
        id: chat.uuid,
        name: chat.name,
        isGroup: chat.is_group,
        createdAt: chat.created_at.toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to get General Chat:', error);
      return null;
    }
  }

  /**
   * Create async iterator for GraphQL subscriptions
   */
  messageAddedAsyncIterator(chatId: string) {
    return this.pubSub.asyncIterator(`MESSAGE_ADDED_${chatId}`);
  }
}