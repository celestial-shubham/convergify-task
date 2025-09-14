// AI: Message Data Access Object (Claude assisted)
import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DATABASE_POOL, withTransaction } from '../database.provider';
import { IMessage, IMessageWithDetails } from '../../interface/message.interface';

@Injectable()
export class MessageDAO {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Send message with transaction (Phase 1 flow: INSERT -> COMMIT -> publish to Redis)
   */
  async sendMessage(chatUuid: string, senderUuid: string, content: string): Promise<IMessageWithDetails> {
    return withTransaction(this.pool, async (client: PoolClient) => {
      const query = `
        INSERT INTO messages (chat_id, sender_id, content)
        SELECT 
          (SELECT id FROM chats WHERE uuid = $1),
          (SELECT id FROM users WHERE uuid = $2),
          $3
        RETURNING id, uuid, chat_id, sender_id, content, message_type, metadata, created_at, updated_at, edited_at, is_deleted
      `;
      
      const result = await client.query(query, [chatUuid, senderUuid, content]);
      const message = this.mapRowToMessage(result.rows[0]);
      
      // Get additional details for GraphQL response
      const detailQuery = `
        SELECT 
          m.*, 
          c.uuid as chat_uuid,
          u.uuid as sender_uuid,
          u.username as sender_username
        FROM messages m
        JOIN chats c ON m.chat_id = c.id
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = $1
      `;
      
      const detailResult = await client.query(detailQuery, [message.id]);
      return this.mapRowToMessageWithDetails(detailResult.rows[0]);
    });
  }

  /**
   * Get chat history with user details
   */
  async getChatHistory(chatUuid: string, limit: number = 50, offset: number = 0): Promise<IMessageWithDetails[]> {
    const query = `
      SELECT 
        m.id, m.uuid, m.chat_id, m.sender_id, m.content, m.message_type, 
        m.metadata, m.created_at, m.updated_at, m.edited_at, m.is_deleted,
        c.uuid as chat_uuid,
        u.uuid as sender_uuid,
        u.username as sender_username
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      JOIN users u ON m.sender_id = u.id
      WHERE c.uuid = $1 AND m.is_deleted = false
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.pool.query(query, [chatUuid, limit, offset]);
    return result.rows.map(row => this.mapRowToMessageWithDetails(row));
  }

  /**
   * Get message by UUID
   */
  async getMessageByUUID(uuid: string): Promise<IMessage | null> {
    const query = `
      SELECT id, uuid, chat_id, sender_id, content, message_type, metadata, 
             created_at, updated_at, edited_at, is_deleted
      FROM messages 
      WHERE uuid = $1 AND is_deleted = false
    `;
    
    const result = await this.pool.query(query, [uuid]);
    return result.rows.length > 0 ? this.mapRowToMessage(result.rows[0]) : null;
  }

  /**
   * Edit message
   */
  async editMessage(uuid: string, newContent: string): Promise<IMessage | null> {
    const query = `
      UPDATE messages 
      SET content = $2, edited_at = NOW() 
      WHERE uuid = $1 AND is_deleted = false
      RETURNING id, uuid, chat_id, sender_id, content, message_type, metadata, 
                created_at, updated_at, edited_at, is_deleted
    `;
    
    const result = await this.pool.query(query, [uuid, newContent]);
    return result.rows.length > 0 ? this.mapRowToMessage(result.rows[0]) : null;
  }

  /**
   * Soft delete message
   */
  async deleteMessage(uuid: string): Promise<boolean> {
    const query = `
      UPDATE messages 
      SET is_deleted = true 
      WHERE uuid = $1 AND is_deleted = false
    `;
    
    const result = await this.pool.query(query, [uuid]);
    return result.rowCount ? true : false;
  }

  private mapRowToMessage(row: any): IMessage {
    return {
      id: row.id,
      uuid: row.uuid,
      chatId: row.chat_id,
      senderId: row.sender_id,
      content: row.content,
      messageType: row.message_type,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      editedAt: row.edited_at,
      isDeleted: row.is_deleted,
    };
  }

  private mapRowToMessageWithDetails(row: any): IMessageWithDetails {
    return {
      ...this.mapRowToMessage(row),
      chatUuid: row.chat_uuid,
      senderUuid: row.sender_uuid,
      senderUsername: row.sender_username,
    };
  }
}