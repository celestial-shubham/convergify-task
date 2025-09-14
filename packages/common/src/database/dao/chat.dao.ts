import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database.provider';
import { IChat, IChatParticipant } from '../../interface/chat.interface';

@Injectable()
export class ChatDAO {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Create new chat
   */
  async createChat(name: string | null, isGroup: boolean, createdBy: number): Promise<IChat> {
    const query = `
      INSERT INTO chats (name, is_group, created_by) 
      VALUES ($1, $2, $3) 
      RETURNING id, uuid, name, description, is_group, created_by, created_at, updated_at
    `;
    
    const result = await this.pool.query(query, [name, isGroup, createdBy]);
    return this.mapRowToChat(result.rows[0]);
  }

  /**
   * Get chat by UUID
   */
  async getChatByUUID(uuid: string): Promise<IChat | null> {
    const query = `
      SELECT id, uuid, name, description, is_group, created_by, created_at, updated_at
      FROM chats 
      WHERE uuid = $1
    `;
    
    const result = await this.pool.query(query, [uuid]);
    return result.rows.length > 0 ? this.mapRowToChat(result.rows[0]) : null;
  }

  /**
   * Add user to chat
   */
  async addParticipant(chatId: number, userId: number, role: string = 'member'): Promise<IChatParticipant> {
    const query = `
      INSERT INTO chat_participants (chat_id, user_id, role) 
      VALUES ($1, $2, $3)
      ON CONFLICT (chat_id, user_id) DO UPDATE SET is_active = true
      RETURNING id, chat_id, user_id, joined_at, role, is_active
    `;
    
    const result = await this.pool.query(query, [chatId, userId, role]);
    return this.mapRowToParticipant(result.rows[0]);
  }

  /**
   * Get user's active chats
   */
  async getUserChats(userId: number): Promise<IChat[]> {
    const query = `
      SELECT c.id, c.uuid, c.name, c.description, c.is_group, c.created_by, c.created_at, c.updated_at
      FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = $1 AND cp.is_active = true
      ORDER BY c.updated_at DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(row => this.mapRowToChat(row));
  }

  /**
   * Check if user is participant of chat
   */
  async isUserInChat(chatUuid: string, userUuid: string): Promise<boolean> {
    const query = `
      SELECT 1 
      FROM chat_participants cp
      JOIN chats c ON cp.chat_id = c.id
      JOIN users u ON cp.user_id = u.id
      WHERE c.uuid = $1 AND u.uuid = $2 AND cp.is_active = true
    `;
    
    const result = await this.pool.query(query, [chatUuid, userUuid]);
    return result.rows.length > 0;
  }

  private mapRowToChat(row: any): IChat {
    return {
      id: row.id,
      uuid: row.uuid,
      name: row.name,
      description: row.description,
      isGroup: row.is_group,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToParticipant(row: any): IChatParticipant {
    return {
      id: row.id,
      chatId: row.chat_id,
      userId: row.user_id,
      joinedAt: row.joined_at,
      role: row.role,
      isActive: row.is_active,
    };
  }
}